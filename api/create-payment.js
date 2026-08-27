// Helper to format detailed PayPhone error messages into readable strings
function formatPayPhoneError(data) {
  if (!data) return 'Error desconocido de pasarela PayPhone';
  if (typeof data === 'string') return data;

  let msg = data.message || data.error || data.payphoneMessage || '';
  if (data.errors) {
    if (typeof data.errors === 'string') {
      msg += (msg ? ': ' : '') + data.errors;
    } else if (Array.isArray(data.errors)) {
      msg += (msg ? ': ' : '') + data.errors.map(e => (typeof e === 'object' ? JSON.stringify(e) : String(e))).join(', ');
    } else if (typeof data.errors === 'object') {
      const formattedErrors = Object.entries(data.errors)
        .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : (typeof errs === 'object' ? JSON.stringify(errs) : String(errs))}`)
        .join('; ');
      msg += (msg ? ': ' : '') + formattedErrors;
    }
  }
  return msg || JSON.stringify(data, null, 2);
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle browser preflight options request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      amount: rawAmount, 
      totalAmount,
      totalDollars,
      clientTransactionId,
      clientTxId, 
      email,
      phoneNumber,
      reference 
    } = req.body || {};

    const total = Number(rawAmount ?? totalAmount ?? totalDollars ?? 0);
    if (!total || total <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number greater than 0',
      });
    }

    // 1. Amount Breakdown Formula:
    // Pure integer in cents: $11.85 -> 1185
    // amount = amountWithoutTax + amountWithTax + tax + service + tip
    const totalCents = Math.round(total * 100);
    const amountWithoutTax = totalCents;
    const amountWithTax = 0;
    const tax = 0;
    const service = 0;
    const tip = 0;

    // 2. Data Types & Formats:
    // clientTransactionId: max 50 chars, alphanumeric + hyphen only
    const rawTxId = clientTransactionId || clientTxId || `SHERE-${Date.now()}`;
    const txId = String(rawTxId).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 50);

    // Reference: plain string without unsupported characters (max 30 chars)
    const cleanReference = String(reference || `Order ${txId}`)
      .replace(/[^a-zA-Z0-9 -]/g, '')
      .trim()
      .slice(0, 30);

    // Clean up secret token
    let rawToken = process.env.PAYPHONE_PAYMENT_TOKEN || process.env.PAYPHONE_SECRET_TOKEN || process.env.PAYPHONE_BEARER_TOKEN || 'RLGD9J-uehwxt_6X5D0OxiG_N9gj652oouLMjfu5ldRtB3KzTwF7YrW9SLcaoYCQZM5K-sJem-RL6iByAakcn7XdVP_l-iHrshBxIkcRsqiNaeWnOBvY06IJEAzD0IEmNFxR_3NB1qIaxRRE8fRDogBggC33-1R-BGdHgKVUMT8L5EUWH1aZ2BqGpQHaacu3QjFEa8ds-lxsRTrie5vb7cMYIoaYJ_IbJmV8tMNBRwRY526I3E1AU4FRSB5Fa_vJ3h7JJE9WGS7OPrAaPYZScnZjSIt7ECQJJ5Z5lbpiQ9-E7De1lIE_Atfr6d_i7dM7aY-ejesg1pQU1IujFy5wZPgMLcE';
    rawToken = rawToken.replace(/^Bearer\s+/i, '').replace(/["'\r\n]/g, '').trim();

    // Store ID
    const rawStoreId = String(process.env.PAYPHONE_STORE_ID || '138280').trim();

    // Response & Cancellation URL
    const responseUrl = process.env.PAYPHONE_RESPONSE_URL || 'https://sherepunjabecu.com';

    const payphonePayload = {
      amount: totalCents,
      amountWithTax: amountWithTax,
      amountWithoutTax: amountWithoutTax,
      tax: tax,
      service: service,
      tip: tip,
      currency: 'USD',
      clientTransactionId: txId,
      storeId: rawStoreId,
      reference: cleanReference || 'Sher-e-Punjab Order',
      responseUrl: responseUrl,
      cancellationUrl: responseUrl,
    };

    if (email) {
      payphonePayload.email = String(email).trim();
    }
    if (phoneNumber) {
      const cleanPhone = String(phoneNumber).replace(/\D/g, '');
      if (cleanPhone) payphonePayload.phoneNumber = cleanPhone;
    }

    console.log('[PayPhone Prepare Payload]:', JSON.stringify(payphonePayload, null, 2));

    const payphoneReq = await fetch('https://pay.payphonetodoesposible.com/api/button/Prepare', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${rawToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      body: JSON.stringify(payphonePayload)
    });

    const responseText = await payphoneReq.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    console.log(`[PayPhone Prepare Response status=${payphoneReq.status}]:`, JSON.stringify(data, null, 2));

    if (!payphoneReq.ok) {
      console.error('PayPhone Error Detail:', JSON.stringify(data, null, 2));
      const payphoneMessage = formatPayPhoneError(data);

      return res.status(payphoneReq.status || 400).json({ 
        success: false,
        error: payphoneMessage, 
        message: payphoneMessage,
        payphoneMessage: payphoneMessage,
        details: data,
        sentPayload: payphonePayload
      });
    }

    const token = data.token || (typeof data === 'string' && data.length > 20 ? data : null);
    const paymentUrl = data.payWithPayPhone || (token ? `https://pay.payphonetodoesposible.com/pay?token=${encodeURIComponent(token)}` : null);

    if (!paymentUrl) {
      console.error('PayPhone Error Detail (No pay URL):', JSON.stringify(data, null, 2));
      const errMsg = formatPayPhoneError(data) || 'No payment URL or token received from PayPhone';
      return res.status(400).json({
        success: false,
        error: errMsg,
        message: errMsg,
        payphoneMessage: errMsg,
        details: data
      });
    }

    return res.status(200).json({ 
      success: true,
      payWithPayPhone: paymentUrl,
      paymentUrl: paymentUrl,
      token: token,
      clientTransactionId: txId,
      storeId: rawStoreId,
      amount: total,
      amountInCents: totalCents
    });
  } catch (err) {
    console.error('PayPhone Error Detail (Exception):', err);
    const errString = err?.message ? String(err.message) : JSON.stringify(err, null, 2);
    return res.status(500).json({ 
      success: false,
      error: errString, 
      message: errString,
      payphoneMessage: `Internal Server Error: ${errString}` 
    });
  }
}
