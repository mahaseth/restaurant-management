// testBill.js
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

// Replace these with a valid user in your system
const loginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

// Bill data example
const billData = {
  items: [
    {
      name: "Tea",
      quantity: 1,
      rate: 50,
      modifiers: ["No sugar", "Extra hot"]
    },
    {
      name: "Burger",
      quantity: 2,
      rate: 200,
      modifiers: ["No onion", "Extra cheese", "Spicy"]
    }
  ],
  tableNumber: 12,
  orderType: "DINE_IN",
  paymentMethod: "CASH",
  discountAmount: 50,
  paidAmount: 500,
  serviceChargePercent: 10,
  vatPercent: 13
};

async function runTest() {
  try {
    // 1. Log in to get token
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    const loginJson = await loginRes.json();

    if (!loginJson.token) {
      console.error('Login failed:', loginJson);
      return;
    }

    const token = loginJson.token;
    console.log('Login successful, token:', token);

    // 2. Create bill
    const billRes = await fetch(`${API_BASE}/bills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(billData)
    });

    const billJson = await billRes.json();
    console.log('Bill creation response:', billJson);

  } catch (err) {
    console.error('Error:', err);
  }
}

runTest();
