import { showModal,showToast } from '@tarojs/taro';
import { observer } from 'mobx-react';
import { useEffect,useState } from 'react';

import { MainNav } from '../components/MainNav';
import transactionStore from '../store/transaction';

definePageConfig({
  navigationBarTitleText: '自主代币交易与对账'
});

export default observer(() => {
  const {
    users,
    currencies,
    balances,
    transactions,
    totalSupplies,
    isBalanceSheetValid
  } = transactionStore;

  const [senderId, setSenderId] = useState('1'); // Default Alice
  const [receiverId, setReceiverId] = useState('2'); // Default Bob
  const [currency, setCurrency] = useState('LJL');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // Auto-switch receiver if it becomes the same as sender
  useEffect(() => {
    if (senderId === receiverId) {
      const nextReceiver = users.find(u => u.id !== senderId);
      if (nextReceiver) {
        setReceiverId(nextReceiver.id);
      }
    }
  }, [senderId, receiverId, users]);

  const activeSender = users.find(u => u.id === senderId);
  const activeSenderBalances = balances[senderId] || {};

  const handleTransfer = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast({
        title: '请输入有效金额',
        icon: 'error'
      });

      return;
    }

    const senderBalance = activeSenderBalances[currency] || 0;
    if (senderBalance < parsedAmount) {
      showToast({
        title: '余额不足',
        icon: 'error'
      });

      return;
    }

    const receiverName = users.find(u => u.id === receiverId)?.name || '';

    showModal({
      title: '转账确认',
      content: `确定从 [${activeSender?.name}] 转账 ${parsedAmount} ${currency} 给 [${receiverName}] 吗？`,
      success: res => {
        if (res.confirm) {
          const result = transactionStore.transfer(
            senderId,
            receiverId,
            parsedAmount,
            currency,
            note
          );
          if (result.success) {
            showToast({
              title: result.message,
              icon: 'success'
            });
            setAmount('');
            setNote('');
          } else {
            showModal({
              title: '转账失败',
              content: result.message,
              showCancel: false
            });
          }
        }
      }
    });
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const pad = (n: number) => n.toString().padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  return (
    <div className='min-h-screen bg-gray-50 pb-28 pt-4 px-4 font-sans text-gray-800'>
      {/* Header Card */}
      <div className='bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg mb-6'>
        <div className='text-xs opacity-85 uppercase tracking-wider font-semibold'>
          LinJuLi Token Network
        </div>
        <div className='text-2xl font-bold mt-1'>社区代币流转中心</div>
        <div className='text-xs opacity-75 mt-2 flex items-center gap-1'>
          <span>状态：微交易流转通道已开启 (无需悬赏任务依赖)</span>
        </div>
      </div>

      {/* Section 1: User Accounts & Balances */}
      <div className='bg-white rounded-2xl p-4 shadow-sm mb-6'>
        <div className='text-sm font-bold text-gray-900 mb-3 flex items-center justify-between'>
          <span>1. 模拟当前登录账户</span>
          <span className='text-xs font-normal text-gray-500'>
            点击下方卡片切换
          </span>
        </div>
        <div className='grid grid-cols-2 gap-3'>
          {users.map(u => {
            const isSelected = u.id === senderId;
            const uBalances = balances[u.id] || {};

            return (
              <button
                key={u.id}
                type='button'
                className={`relative cursor-pointer rounded-xl p-3 border-2 transition-all flex flex-col justify-between text-left w-full ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
                onClick={() => setSenderId(u.id)}
              >
                <div>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='font-bold text-sm text-gray-900'>
                      {u.name}
                    </span>
                  </div>
                  <div className='text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 inline-block'>
                    {u.role}
                  </div>
                </div>
                <div className='mt-2 pt-2 border-t border-dashed border-gray-100 text-xs space-y-1 text-gray-600 w-full'>
                  {currencies.map(curr => (
                    <div key={curr} className='flex justify-between w-full'>
                      <span>{curr}:</span>
                      <span className='font-semibold text-gray-900'>
                        {uBalances[curr] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
                {isSelected && (
                  <div className='absolute -top-2 -right-1 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm'>
                    已选
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Transfer Form */}
      <div className='bg-white rounded-2xl p-4 shadow-sm mb-6'>
        <div className='text-sm font-bold text-gray-900 mb-4'>2. 直接转账</div>

        {/* Receiver Select */}
        <div className='mb-4'>
          <div className='block text-xs font-bold text-gray-600 uppercase mb-2'>
            转账给 (收款方):
          </div>
          <div className='grid grid-cols-3 gap-2'>
            {users
              .filter(u => u.id !== senderId)
              .map(u => {
                const isSelected = u.id === receiverId;

                return (
                  <button
                    key={u.id}
                    type='button'
                    className={`cursor-pointer rounded-lg p-2 text-center border text-xs transition-all w-full ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setReceiverId(u.id)}
                  >
                    <div>{u.name}</div>
                    <div className='text-[9px] font-normal text-gray-500 mt-0.5'>
                      {u.role}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Currency Select */}
        <div className='mb-4'>
          <div className='block text-xs font-bold text-gray-600 uppercase mb-2'>
            选择币种:
          </div>
          <div className='flex gap-3'>
            {currencies.map(curr => {
              const isSelected = curr === currency;

              return (
                <button
                  key={curr}
                  type='button'
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-gray-900 border-gray-900 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setCurrency(curr)}
                >
                  {curr}
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Input */}
        <div className='mb-4'>
          <div className='block text-xs font-bold text-gray-600 uppercase mb-1.5'>
            转账金额:
          </div>
          <div className='relative flex items-center'>
            <span className='absolute left-3 text-sm font-bold text-gray-400'>
              {currency}
            </span>
            <input
              type='number'
              value={amount}
              placeholder='0.00'
              className='pl-14 pr-4 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-semibold'
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className='text-[10px] text-gray-500 mt-1 flex justify-between px-1'>
            <span>
              可用余额: {activeSenderBalances[currency] ?? 0} {currency}
            </span>
            <button
              type='button'
              className='text-blue-600 cursor-pointer font-medium hover:underline border-0 bg-transparent p-0'
              onClick={() =>
                setAmount(String(activeSenderBalances[currency] ?? 0))
              }
            >
              全部转出
            </button>
          </div>
        </div>

        {/* Note Input */}
        <div className='mb-5'>
          <div className='block text-xs font-bold text-gray-600 uppercase mb-1.5'>
            转账说明 / 场景备注:
          </div>
          <input
            type='text'
            value={note}
            placeholder='例如：免除本周周报、感谢协助排班等'
            className='px-4 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all'
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          type='button'
          className='w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer'
          onClick={handleTransfer}
        >
          <span>立即划转</span>
        </button>
      </div>

      {/* Section 3: Double-Entry Balance Sheet Auditor */}
      <div
        className={`rounded-2xl p-4 shadow-sm mb-6 border transition-all ${
          isBalanceSheetValid
            ? 'bg-emerald-50 border-emerald-100 text-emerald-950'
            : 'bg-rose-50 border-rose-100 text-rose-950'
        }`}
      >
        <div className='flex items-start gap-2.5'>
          <div
            className={`p-1.5 rounded-lg ${isBalanceSheetValid ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}
          >
            {isBalanceSheetValid ? (
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2.5'
                  d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                />
              </svg>
            ) : (
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2.5'
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            )}
          </div>
          <div className='flex-1'>
            <div className='text-sm font-bold flex items-center justify-between'>
              <span>资产对账审计与防双花校验</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isBalanceSheetValid
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {isBalanceSheetValid ? '对账：已平账' : '警告：账目异常'}
              </span>
            </div>
            <p className='text-xs opacity-85 mt-1 leading-relaxed'>
              系统实行严密的分布式微交易双重记账审计。当前各代币全网总流通量保持恒定，账目逻辑完美闭合，无异常双花或非授权增发行为：
            </p>

            <div className='mt-3 space-y-1.5 text-xs'>
              {currencies.map(curr => {
                const supply = totalSupplies[curr];
                const expected = transactionStore.initialTotalSupply[curr];
                const isValid = Math.abs(supply - expected) < 0.0001;

                return (
                  <div
                    key={curr}
                    className='flex justify-between items-center py-1 border-b border-dashed border-gray-200/50 last:border-0'
                  >
                    <span className='font-medium'>{curr} 流通总审计:</span>
                    <span className='font-bold flex items-center gap-1.5'>
                      <span>
                        {supply} / {expected}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${isValid ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Traceable Logs */}
      <div className='bg-white rounded-2xl p-4 shadow-sm mb-6'>
        <div className='text-sm font-bold text-gray-900 mb-3'>
          3. 交易账本流水 (全流程可追溯)
        </div>
        <div className='space-y-3 max-h-96 overflow-y-auto pr-1'>
          {transactions.length === 0 ? (
            <div className='text-center py-8 text-xs text-gray-400'>
              暂无交易流水
            </div>
          ) : (
            transactions.map(tx => (
              <div
                key={tx.id}
                className='bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs'
              >
                <div className='flex items-center justify-between mb-1.5'>
                  <div className='flex items-center gap-1 font-bold text-gray-900'>
                    <span className='text-blue-600'>{tx.senderName}</span>
                    <span className='text-gray-400 font-normal'>→</span>
                    <span className='text-indigo-600'>{tx.receiverName}</span>
                  </div>
                  <span className='font-bold text-gray-900 text-sm'>
                    {tx.amount} {tx.currency}
                  </span>
                </div>
                <div className='text-gray-600 flex items-start gap-1 mb-1'>
                  <span className='text-gray-400 font-medium'>备注说明:</span>
                  <span className='bg-white px-1.5 py-0.5 rounded border border-gray-200/50 break-all'>
                    {tx.note}
                  </span>
                </div>
                <div className='text-[10px] text-gray-400 flex justify-between pt-1 border-t border-gray-200/20'>
                  <span>时间: {formatTime(tx.timestamp)}</span>
                  <span className='font-mono opacity-80'>
                    流水单号: {tx.id.substring(3, 15)}...
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <MainNav path='transaction' />
    </div>
  );
});
