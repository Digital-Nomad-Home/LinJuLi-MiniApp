import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'payment' | 'reward'
  amount: number
  description: string
  timestamp: Date
  status: 'pending' | 'completed' | 'failed'
  relatedBountyId?: string
  fromUserId?: string
  toUserId?: string
}

export interface WalletState {
  balance: number
  transactions: Transaction[]
  isLoading: boolean
}

export const useWalletStore = defineStore('wallet', () => {
  const balance = ref(0)
  const transactions = ref<Transaction[]>([])
  const isLoading = ref(false)

  const pendingTransactions = computed(() => 
    transactions.value.filter(t => t.status === 'pending')
  )

  const completedTransactions = computed(() => 
    transactions.value.filter(t => t.status === 'completed')
  )

  const totalPendingAmount = computed(() => 
    pendingTransactions.value.reduce((sum, t) => {
      return t.type === 'withdrawal' ? sum + t.amount : sum
    }, 0)
  )

  const availableBalance = computed(() => balance.value - totalPendingAmount.value)

  // Transfer methods
  async function deposit(amount: number, description = '充值') {
    isLoading.value = true
    try {
      const transaction: Transaction = {
        id: generateTransactionId(),
        type: 'deposit',
        amount,
        description,
        timestamp: new Date(),
        status: 'pending'
      }
      
      transactions.value.unshift(transaction)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      transaction.status = 'completed'
      balance.value += amount
      
      return transaction
    } catch (error) {
      console.error('Deposit failed:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function withdraw(amount: number, description = '提现') {
    if (amount > availableBalance.value) {
      throw new Error('余额不足')
    }

    isLoading.value = true
    try {
      const transaction: Transaction = {
        id: generateTransactionId(),
        type: 'withdrawal',
        amount,
        description,
        timestamp: new Date(),
        status: 'pending'
      }
      
      transactions.value.unshift(transaction)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      transaction.status = 'completed'
      balance.value -= amount
      
      return transaction
    } catch (error) {
      console.error('Withdrawal failed:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function payBounty(bountyId: string, toUserId: string, amount: number) {
    if (amount > availableBalance.value) {
      throw new Error('余额不足')
    }

    isLoading.value = true
    try {
      const transaction: Transaction = {
        id: generateTransactionId(),
        type: 'payment',
        amount,
        description: `支付悬赏奖金`,
        timestamp: new Date(),
        status: 'pending',
        relatedBountyId: bountyId,
        toUserId
      }
      
      transactions.value.unshift(transaction)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      transaction.status = 'completed'
      balance.value -= amount
      
      return transaction
    } catch (error) {
      console.error('Payment failed:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function receiveReward(bountyId: string, fromUserId: string, amount: number) {
    isLoading.value = true
    try {
      const transaction: Transaction = {
        id: generateTransactionId(),
        type: 'reward',
        amount,
        description: `获得悬赏奖励`,
        timestamp: new Date(),
        status: 'pending',
        relatedBountyId: bountyId,
        fromUserId
      }
      
      transactions.value.unshift(transaction)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      transaction.status = 'completed'
      balance.value += amount
      
      return transaction
    } catch (error) {
      console.error('Receive reward failed:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadTransactionHistory(page = 1, limit = 20) {
    isLoading.value = true
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In real implementation, this would fetch from API
      // For now, return existing transactions
      return transactions.value.slice((page - 1) * limit, page * limit)
    } catch (error) {
      console.error('Load transaction history failed:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function getTransactionsByBountyId(bountyId: string) {
    return transactions.value.filter(t => t.relatedBountyId === bountyId)
  }

  function generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  function updateTransactionStatus(transactionId: string, status: Transaction['status']) {
    const transaction = transactions.value.find(t => t.id === transactionId)
    if (transaction) {
      transaction.status = status
    }
  }

  return {
    // State
    balance,
    transactions,
    isLoading,
    
    // Computed
    pendingTransactions,
    completedTransactions,
    totalPendingAmount,
    availableBalance,
    
    // Actions
    deposit,
    withdraw,
    payBounty,
    receiveReward,
    loadTransactionHistory,
    getTransactionsByBountyId,
    updateTransactionStatus
  }
})