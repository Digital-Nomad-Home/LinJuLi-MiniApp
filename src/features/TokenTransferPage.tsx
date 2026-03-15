import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TextField, Button, Select, MenuItem, InputLabel, FormControl } from '@material-ui/core';

const TokenTransferPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState(1000); // This should ideally come from an API or state
  const [transferStatus, setTransferStatus] = useState('');

  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  const handleCurrencyChange = (event) => {
    setCurrency(event.target.value);
  };

  const handleAccountChange = (event) => {
    setAccount(event.target.value);
  };

  const handleTransfer = () => {
    if (parseFloat(amount) > balance) {
      setTransferStatus(t('error.insufficientBalance'));
      return;
    }
    // Implement the transfer logic
    setTransferStatus(t('success.transferComplete'));
    // Update the account balance after transfer
    setBalance(balance - parseFloat(amount));
  };

  return (
    <div>
      <h2>{t('tokenTransfer.title')}</h2>
      <FormControl fullWidth>
        <InputLabel>{t('tokenTransfer.selectCurrency')}</InputLabel>
        <Select value={currency} onChange={handleCurrencyChange} label={t('tokenTransfer.selectCurrency')}>
          <MenuItem value='USD'>USD</MenuItem>
          <MenuItem value='EUR'>EUR</MenuItem>
          <MenuItem value='BTC'>BTC</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label={t('tokenTransfer.amount')}
        type='number'
        value={amount}
        onChange={handleAmountChange}
        fullWidth
        margin='normal'
      />
      <TextField
        label={t('tokenTransfer.account')}
        type='text'
        value={account}
        onChange={handleAccountChange}
        fullWidth
        margin='normal'
      />
      <Button variant='contained' color='primary' onClick={handleTransfer} fullWidth>
        {t('tokenTransfer.transferButton')}
      </Button>
      {transferStatus && <div>{transferStatus}</div>}
    </div>
  );
};

export default TokenTransferPage;