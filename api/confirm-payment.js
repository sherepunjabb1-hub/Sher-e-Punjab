// Vercel Serverless Function: api/confirm-payment.js

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  try {
    const { id, clientTxId, clientTransactionId, paymentId } = req.body || {};
    const targetId = id || paymentId;
    const targetClientTxId = clientTxId || clientTransactionId;

    if (!targetClientTxId) {
      return res.status(400).json({
        success: false,
        error: 'clientTxId is required for payment confirmation.',
      });
    }

    const payload = {
      id: typeof targetId === 'string' && /^\d+$/.test(targetId) ? parseInt(targetId, 10) : (targetId || 0),
      clientTxId: String(targetClientTxId),
    };

    const token = (process.env.PAYPHONE_SECRET_TOKEN || process.env.PAYPHONE_BEARER_TOKEN || 'RLGD9J-uehwxt_6X5D0OxiG_N9gj652oouLMjfu5ldRtB3KzTwF7YrW9SLcaoYCQZM5K-sJem-RL6iByAakcn7XdVP_l-iHrshBxIkcRsqiNaeWnOBvY06IJEAzD0IEmNFxR_3NB1qIaxRRE8fRDogBggC33-1R-BGdHgKVUMT8L5EUWH1aZ2BqGpQHaacu3QjFEa8ds-lxsRTrie5vb7cMYIoaYJ_IbJmV8tMNBRwRY526I3E1AU4FRSB5Fa_vJ3h7JJE9WGS7OPrAaPYZScnZjSIt7ECQJJ5Z5lbpiQ9-E7De1lIE_Atfr6d_i7dM7aY-ejesg1pQU1IujFy5wZPgMLcE').replace(/["'\r\n]/g, '').trim();

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    };

    let response = await fetch('https://pay.payphonetodoesposible.com/api/button/V2/Confirm', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok && response.status === 404) {
      response = await fetch('https://pay.payphonetodoesposible.com/api/button/Confirm', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });
    }

    const responseText = await response.text();
    let data = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }

    const isApproved =
      data?.statusCode === 3 ||
      data?.transactionStatus === 'Aprobada' ||
      data?.status === 'Approved' ||
      data?.status === 'Aprobada';

    if (isApproved && data) {
      return res.status(200).json({
        success: true,
        isPaid: true,
        status: 'Approved',
        transactionStatus: 'Approved',
        payment: {
          clientTxId: String(targetClientTxId),
          transactionId: String(data.transactionId || targetId || 'APPROVED'),
          amount: data.amount ? data.amount / 100 : Number(req.body.amount || 0),
          authorizationCode: data.authorizationCode || `AUTH-${Date.now().toString().slice(-6)}`,
          cardBrand: data.cardBrand || data.cardType || 'PayPhone Ecuador',
          lastDigits: data.lastDigits || '',
          confirmedAt: new Date().toISOString(),
          status: 'Approved',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          message: data.message || 'Pago aprobado por PayPhone Ecuador',
        },
      });
    }

    const currentStatus = data?.transactionStatus || 'Pending';
    return res.status(200).json({
      success: false,
      isPaid: false,
      status: currentStatus,
      transactionStatus: currentStatus,
      error: data?.message || `Transacción en estado: ${currentStatus}`,
      details: data,
    });
  } catch (error) {
    console.error('Error in confirm-payment:', error);
    return res.status(500).json({
      success: false,
      isPaid: false,
      status: 'Error',
      error: error?.message || 'Error al comunicarse con PayPhone',
    });
  }
}
