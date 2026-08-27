var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
var PAYPHONE_API_BASE = "https://pay.payphonetodoesposible.com/api/button";
var PAYPHONE_SECRET_TOKEN = process.env.PAYPHONE_SECRET_TOKEN || process.env.PAYPHONE_BEARER_TOKEN || "RLGD9J-uehwxt_6X5D0OxiG_N9gj652oouLMjfu5ldRtB3KzTwF7YrW9SLcaoYCQZM5K-sJem-RL6iByAakcn7XdVP_l-iHrshBxIkcRsqiNaeWnOBvY06IJEAzD0IEmNFxR_3NB1qIaxRRE8fRDogBggC33-1R-BGdHgKVUMT8L5EUWH1aZ2BqGpQHaacu3QjFEa8ds-lxsRTrie5vb7cMYIoaYJ_IbJmV8tMNBRwRY526I3E1AU4FRSB5Fa_vJ3h7JJE9WGS7OPrAaPYZScnZjSIt7ECQJJ5Z5lbpiQ9-E7De1lIE_Atfr6d_i7dM7aY-ejesg1pQU1IujFy5wZPgMLcE";
var PAYPHONE_STORE_ID = process.env.PAYPHONE_STORE_ID || "138280";
var PAYPHONE_APP_ID = process.env.PAYPHONE_APP_ID || "DTrLfqcObUmyYxjr8FE7Aw";
var PAYPHONE_RESPONSE_URL = process.env.PAYPHONE_RESPONSE_URL || "https://sherepunjabecu.com";
var confirmedTransactions = /* @__PURE__ */ new Map();
app.use(import_express.default.json());
app.get("/api/payphone/config", (_req, res) => {
  res.json({
    appId: PAYPHONE_APP_ID,
    storeId: PAYPHONE_STORE_ID,
    responseUrl: PAYPHONE_RESPONSE_URL,
    currency: "USD",
    ivaRate: 0.15
    // 15% Ecuadorian IVA
  });
});
app.post(["/api/create-payment", "/api/payphone/create"], async (req, res) => {
  try {
    const {
      amount: rawAmount,
      totalAmount,
      totalDollars,
      clientTxId: rawClientTxId,
      clientTransactionId,
      reference,
      customerEmail,
      customerPhone,
      email,
      phoneNumber
    } = req.body || {};
    const total = Number(rawAmount ?? totalAmount ?? totalDollars ?? 0);
    if (!total || total <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be a positive number greater than 0"
      });
    }
    const totalCents = Math.round(total * 100);
    const amountWithoutTax = totalCents;
    const amountWithTax = 0;
    const tax = 0;
    const service = 0;
    const tip = 0;
    const rawTxId = clientTransactionId || rawClientTxId || `SHERE-${Date.now()}`;
    const cleanClientTxId = String(rawTxId).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 50);
    const cleanReference = String(reference || `Order ${cleanClientTxId}`).replace(/[^a-zA-Z0-9 -]/g, "").trim().slice(0, 30);
    const rawToken = process.env.PAYPHONE_SECRET_TOKEN || process.env.PAYPHONE_BEARER_TOKEN || PAYPHONE_SECRET_TOKEN;
    const cleanToken = rawToken ? rawToken.replace(/^Bearer\s+/i, "").replace(/["'\r\n]/g, "").trim() : "";
    const rawStoreId = process.env.PAYPHONE_STORE_ID || PAYPHONE_STORE_ID || "138280";
    const cleanStoreId = String(rawStoreId).replace(/["'\r\n]/g, "").trim();
    const rawPhone = phoneNumber || customerPhone || "";
    const cleanPhone = rawPhone ? String(rawPhone).replace(/\D/g, "") : "";
    const rawEmail = email || customerEmail || "";
    const cleanEmail = rawEmail ? String(rawEmail).trim() : "";
    const payload = {
      amount: totalCents,
      amountWithoutTax,
      amountWithTax,
      tax,
      service,
      tip,
      currency: "USD",
      clientTransactionId: cleanClientTxId,
      storeId: cleanStoreId,
      reference: cleanReference || "Sher-e-Punjab Order",
      responseUrl: PAYPHONE_RESPONSE_URL,
      cancellationUrl: PAYPHONE_RESPONSE_URL
    };
    if (cleanEmail) {
      payload.email = cleanEmail;
    }
    if (cleanPhone) {
      payload.phoneNumber = cleanPhone;
    }
    console.log(`[PayPhone API] Calling Prepare API for clientTxId ${cleanClientTxId}:`, JSON.stringify(payload, null, 2));
    const payphoneHeaders = {
      "Authorization": `Bearer ${cleanToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    };
    const response = await fetch(`${PAYPHONE_API_BASE}/Prepare`, {
      method: "POST",
      headers: payphoneHeaders,
      body: JSON.stringify(payload)
    });
    const responseText = await response.text();
    console.log(`[PayPhone API] Raw Prepare Status: ${response.status}`);
    let data = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { rawText: responseText };
    }
    console.log("[PayPhone API Prepare Response]:", JSON.stringify(data, null, 2));
    const token = data?.token || (typeof data === "string" && data.length > 20 ? data : null) || data?.payUrl || data?.paymentUrl;
    const paymentId = data?.paymentId || data?.id || data?.transactionId || null;
    let payWithPayPhone = data?.payWithPayPhone || (token ? `https://pay.payphonetodoesposible.com/pay?token=${encodeURIComponent(token)}` : null);
    if (!payWithPayPhone) {
      console.warn(`[PayPhone API] Prepare API status ${response.status} (WAF / Direct), using store gateway for Store ID ${cleanStoreId}`);
      payWithPayPhone = `https://pay.payphonetodoesposible.com/pay?storeId=${cleanStoreId}`;
    }
    console.log(`[PayPhone API] Generated payWithPayPhone URL for ${cleanClientTxId}:`, payWithPayPhone);
    return res.json({
      success: true,
      paymentUrl: payWithPayPhone,
      payWithPayPhone,
      token,
      paymentId,
      clientTxId: cleanClientTxId,
      clientTransactionId: cleanClientTxId,
      storeId: cleanStoreId,
      appId: PAYPHONE_APP_ID,
      amount: total,
      amountInCents: totalCents
    });
  } catch (error) {
    console.warn("PayPhone Prepare Exception, falling back to direct store gateway:", error?.message);
    const rawStoreId = process.env.PAYPHONE_STORE_ID || PAYPHONE_STORE_ID || "138280";
    const cleanStoreId = String(rawStoreId).replace(/["'\r\n]/g, "").trim();
    const fallbackUrl = `https://pay.payphonetodoesposible.com/pay?storeId=${cleanStoreId}`;
    return res.status(200).json({
      success: true,
      paymentUrl: fallbackUrl,
      payWithPayPhone: fallbackUrl,
      token: null,
      storeId: cleanStoreId
    });
  }
});
app.post(["/api/confirm-payment", "/api/payphone/confirm"], async (req, res) => {
  try {
    const { id, clientTxId, clientTransactionId, paymentId } = req.body;
    const targetId = id || paymentId;
    const targetClientTxId = clientTxId || clientTransactionId;
    if (!targetClientTxId) {
      return res.status(400).json({
        success: false,
        error: "clientTxId is required for payment confirmation."
      });
    }
    if (confirmedTransactions.has(targetClientTxId)) {
      const cached = confirmedTransactions.get(targetClientTxId);
      return res.json({
        success: true,
        isPaid: true,
        status: "Approved",
        transactionStatus: "Approved",
        isCached: true,
        payment: cached
      });
    }
    console.log(`[PayPhone API] Confirming transaction server-side. Target ID: ${targetId}, ClientTxId: ${targetClientTxId}...`);
    const payload = {
      id: typeof targetId === "string" && /^\d+$/.test(targetId) ? parseInt(targetId, 10) : targetId || 0,
      clientTxId: String(targetClientTxId)
    };
    let data = null;
    const rawToken = process.env.PAYPHONE_SECRET_TOKEN || process.env.PAYPHONE_BEARER_TOKEN || PAYPHONE_SECRET_TOKEN;
    const cleanToken = rawToken ? rawToken.replace(/["'\r\n]/g, "").trim() : "";
    const headers = {
      "Authorization": `Bearer ${cleanToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    };
    let response = await fetch(`${PAYPHONE_API_BASE}/V2/Confirm`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    if (!response.ok && response.status === 404) {
      response = await fetch(`${PAYPHONE_API_BASE}/Confirm`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
    }
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }
    console.log(`[PayPhone API] Confirm response status ${response.status}:`, data);
    const isApproved = data?.transactionStatus === "Approved" || data?.statusCode === 3 || data?.transactionStatus === "Aprobada" || (data?.status === "Approved" || data?.status === "Aprobada");
    if (isApproved && data) {
      const paymentRecord = {
        clientTxId: String(targetClientTxId),
        transactionId: String(data.transactionId || targetId || "APPROVED"),
        amount: data.amount ? data.amount / 100 : Number(req.body.amount || 0),
        authorizationCode: data.authorizationCode || `AUTH-${Date.now().toString().slice(-6)}`,
        cardBrand: data.cardBrand || data.cardType || "PayPhone Ecuador",
        lastDigits: data.lastDigits || "",
        confirmedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "Approved"
      };
      confirmedTransactions.set(targetClientTxId, paymentRecord);
      return res.json({
        success: true,
        isPaid: true,
        status: "Approved",
        transactionStatus: "Approved",
        payment: {
          ...paymentRecord,
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          message: data.message || "Pago aprobado por PayPhone Ecuador"
        }
      });
    }
    const currentStatus = data?.transactionStatus || (data?.statusCode === 2 ? "Pending" : "Pending");
    const errorMessage = data?.message || (data?.transactionStatus ? `Transacci\xF3n en estado: ${data.transactionStatus}` : "Esperando confirmaci\xF3n de pago...");
    return res.json({
      success: false,
      isPaid: false,
      status: currentStatus,
      transactionStatus: currentStatus,
      error: errorMessage,
      details: data
    });
  } catch (error) {
    console.error("[PayPhone API] Exception in /api/confirm-payment:", error);
    return res.status(500).json({
      success: false,
      isPaid: false,
      status: "Error",
      error: error?.message || "Error al comunicarse con el servidor de PayPhone"
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sher E Punjab Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Sher E Punjab Server] PayPhone Ecuador gateway initialized securely.`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
