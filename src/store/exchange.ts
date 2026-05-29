import { action, observable } from 'mobx';

export interface User {
  id: string;
  name: string;
  avatar: string;
  balances: {
    [key: string]: number;
    LJ: number;
    CNY: number;
    USDT: number;
  };
}

export interface TransactionPost {
  id: string;
  publisherId: string;
  sellCurrency: string;
  sellAmount: number;
  buyCurrency: string;
  buyAmount: number;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  buyerId?: string;
  createdAt: string;
}

export class ExchangeStore {
  @observable
  accessor users: User[] = [
    {
      id: 'alice',
      name: 'Alice (社群成员)',
      avatar: 'user-o',
      balances: { LJ: 1200, CNY: 80, USDT: 150 }
    },
    {
      id: 'bob',
      name: 'Bob (社群成员)',
      avatar: 'user-circle-o',
      balances: { LJ: 300, CNY: 650, USDT: 20 }
    },
    {
      id: 'charlie',
      name: 'Charlie (主理人/TL)',
      avatar: 'manager',
      balances: { LJ: 5000, CNY: 2000, USDT: 1000 }
    },
    {
      id: 'diana',
      name: 'Diana (社群成员)',
      avatar: 'service-o',
      balances: { LJ: 800, CNY: 150, USDT: 300 }
    }
  ];

  @observable
  accessor currentUserId = 'alice';

  @observable
  accessor posts: TransactionPost[] = [
    {
      id: 'post-1',
      publisherId: 'bob',
      sellCurrency: 'LJ',
      sellAmount: 200,
      buyCurrency: 'CNY',
      buyAmount: 20,
      description: '急需CNY，低价兑换LJ代币。私聊或直接成交。',
      status: 'pending',
      createdAt: '2026-05-29 10:00'
    },
    {
      id: 'post-2',
      publisherId: 'charlie',
      sellCurrency: 'CNY',
      sellAmount: 100,
      buyCurrency: 'LJ',
      buyAmount: 800,
      description: '主理人回购：高价回收LJ代币，支持长期交易。',
      status: 'pending',
      createdAt: '2026-05-29 10:15'
    }
  ];

  get currentUser(): User {
    return this.users.find(u => u.id === this.currentUserId) || this.users[0];
  }

  @action
  setCurrentUser(userId: string) {
    this.currentUserId = userId;
  }

  @action
  createPost(
    sellCurrency: string,
    sellAmount: number,
    buyCurrency: string,
    buyAmount: number,
    description: string
  ) {
    const user = this.currentUser;
    const curBalance = user.balances[sellCurrency] || 0;
    if (curBalance < sellAmount) {
      throw new Error(`余额不足！您当前只有 ${curBalance} ${sellCurrency}`);
    }

    // Deduct sell amount (escrow)
    user.balances[sellCurrency] -= sellAmount;

    const newPost: TransactionPost = {
      id: `post-${Date.now()}`,
      publisherId: user.id,
      sellCurrency,
      sellAmount,
      buyCurrency,
      buyAmount,
      description,
      status: 'pending',
      createdAt: new Date().toLocaleString()
    };

    this.posts.unshift(newPost);
  }

  @action
  acceptPost(postId: string) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) throw new Error('交易帖不存在');
    if (post.status !== 'pending') throw new Error('交易已结束或已取消');

    const buyer = this.currentUser;
    if (buyer.id === post.publisherId) {
      throw new Error('不能成交自己发布的交易帖');
    }

    const seller = this.users.find(u => u.id === post.publisherId);
    if (!seller) throw new Error('发布者不存在');

    // Buyer pays buyAmount of buyCurrency
    const buyerBuyBalance = buyer.balances[post.buyCurrency] || 0;
    if (buyerBuyBalance < post.buyAmount) {
      throw new Error(
        `余额不足！您需要 ${post.buyAmount} ${post.buyCurrency} 来成交此单，当前余额为 ${buyerBuyBalance}`
      );
    }

    // Process balances
    buyer.balances[post.buyCurrency] -= post.buyAmount;
    seller.balances[post.buyCurrency] += post.buyAmount;

    buyer.balances[post.sellCurrency] += post.sellAmount;
    // Note: Seller's sellCurrency was already deducted and put in escrow when creating the post

    post.status = 'completed';
    post.buyerId = buyer.id;
  }

  @action
  cancelPost(postId: string) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) throw new Error('交易帖不存在');
    if (post.status !== 'pending') throw new Error('交易不可取消');

    const user = this.currentUser;
    if (post.publisherId !== user.id) {
      throw new Error('只有发布者可以取消交易帖');
    }

    // Refund locked sellCurrency to seller
    user.balances[post.sellCurrency] += post.sellAmount;

    post.status = 'cancelled';
  }
}

export default new ExchangeStore();
