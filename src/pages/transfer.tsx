import {
  Button,
  Cell,
  CellGroup,
  Field,
  Form,
  Picker,
  Popup,
  Toast
} from '@antmjs/vantui';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Component } from 'react';

import { MainNav } from '../components/MainNav';
import ledgerStore, { CurrencyCode } from '../store/ledger';

definePageConfig({
  navigationBarTitleText: '交易'
});

@observer
export default class TransferPage extends Component {
  @observable
  accessor fromUserId = 'member-a';

  @observable
  accessor toUserId = 'leader';

  @observable
  accessor currency: CurrencyCode = 'DNP';

  @observable
  accessor amount = '100';

  @observable
  accessor memo = '周报豁免一次';

  @observable
  accessor pickerType: 'from' | 'to' | 'currency' | '' = '';

  get fromAccount() {
    return ledgerStore.getAccount(this.fromUserId);
  }

  get toAccount() {
    return ledgerStore.getAccount(this.toUserId);
  }

  get accountOptions() {
    return ledgerStore.accounts.map(({ id, name }) => ({
      text: name,
      value: id
    }));
  }

  get currencyOptions() {
    return ledgerStore.currencies.map(currency => ({
      text: currency,
      value: currency
    }));
  }

  submit = () => {
    try {
      ledgerStore.transfer(
        this.fromUserId,
        this.toUserId,
        this.currency,
        Number(this.amount),
        this.memo
      );
      Toast.show({ type: 'success', message: '交易已记录' });
    } catch (error) {
      Toast.show({
        type: 'fail',
        message: error instanceof Error ? error.message : '交易失败'
      });
    }
  };

  renderPicker() {
    const { pickerType } = this;
    if (!pickerType) return null;

    const columns =
      pickerType === 'currency' ? this.currencyOptions : this.accountOptions;

    return (
      <Popup
        show
        round
        position='bottom'
        onClose={() => {
          this.pickerType = '';
        }}
      >
        <Picker
          columns={columns}
          onCancel={() => {
            this.pickerType = '';
          }}
          onConfirm={({ detail }) => {
            const value = detail.value as string;
            if (pickerType === 'from') this.fromUserId = value;
            if (pickerType === 'to') this.toUserId = value;
            if (pickerType === 'currency')
              this.currency = value as CurrencyCode;
            this.pickerType = '';
          }}
        />
      </Popup>
    );
  }

  render() {
    const { fromAccount, toAccount, currency } = this;

    return (
      <div className='min-h-screen bg-gray-50 pb-20'>
        <Form>
          <CellGroup title='发起交易'>
            <Cell
              title='付款方'
              label={`${fromAccount?.name ?? ''} 当前余额：${fromAccount?.balances[currency] ?? 0} ${currency}`}
              isLink
              onClick={() => {
                this.pickerType = 'from';
              }}
            />
            <Cell
              title='收款方'
              label={toAccount?.name}
              isLink
              onClick={() => {
                this.pickerType = 'to';
              }}
            />
            <Cell
              title='币种'
              label={currency}
              isLink
              onClick={() => {
                this.pickerType = 'currency';
              }}
            />
            <Field
              label='金额'
              type='number'
              value={this.amount}
              onInput={({ detail }) => {
                this.amount = detail;
              }}
            />
            <Field
              label='备注'
              value={this.memo}
              onInput={({ detail }) => {
                this.memo = detail;
              }}
            />
            <div className='p-4'>
              <Button block type='primary' onClick={this.submit}>
                确认转账
              </Button>
            </div>
          </CellGroup>
        </Form>

        <CellGroup title='账本审计'>
          {ledgerStore.currencies.map(currency => (
            <Cell
              key={currency}
              title={currency}
              label={`总量：${ledgerStore.totals[currency]}`}
            />
          ))}
          <Cell
            title='账本平衡'
            label={ledgerStore.isBalanced ? '正常' : '异常'}
          />
        </CellGroup>

        <CellGroup title='交易记录'>
          {ledgerStore.transactions.length ? (
            ledgerStore.transactions.map(
              ({
                id,
                fromUserId,
                toUserId,
                currency,
                amount,
                memo,
                createdAt
              }) => (
                <Cell
                  key={id}
                  title={`${ledgerStore.getAccount(fromUserId)?.name} -> ${ledgerStore.getAccount(toUserId)?.name}`}
                  label={`${amount} ${currency} | ${memo || '无备注'} | ${new Date(createdAt).toLocaleString()}`}
                />
              )
            )
          ) : (
            <Cell title='暂无交易' label='完成一笔转账后会在这里显示' />
          )}
        </CellGroup>

        {this.renderPicker()}
        <MainNav path='transfer' />
      </div>
    );
  }
}
