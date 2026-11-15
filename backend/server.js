// ============================================================================
// backend/server.js — MOLLY'S KITCHEN EXPRESS API (MIGSUN TWIINZ, ETA 2)
// ============================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase Client (if keys are configured)
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// Initialize Razorpay Client (if keys are configured)
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      })
    : null;

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: "Molly's Kitchen Backend API — Migsun Twiinz, ETA 2",
    supabaseConnected: Boolean(supabase),
    razorpayConnected: Boolean(razorpay)
  });
});

// 1. Staff Admin Authentication Route
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const expectedUser = process.env.ADMIN_USER || '123';
  const expectedPass = process.env.ADMIN_PASS || '123';

  if (username !== expectedUser || password !== expectedPass) {
    return res.status(401).json({ error: 'Wrong username or password' });
  }
  return res.json({ authenticated: true, kitchen: "Molly's Kitchen — Migsun Twiinz" });
});

// 2. Create Razorpay Order (Amount in Paise, Free Delivery across SUN 1–SUN 10)
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amountInr, residentName, phone, tower, flat } = req.body;
    const amt = Number(amountInr);
    if (!Number.isFinite(amt) || amt < 1 || amt > 20000) {
      return res.status(400).json({ error: 'Invalid order amount' });
    }

    // Viva-Safe Fallback if Razorpay keys are not set yet
    if (!razorpay) {
      return res.json({
        id: `order_DEMO_${Date.now()}`,
        amount: Number(amountInr) * 100,
        currency: 'INR',
        mode: 'viva_safe_mock'
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amountInr) * 100),
      currency: 'INR',
      receipt: `mk_${Date.now()}`,
      notes: {
        society: 'Migsun Twiinz, ETA 2',
        residentName,
        phone,
        tower,
        flat
      }
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Verify Razorpay Payment Signature (HMAC-SHA256)
app.post('/api/payment/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.json({ verified: true, mode: 'viva_safe_mock' });
  }

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const a = Buffer.from(generatedSignature);
  const b = Buffer.from(String(razorpay_signature || ''));
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
    return res.json({ verified: true });
  }
  return res.status(400).json({ verified: false, error: 'Invalid payment signature' });
});

// 3b. Refund a payment (kitchen cancelled the order)
app.post('/api/payment/refund', async (req, res) => {
  try {
    const { paymentId, amountInr } = req.body;
    if (!paymentId) return res.status(400).json({ refunded: false, error: 'Missing payment id' });
    if (!razorpay || String(paymentId).includes('DEMO')) {
      return res.json({ refunded: true, mode: 'viva_safe_mock' });
    }
    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status === 'authorized') {
      await razorpay.payments.capture(paymentId, payment.amount, payment.currency);
    }
    if (payment.status === 'refunded') return res.json({ refunded: true, already: true });
    const refund = await razorpay.payments.refund(paymentId, { amount: Math.round(Number(amountInr) * 100), speed: 'normal' });
    return res.json({ refunded: true, refund });
  } catch (err) {
    return res.status(500).json({ refunded: false, error: err?.error?.description || err.message });
  }
});

// 4. Create Order & Decrement Daily Thali Portions
app.post('/api/orders', async (req, res) => {
  try {
    const orderPayload = req.body;
    if (!supabase) {
      return res.status(201).json({ ...orderPayload, savedIn: 'local_memory' });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update Order Status & Trigger Automated WhatsApp Cloud API Notification
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, phone, residentName, token, tower, flat } = req.body;

    if (supabase) {
      await supabase.from('orders').update({ status }).eq('id', id);
    }

    // Optional Meta WhatsApp Cloud API Dispatch
    if (process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      await fetch(
        `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: `91${String(phone).replace(/[^0-9]/g, '').slice(-10)}`,
            type: 'text',
            text: {
              body: `Hi ${residentName}! Your Molly's Kitchen order ${token} for ${tower} - Flat ${flat} is now "${status}".`
            }
          })
        }
      );
    }

    res.json({ updated: true, id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Molly's Kitchen Backend running on http://localhost:${PORT}`);
});
