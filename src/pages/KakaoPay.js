import axios from 'axios';

export const kakaoPayReady = async (orderInfo) => {
  try {
    const response = await axios.post('http://localhost:5000/api/kakaopay/ready', {
      orderId: orderInfo.orderId,
      userId: orderInfo.userId,
      itemName: orderInfo.itemName,
      quantity: orderInfo.quantity,
      totalAmount: orderInfo.totalAmount,
    });
    return response.data;
  } catch (error) {
    console.error('카카오페이 결제 준비 실패:', error);
    throw error;
  }
};