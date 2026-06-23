import { action, computed, observable } from 'mobx';

export type CurrencyCode = 'DNP' | 'POINT' | 'TOKEN';

export interface LedgerAccount {
  id: string;
  name: string;
  balances: Record<CurrencyCode, number>;
}

export interface LedgerTransaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  currency: CurrencyCode;
  amount: number;
  memo: string;
  createdAt: string;
}

const currencies: CurrencyCode[] = ['DNP', 'POINT', 'TOKEN'];

const initialAccounts: LedgerAccount[] = [
  {
    id: 'member-a',
    name: '组员 A',
    balances: { DNP: 500, POINT: 120, TOKEN: 40 }
  },
  {
    id: 'leader',
    name: '组长',
    balances: { DNP: 300, POINT: 40, TOKEN: 20 }
  },
  {
    id: 'member-b',
    name: '组员 B',
    balances: { DNP: 220, POINT: 260, TOKEN: 80 }
  }
];

const initialSupply = initialAccounts.reduce(
  (total, account) => {
    currencies.forEach(currency => {
      total[currency] += account.balances[currency];
    });

    return total;
  },
  { DNP: 0, POINT: 0, TOKEN: 0 } as Record<CurrencyCode, number>
);

export class LedgerStore {
  readonly currencies = currencies;

  @observable
  accessor accounts = initialAccounts;

  @observable
  accessor transactions: LedgerTransaction[] = [];

  @computed
  get totals() {
    return this.accounts.reduce(
      (total, account) => {
        this.currencies.forEach(currency => {
          total[currency] += account.balances[currency];
        });

        return total;
      },
      { DNP: 0, POINT: 0, TOKEN: 0 } as Record<CurrencyCode, number>
    );
  }

  @computed
  get isBalanced() {
    return this.currencies.every(
      currency => this.totals[currency] === initialSupply[currency]
    );
  }

  getAccount(id: string) {
    return this.accounts.find(({ id: accountId }) => accountId === id);
  }

  @action
  transfer(
    fromUserId: string,
    toUserId: string,
    currency: CurrencyCode,
    amount: number,
    memo: string
  ) {
    if (!Number.isFinite(amount) || amount <= 0)
      throw new Error('转账金额必须大于 0');
    if (fromUserId === toUserId) throw new Error('不能给自己转账');

    const fromAccount = this.getAccount(fromUserId);
    const toAccount = this.getAccount(toUserId);

    if (!fromAccount || !toAccount) throw new Error('转账账户不存在');
    if (fromAccount.balances[currency] < amount)
      throw new Error(`${fromAccount.name} 的 ${currency} 余额不足`);

    fromAccount.balances[currency] -= amount;
    toAccount.balances[currency] += amount;

    this.transactions.unshift({
      id: `tx-${Date.now()}`,
      fromUserId,
      toUserId,
      currency,
      amount,
      memo: memo.trim(),
      createdAt: new Date().toISOString()
    });
  }
}

export default new LedgerStore();
