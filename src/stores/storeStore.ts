import { makeAutoObservable, runInAction } from 'mobx';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  transactionHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'reward' | 'refund';
  amount: number;
  description: string;
  relatedPurchaseId?: string;
  transactionHash?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

class StoreStore {
  products: Product[] = [];
  purchases: Purchase[] = [];
  tokenTransactions: TokenTransaction[] = [];
  userTokenBalance: number = 0;
  loading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Products
  async fetchProducts() {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await fetch('/api/store/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const products = await response.json();
      runInAction(() => {
        this.products = products;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.loading = false;
      });
    }
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch('/api/store/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (!response.ok) throw new Error('Failed to create product');

      const newProduct = await response.json();
      runInAction(() => {
        this.products.push(newProduct);
        this.loading = false;
      });

      return newProduct;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.loading = false;
      });
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>) {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(`/api/store/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update product');

      const updatedProduct = await response.json();
      runInAction(() => {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
          this.products[index] = updatedProduct;
        }
        this.loading = false;
      });

      return updatedProduct;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.loading = false;
      });
      throw error;
    }
  }

  async deleteProduct(id: string) {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(`/api/store/products/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete product');

      runInAction(() => {
        this.products = this.products.filter(p => p.id !== id);
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.loading = false;
      });
      throw error;
    }
  }

  // Purchases
  async fetchUserPurchases(userId: string) {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(`/api/store/purchases?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch purchases');

      const purchases = await response.json();
      runInAction(() => {
        this.purchases = purchases;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.loading = false;
      });
    }
  }

  async purchaseProduct(productId: string, quantity: number = 1) {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to purchase product');
      }

      const purchase = await response.json();
      runInAction(() => {
        this.purchases.unshift(purchase);
        this.userTokenBalance -= purchase.totalPrice;
        // Update product stock
        const product = this.products.find(p => p.id === productId);
        if (product) {
          product.stock -= quantity;
        }
        this.loading = false;
      });

      return purchase;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.loading = false;
      });
      throw error;
    }
  }

  // Token Balance
  async fetchUserTokenBalance(userId: string) {
    try {
      const response = await fetch(`/api/store/balance/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch token balance');

      const { balance } = await response.json();
      runInAction(() => {
        this.userTokenBalance = balance;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      });
    }
  }

  // Token Transactions
  async fetchTokenTransactions(userId: string) {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(`/api/store/transactions?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');

      const transactions = await response.json();
      runInAction(() => {
        this.tokenTransactions = transactions;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.loading = false;
      });
    }
  }

  // Computed values
  get activeProducts() {
    return this.products.filter(product => product.isActive && product.stock > 0);
  }

  get productsByCategory() {
    return this.activeProducts.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }

  get totalPurchaseValue() {
    return this.purchases.reduce((total, purchase) => {
      return purchase.status === 'completed' ? total + purchase.totalPrice : total;
    }, 0);
  }

  get pendingPurchases() {
    return this.purchases.filter(purchase => purchase.status === 'pending');
  }

  getProductById(id: string) {
    return this.products.find(product => product.id === id);
  }

  canPurchaseProduct(productId: string, quantity: number = 1) {
    const product = this.getProductById(productId);
    if (!product) return { canPurchase: false, reason: 'Product not found' };
    
    if (!product.isActive) return { canPurchase: false, reason: 'Product is not active' };
    if (product.stock < quantity) return { canPurchase: false, reason: 'Insufficient stock' };
    
    const totalCost = product.price * quantity;
    if (this.userTokenBalance < totalCost) {
      return { canPurchase: false, reason: 'Insufficient tokens' };
    }

    return { canPurchase: true, reason: null };
  }

  clearError() {
    this.error = null;
  }

  reset() {
    this.products = [];
    this.purchases = [];
    this.tokenTransactions = [];
    this.userTokenBalance = 0;
    this.loading = false;
    this.error = null;
  }
}

export const storeStore = new StoreStore();