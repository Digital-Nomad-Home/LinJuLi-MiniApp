import { action, observable } from 'mobx';

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface TransactionRecord {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
  currency: string;
  note: string;
  timestamp: number;
}

export class TransactionStore {
  @observable
  accessor users: User[] = [
    { id: '1', name: 'Alice (我)', avatar: 'user-o', role: '普通成员' },
    { id: '2', name: 'Bob (组长)', avatar: 'manager-o', role: '项目主导' },
    { id: '3', name: 'Charlie (群友)', avatar: 'friends-o', role: '开发人员' },
    { id: '4', name: 'Diana (财务)', avatar: 'service-o', role: '财务主管' }
  ];

  @observable
  accessor currencies: string[] = ['LJL', 'TARO', 'SOL'];

  // Initial balances setup for double-entry book-keeping tracking
  @observable
  accessor balances: Record<string, Record<string, number>> = {
    '1': { LJL: 1000, TARO: 500, SOL: 10 },
    '2': { LJL: 2000, TARO: 1000, SOL: 20 },
    '3': { LJL: 1500, TARO: 750, SOL: 15 },
    '4': { LJL: 800, TARO: 400, SOL: 8 }
  };

  @observable
  accessor transactions: TransactionRecord[] = [
    {
      id: 'tx-init-1',
      senderId: '4',
      senderName: 'Diana (财务)',
      receiverId: '1',
      receiverName: 'Alice (我)',
      amount: 100,
      currency: 'LJL',
      note: '初始空投奖励',
      timestamp: Date.now() - 3600000 * 24
    },
    {
      id: 'tx-init-2',
      senderId: '3',
      senderName: 'Charlie (群友)',
      receiverId: '2',
      receiverName: 'Bob (组长)',
      amount: 50,
      currency: 'TARO',
      note: '周报互助酬劳',
      timestamp: Date.now() - 3600000 * 12
    }
  ];

  // Starting total supplies to verify balance sheet balance (Double spend protection check)
  // Since we have a fixed total supply in this closed sandbox:
  // LJL: 1000+2000+1500+800 = 5300
  // TARO: 500+1000+750+400 = 2650
  // SOL: 10+20+15+8 = 53
  readonly initialTotalSupply: Record<string, number> = {
    LJL: 5300,
    TARO: 2650,
    SOL: 53
  };

  @action
  transfer(
    senderId: string,
    receiverId: string,
    amount: number,
    currency: string,
    note: string
  ): { success: boolean; message: string } {
    if (senderId === receiverId) {
      return { success: false, message: '不能转账给自己' };
    }
    if (!amount || amount <= 0) {
      return { success: false, message: '转账金额必须大于 0' };
    }
    if (
      !this.balances[senderId] ||
      this.balances[senderId][currency] === undefined
    ) {
      return { success: false, message: '发送方账户不存在或不支持该币种' };
    }
    if (
      !this.balances[receiverId] ||
      this.balances[receiverId][currency] === undefined
    ) {
      return { success: false, message: '接收方账户不存在或不支持该币种' };
    }

    const senderBalance = this.balances[senderId][currency];
    if (senderBalance < amount) {
      return {
        success: false,
        message: `余额不足，当前 ${currency} 余额为 ${senderBalance}`
      };
    }

    // Atomic Balance Change
    this.balances[senderId][currency] -= amount;
    this.balances[receiverId][currency] += amount;

    const sender = this.users.find(u => u.id === senderId);
    const receiver = this.users.find(u => u.id === receiverId);

    // Create traceable log
    const transaction: TransactionRecord = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderName: sender?.name || `用户${senderId}`,
      receiverId,
      receiverName: receiver?.name || `用户${receiverId}`,
      amount,
      currency,
      note: note || '无备注',
      timestamp: Date.now()
    };

    this.transactions = [transaction, ...this.transactions];

    return { success: true, message: '转账成功' };
  }

  // Audit helper to prove balance sheet balance
  get isBalanceSheetValid(): boolean {
    // Check for each currency if total sum of balances matches the constant supply
    for (const currency of this.currencies) {
      let sum = 0;
      for (const userId of Object.keys(this.balances)) {
        sum += this.balances[userId][currency] || 0;
      }
      if (Math.abs(sum - this.initialTotalSupply[currency]) > 0.0001) {
        return false;
      }
    }

    return true;
  }

  get totalSupplies(): Record<string, number> {
    const totals: Record<string, number> = {};
    for (const currency of this.currencies) {
      let sum = 0;
      for (const userId of Object.keys(this.balances)) {
        sum += this.balances[userId][currency] || 0;
      }
      totals[currency] = sum;
    }

    return totals;
  }
}

export default new TransactionStore();
