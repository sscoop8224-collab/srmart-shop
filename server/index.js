require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.KAKAOPAY_SECRET_KEY;
if (!SECRET_KEY) {
  console.error('❌ KAKAOPAY_SECRET_KEY가 .env에 설정되지 않았어요! 서버를 시작할 수 없어요.');
  process.exit(1);
}

app.post('/api/kakaopay/ready', async (req, res) => {
  try {
    const { orderId, userId, itemName, quantity, totalAmount } = req.body;

    const response = await axios.post(
      'https://open-api.kakaopay.com/online/v1/payment/ready',
      {
        cid: 'TC0ONETIME',
        partner_order_id: orderId,
        partner_user_id: userId,
        item_name: itemName,
        quantity: quantity,
        total_amount: totalAmount,
        tax_free_amount: 0,
        approval_url: 'http://localhost:3000/payment/success',
        cancel_url: 'http://localhost:3000/payment/cancel',
        fail_url: 'http://localhost:3000/payment/fail',
      },
      {
        headers: {
          Authorization: `SECRET_KEY ${SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('카카오페이 오류:', error.response?.data || error.message);
    res.status(500).json({ error: '결제 준비 실패' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`카카오페이 서버 실행 중: http://localhost:${PORT}`);
});