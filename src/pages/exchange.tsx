import { Button, Popup } from '@antmjs/vantui';
import { showToast } from '@tarojs/taro';
import { observer } from 'mobx-react';
import { useState } from 'react';

import { MainNav } from '../components/MainNav';
import exchangeStore, { TransactionPost } from '../store/exchange';

definePageConfig({
  navigationBarTitleText: '代币交易所'
});

export default observer(() => {
  const { users, currentUser, posts } = exchangeStore;

  // UI state
  const [activeTab, setActiveTab] = useState<
    'all' | 'pending' | 'my' | 'related'
  >('all');
  const [isUserSelectorOpen, setUserSelectorOpen] = useState(false);
  const [isPublishOpen, setPublishOpen] = useState(false);

  // Form state
  const [sellCurrency, setSellCurrency] = useState<'LJ' | 'CNY' | 'USDT'>('LJ');
  const [sellAmount, setSellAmount] = useState('');
  const [buyCurrency, setBuyCurrency] = useState<'LJ' | 'CNY' | 'USDT'>('CNY');
  const [buyAmount, setBuyAmount] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Handle user change
  const selectUser = (userId: string) => {
    exchangeStore.setCurrentUser(userId);
    setUserSelectorOpen(false);
  };

  // Handle post creation
  const handlePublish = () => {
    setFormError('');
    const sAmt = parseFloat(sellAmount);
    const bAmt = parseFloat(buyAmount);

    if (isNaN(sAmt) || sAmt <= 0) {
      setFormError('请输入有效的出售数量');

      return;
    }
    if (isNaN(bAmt) || bAmt <= 0) {
      setFormError('请输入有效的兑换数量');

      return;
    }
    if (sellCurrency === buyCurrency) {
      setFormError('出售代币与兑换代币不能相同');

      return;
    }

    try {
      exchangeStore.createPost(
        sellCurrency,
        sAmt,
        buyCurrency,
        bAmt,
        description || `使用 ${sellCurrency} 兑换 ${buyCurrency}`
      );
      // Reset form & close
      setSellAmount('');
      setBuyAmount('');
      setDescription('');
      setPublishOpen(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setFormError(errMsg || '发布失败');
    }
  };

  // Handle post accept
  const handleAccept = (post: TransactionPost) => {
    try {
      exchangeStore.acceptPost(post.id);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      // Show simple alert on error
      console.error(err);
      showToast({
        title: errMsg,
        icon: 'none',
        duration: 2000
      });
    }
  };

  // Handle post cancel
  const handleCancel = (post: TransactionPost) => {
    try {
      exchangeStore.cancelPost(post.id);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast({
        title: errMsg,
        icon: 'none',
        duration: 2000
      });
    }
  };

  // Filter posts based on tab
  const filteredPosts = posts.filter(post => {
    if (activeTab === 'pending') {
      return post.status === 'pending';
    }
    if (activeTab === 'my') {
      return post.publisherId === currentUser.id;
    }
    if (activeTab === 'related') {
      return (
        post.publisherId === currentUser.id || post.buyerId === currentUser.id
      );
    }

    return true; // all
  });

  return (
    <div className='min-h-screen bg-slate-50 pb-28 font-sans'>
      {/* 1. Header user card */}
      <div className='relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white shadow-lg rounded-b-[2rem]'>
        {/* Decorative background lights */}
        <div className='absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl' />
        <div className='absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-xl' />

        {/* User Profile */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-xl font-bold shadow-inner border border-white/10'>
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className='text-xs text-indigo-200'>当前操作账户</div>
              <div className='text-base font-bold flex items-center gap-1'>
                {currentUser.name}
              </div>
            </div>
          </div>

          <button
            className='flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md transition-all active:scale-95 border border-white/20'
            onClick={() => setUserSelectorOpen(true)}
          >
            切换账户 🔄
          </button>
        </div>

        {/* Balance Area */}
        <div className='rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10'>
          <div className='text-xs text-indigo-200 mb-3 font-medium'>
            我的代币余额
          </div>
          <div className='grid grid-cols-3 gap-2 text-center'>
            <div className='border-r border-white/10 last:border-0'>
              <div className='text-xs text-indigo-200'>LJ (邻居币)</div>
              <div className='text-lg font-bold tracking-tight mt-1 text-yellow-300'>
                {currentUser.balances.LJ.toLocaleString()}
              </div>
            </div>
            <div className='border-r border-white/10 last:border-0'>
              <div className='text-xs text-indigo-200'>CNY (人民币)</div>
              <div className='text-lg font-bold tracking-tight mt-1 text-emerald-300'>
                ¥{currentUser.balances.CNY.toLocaleString()}
              </div>
            </div>
            <div className='last:border-0'>
              <div className='text-xs text-indigo-200'>USDT</div>
              <div className='text-lg font-bold tracking-tight mt-1 text-teal-300'>
                ${currentUser.balances.USDT.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-navigation tabs */}
      <div className='mx-4 -mt-3 mb-6 bg-white rounded-xl shadow-md p-1 flex justify-around border border-slate-100 z-10 relative'>
        {(
          [
            { key: 'all', label: '全部交易' },
            { key: 'pending', label: '进行中' },
            { key: 'my', label: '我的发布' },
            { key: 'related', label: '交易记录' }
          ] as const
        ).map(tab => (
          <button
            key={tab.key}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Transaction posts list */}
      <div className='px-4 space-y-4'>
        {filteredPosts.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100 p-6'>
            <span className='text-4xl mb-2'>📋</span>
            <div className='text-sm font-medium'>暂无相关交易帖</div>
            <div className='text-xs text-slate-300 mt-1'>
              点击右下角发布一个新交易吧
            </div>
          </div>
        ) : (
          filteredPosts.map(post => {
            const seller = users.find(u => u.id === post.publisherId);
            const buyer = post.buyerId
              ? users.find(u => u.id === post.buyerId)
              : null;
            const isOwnPost = post.publisherId === currentUser.id;

            return (
              <div
                key={post.id}
                className='bg-white rounded-2xl p-4 shadow-sm border border-slate-100/80 hover:shadow-md transition-shadow relative overflow-hidden'
              >
                {/* Background tag indicating own/other */}
                {isOwnPost && (
                  <div className='absolute top-0 right-0 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg'>
                    我的发布
                  </div>
                )}

                {/* Top: Publisher & Info */}
                <div className='flex items-center gap-3 border-b border-slate-100 pb-3 mb-3'>
                  <div className='w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs'>
                    {seller?.name.charAt(0) || '👤'}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-xs font-bold text-slate-800 truncate'>
                      {seller?.name || '未知用户'}
                    </div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>
                      {post.createdAt}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {post.status === 'pending' && (
                      <span className='inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10'>
                        待成交
                      </span>
                    )}
                    {post.status === 'completed' && (
                      <span className='inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10'>
                        已成交
                      </span>
                    )}
                    {post.status === 'cancelled' && (
                      <span className='inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'>
                        已撤销
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Swap Details */}
                <div className='bg-slate-50 rounded-xl p-3 flex items-center justify-between gap-2 mb-3'>
                  {/* Sell */}
                  <div className='flex-1 text-center'>
                    <div className='text-[10px] text-slate-400 uppercase font-semibold'>
                      出售
                    </div>
                    <div className='text-base font-black text-rose-500 mt-1 truncate'>
                      {post.sellAmount}{' '}
                      <span className='text-xs font-bold'>
                        {post.sellCurrency}
                      </span>
                    </div>
                  </div>

                  {/* Swap Icon */}
                  <div className='flex flex-col items-center justify-center px-2'>
                    <span className='text-lg'>🔄</span>
                  </div>

                  {/* Buy */}
                  <div className='flex-1 text-center'>
                    <div className='text-[10px] text-slate-400 uppercase font-semibold'>
                      想要
                    </div>
                    <div className='text-base font-black text-emerald-600 mt-1 truncate'>
                      {post.buyAmount}{' '}
                      <span className='text-xs font-bold'>
                        {post.buyCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className='text-xs text-slate-600 bg-slate-50/50 rounded-lg p-2.5 mb-3 italic border border-slate-100/50'>
                  💬 {post.description}
                </div>

                {/* Bottom: Transaction details & Action buttons */}
                <div className='flex items-center justify-between gap-3 pt-1'>
                  <div className='text-[10px] text-slate-400 truncate max-w-[50%]'>
                    {post.status === 'completed' && buyer && (
                      <span className='text-slate-500 font-medium'>
                        成交伙伴: {buyer.name}
                      </span>
                    )}
                  </div>

                  <div className='flex gap-2 justify-end flex-1'>
                    {post.status === 'pending' && (
                      <>
                        {isOwnPost ? (
                          <Button
                            size='small'
                            type='danger'
                            className='!rounded-full px-4'
                            onClick={() => handleCancel(post)}
                          >
                            撤单
                          </Button>
                        ) : (
                          <Button
                            size='small'
                            type='primary'
                            className='!bg-gradient-to-r !from-indigo-600 !to-purple-600 !border-0 !rounded-full px-4 font-bold shadow-sm'
                            onClick={() => handleAccept(post)}
                          >
                            一键成交
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating publish button */}
      <button
        className='fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 z-50 border border-white/20'
        onClick={() => {
          setFormError('');
          setPublishOpen(true);
        }}
      >
        <span className='text-2xl font-semibold'>＋</span>
      </button>

      {/* 4. Switch user popup */}
      <Popup
        show={isUserSelectorOpen}
        position='bottom'
        style={{
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          backgroundColor: '#f8fafc'
        }}
        onClose={() => setUserSelectorOpen(false)}
      >
        <div className='p-6'>
          <div className='text-center font-bold text-base text-slate-800 mb-1'>
            切换操作账户
          </div>
          <div className='text-center text-xs text-slate-400 mb-6'>
            切换身份以模拟不同成员间的代币交易
          </div>

          <div className='space-y-3'>
            {users.map(u => {
              const isSelected = u.id === currentUser.id;

              return (
                <button
                  key={u.id}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white active:bg-slate-50'
                  }`}
                  onClick={() => selectUser(u.id)}
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm'>
                      {u.name.charAt(0)}
                    </div>
                    <div className='text-left'>
                      <div className='text-sm font-bold text-slate-800'>
                        {u.name}
                      </div>
                      <div className='text-[10px] text-slate-400 mt-0.5'>
                        余额: LJ {u.balances.LJ} | CNY ¥{u.balances.CNY}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className='text-indigo-600 text-sm font-bold'>
                      当前活跃 ✅
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            className='w-full mt-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl transition-all'
            onClick={() => setUserSelectorOpen(false)}
          >
            取消
          </button>
        </div>
      </Popup>

      {/* 5. Publish post popup */}
      <Popup
        show={isPublishOpen}
        position='bottom'
        style={{
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          backgroundColor: '#f8fafc'
        }}
        onClose={() => setPublishOpen(false)}
      >
        <div className='p-6 pb-8'>
          <div className='text-center font-bold text-base text-slate-800 mb-1'>
            发布代币交易帖
          </div>
          <div className='text-center text-xs text-slate-400 mb-6'>
            支持私下代币兑换或主理人溢价回购
          </div>

          {/* Form container */}
          <div className='space-y-5 bg-white p-4 rounded-2xl border border-slate-100'>
            {/* Sell token currency type selector */}
            <div>
              <div className='block text-xs font-bold text-slate-500 mb-2'>
                1. 选择出售代币
              </div>
              <div className='grid grid-cols-3 gap-2'>
                {(['LJ', 'CNY', 'USDT'] as const).map(c => (
                  <button
                    key={c}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      sellCurrency === c
                        ? 'bg-rose-50 border-rose-500 text-rose-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={() => setSellCurrency(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Sell token amount */}
            <div>
              <div className='block text-xs font-bold text-slate-500 mb-1'>
                2. 出售数量
              </div>
              <div className='relative flex items-center border border-slate-200 rounded-lg px-3 py-2 focus-within:border-indigo-500 transition-all'>
                <input
                  type='digit'
                  placeholder='0.00'
                  value={sellAmount}
                  className='w-full text-sm font-bold text-slate-800 focus:outline-none'
                  onInput={e => {
                    const ev = e as unknown as {
                      detail?: { value?: string };
                      target?: { value?: string };
                    };
                    setSellAmount(ev.detail?.value || ev.target?.value || '');
                  }}
                />
                <span className='text-xs font-bold text-slate-400 ml-2'>
                  {sellCurrency}
                </span>
              </div>
              <div className='text-[10px] text-slate-400 mt-1 flex justify-between'>
                <span>
                  当前可用余额: {currentUser.balances[sellCurrency] || 0}{' '}
                  {sellCurrency}
                </span>
                <button
                  type='button'
                  className='text-indigo-600 font-semibold cursor-pointer bg-transparent border-0 p-0 text-[10px]'
                  onClick={() =>
                    setSellAmount(
                      (currentUser.balances[sellCurrency] || 0).toString()
                    )
                  }
                >
                  全部
                </button>
              </div>
            </div>

            {/* Wanted token currency type selector */}
            <div>
              <div className='block text-xs font-bold text-slate-500 mb-2'>
                3. 想要换回的代币
              </div>
              <div className='grid grid-cols-3 gap-2'>
                {(['LJ', 'CNY', 'USDT'] as const).map(c => (
                  <button
                    key={c}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      buyCurrency === c
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={() => setBuyCurrency(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Wanted token amount */}
            <div>
              <div className='block text-xs font-bold text-slate-500 mb-1'>
                4. 想要数量
              </div>
              <div className='relative flex items-center border border-slate-200 rounded-lg px-3 py-2 focus-within:border-indigo-500 transition-all'>
                <input
                  type='digit'
                  placeholder='0.00'
                  value={buyAmount}
                  className='w-full text-sm font-bold text-slate-800 focus:outline-none'
                  onInput={e => {
                    const ev = e as unknown as {
                      detail?: { value?: string };
                      target?: { value?: string };
                    };
                    setBuyAmount(ev.detail?.value || ev.target?.value || '');
                  }}
                />
                <span className='text-xs font-bold text-slate-400 ml-2'>
                  {buyCurrency}
                </span>
              </div>
            </div>

            {/* Description/Terms */}
            <div>
              <div className='block text-xs font-bold text-slate-500 mb-1'>
                5. 备注说明 (选填)
              </div>
              <div className='border border-slate-200 rounded-lg p-2 focus-within:border-indigo-500 transition-all'>
                <textarea
                  placeholder='例如：急需CNY换取LJ代币；或者私聊交易条款等'
                  value={description}
                  className='w-full text-xs text-slate-700 min-h-[60px] focus:outline-none resize-none'
                  onInput={e => {
                    const ev = e as unknown as { target?: { value?: string } };
                    setDescription(ev.target?.value || '');
                  }}
                />
              </div>
            </div>
          </div>

          {/* Form error warning */}
          {formError && (
            <div className='mt-4 p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100 flex items-center gap-2'>
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className='mt-6 grid grid-cols-2 gap-3'>
            <button
              className='py-3 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl active:bg-slate-50 transition-all'
              onClick={() => setPublishOpen(false)}
            >
              取消
            </button>
            <button
              className='py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl shadow-md active:opacity-90 transition-all'
              onClick={handlePublish}
            >
              确认发布交易
            </button>
          </div>
        </div>
      </Popup>

      <MainNav path='exchange' />
    </div>
  );
});
