const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'DEVF082D077F4CCF585BBE19D3A8EF7685DC5370';

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

app.listen(5000, () => {
  console.log('서버 실행 중: http://localhost:5000');
});