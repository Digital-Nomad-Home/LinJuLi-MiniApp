import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import { AtButton, AtInput } from 'taro-ui';
import Taro from '@tarojs/taro';
import { useStore } from '../../store';
import { getGoodsList, buyGoods } from '../../api/equityMall';

interface Goods {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
}

const EquityMall = () => {
  const [goodsList, setGoodsList] = useState<Goods[]>([]);
  const [selectedGoods, setSelectedGoods] = useState<Goods | null>(null);
  const [amount, setAmount] = useState<number>(1);
  const { user } = useStore();

  useEffect(() => {
    getGoodsList().then((data) => {
      setGoodsList(data);
    });
  }, []);

  const handleBuy = () => {
    if (!selectedGoods) return;
    buyGoods(selectedGoods.id, amount).then((data) => {
      Taro.showToast({
        title: '购买成功',
        icon: 'success',
      });
    });
  };

  const handleSelectGoods = (goods: Goods) => {
    setSelectedGoods(goods);
  };

  return (
    <View>
      <Text>权益商城</Text>
      <View>
        {goodsList.map((goods) => (
          <View key={goods.id}>
            <Image src={goods.image} />
            <Text>{goods.name}</Text>
            <Text>{goods.price} DNP</Text>
            <AtButton onClick={() => handleSelectGoods(goods)}>选择</AtButton>
          </View>
        ))}
      </View>
      {selectedGoods && (
        <View>
          <Text>数量:</Text>
          <AtInput
            type="number"
            value={amount}
            onChange={(value) => setAmount(Number(value))}
          />
          <AtButton onClick={handleBuy}>购买</AtButton>
        </View>
      )}
    </View>
  );
};

export default EquityMall;