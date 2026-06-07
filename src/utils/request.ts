import Taro from '@tarojs/taro';

const request = async (options: any) => {
  const response = await Taro.request({
    ...options,
    header: {
      'Content-Type': 'application/json',
    },
  });
  return response;
};

export { request };