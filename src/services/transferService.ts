import axios, { AxiosResponse } from 'axios';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  decimals: number;
  minAmount: number;
  maxAmount: number;
  enabled: boolean;
}

export interface TransferRequest {
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
}

export interface TransferValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TransferResponse {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  reference?: string;
  createdAt: string;
  completedAt?: string;
  fee: number;
  exchangeRate?: number;
}

export interface UserBalance {
  userId: string;
  balances: {
    [currency: string]: {
      available: number;
      pending: number;
      total: number;
    };
  };
}

export interface TransferHistory {
  transfers: TransferResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: string;
}

class TransferService {
  private baseURL = process.env.REACT_APP_API_BASE_URL || '/api';

  // Get supported currencies
  async getSupportedCurrencies(): Promise<CurrencyConfig[]> {
    try {
      const response: AxiosResponse<CurrencyConfig[]> = await axios.get(
        `${this.baseURL}/transfer/currencies`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch supported currencies: ${error}`);
    }
  }

  // Get user balance
  async getUserBalance(userId: string): Promise<UserBalance> {
    try {
      const response: AxiosResponse<UserBalance> = await axios.get(
        `${this.baseURL}/transfer/balance/${userId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user balance: ${error}`);
    }
  }

  // Get exchange rates
  async getExchangeRates(fromCurrency?: string, toCurrency?: string): Promise<ExchangeRate[]> {
    try {
      const params = new URLSearchParams();
      if (fromCurrency) params.append('from', fromCurrency);
      if (toCurrency) params.append('to', toCurrency);

      const response: AxiosResponse<ExchangeRate[]> = await axios.get(
        `${this.baseURL}/transfer/exchange-rates?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch exchange rates: ${error}`);
    }
  }

  // Validate transfer before execution
  async validateTransfer(transferRequest: TransferRequest): Promise<TransferValidationResult> {
    try {
      const response: AxiosResponse<TransferValidationResult> = await axios.post(
        `${this.baseURL}/transfer/validate`,
        transferRequest
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to validate transfer: ${error}`);
    }
  }

  // Execute transfer
  async executeTransfer(transferRequest: TransferRequest): Promise<TransferResponse> {
    try {
      // Validate transfer first
      const validation = await this.validateTransfer(transferRequest);
      if (!validation.isValid) {
        throw new Error(`Transfer validation failed: ${validation.errors.join(', ')}`);
      }

      const response: AxiosResponse<TransferResponse> = await axios.post(
        `${this.baseURL}/transfer/execute`,
        transferRequest
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to execute transfer: ${error}`);
    }
  }

  // Get transfer by ID
  async getTransferById(transferId: string): Promise<TransferResponse> {
    try {
      const response: AxiosResponse<TransferResponse> = await axios.get(
        `${this.baseURL}/transfer/${transferId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch transfer: ${error}`);
    }
  }

  // Get transfer history
  async getTransferHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    currency?: string
  ): Promise<TransferHistory> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (status) params.append('status', status);
      if (currency) params.append('currency', currency);

      const response: AxiosResponse<TransferHistory> = await axios.get(
        `${this.baseURL}/transfer/history/${userId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch transfer history: ${error}`);
    }
  }

  // Cancel pending transfer
  async cancelTransfer(transferId: string): Promise<TransferResponse> {
    try {
      const response: AxiosResponse<TransferResponse> = await axios.patch(
        `${this.baseURL}/transfer/${transferId}/cancel`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel transfer: ${error}`);
    }
  }

  // Calculate transfer fee
  async calculateTransferFee(
    amount: number,
    currency: string,
    fromUserId: string,
    toUserId: string
  ): Promise<{ fee: number; total: number }> {
    try {
      const response: AxiosResponse<{ fee: number; total: number }> = await axios.post(
        `${this.baseURL}/transfer/calculate-fee`,
        { amount, currency, fromUserId, toUserId }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to calculate transfer fee: ${error}`);
    }
  }

  // Convert amount between currencies
  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ convertedAmount: number; rate: number }> {
    try {
      const response: AxiosResponse<{ convertedAmount: number; rate: number }> = await axios.post(
        `${this.baseURL}/transfer/convert`,
        { amount, fromCurrency, toCurrency }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to convert amount: ${error}`);
    }
  }

  // Get transfer limits for user
  async getTransferLimits(userId: string, currency: string): Promise<{
    dailyLimit: number;
    monthlyLimit: number;
    dailyUsed: number;
    monthlyUsed: number;
    remainingDaily: number;
    remainingMonthly: number;
  }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/transfer/limits/${userId}/${currency}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch transfer limits: ${error}`);
    }
  }

  // Validate user exists and can receive transfers
  async validateRecipient(userId: string): Promise<{
    isValid: boolean;
    userInfo?: {
      id: string;
      username: string;
      canReceiveTransfers: boolean;
    };
    error?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/transfer/validate-recipient/${userId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to validate recipient: ${error}`);
    }
  }
}

export default new TransferService();