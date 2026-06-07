import Taro from '@tarojs/taro';
import { request } from '../../utils/request';

const getGoodsList = async () => {
  const response = await request({
    url: '/goods/list',
    method: 'GET',
  });
  return response.data;
};

const buyGoods = async (goodsId: number, amount: number) => {
  const response = await request({
    url: '/goods/buy',
    method: 'POST',
    data: {
      goodsId,
      amount,
    },
  });
  return response.data;
};

export { getGoodsList, buyGoods };