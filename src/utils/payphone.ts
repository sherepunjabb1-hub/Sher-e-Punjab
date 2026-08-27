import { OrderCustomerDetails, PayPhoneCreateResponse, PayPhonePaymentInfo } from '../types';

declare global {
  interface Window {
    payphone?: {
      Button?: (config: {
        token?: string;
        storeId?: string;
        appId?: string;
        btnElement?: string;
        btnCons?: string;
        clientTransactionId?: string;
        amount?: number;
        amountWithTax?: number;
        amountWithoutTax?: number;
        tax?: number;
        currency?: string;
        reference?: string;
        createOrder?: () => Promise<string> | string;
        onApproved?: (data: { id?: string | number; clientTxId?: string; clientTransactionId?: string; transactionId?: string | number; authorizationCode?: string }) => void;
        onCanceled?: (data?: any) => void;
        onCancel?: (data?: any) => void;
        onError?: (err?: any) => void;
        onComplete?: (data?: any) => void;
      }) => {
        render?: (containerSelector: string) => void;
      };
    };
  }
}

const PAYPHONE_BTN_SDK_URL = 'https://pay.payphonetodoesposible.com/api/button/js?appId=DTrLfqcObUmyYxjr8FE7Aw';
const PAYPHONE_BOX_SDK_URL = 'https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js';
const PAYPHONE_TOKEN_SDK_URL = 'https://pay.payphonetodoesposible.com/api/token/js/v1';

export const DEFAULT_PAYPHONE_STORE_ID = '138280';
export const DEFAULT_PAYPHONE_APP_ID = 'DTrLfqcObUmyYxjr8FE7Aw';

/**
 * Dynamically loads the PayPhone SDK script if not already present in the DOM.
 * Resolves when window.payphone is verified to be ready.
 */
export const loadPayPhoneSDK = (): Promise<any> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(null);
    }

    if (window.payphone && typeof window.payphone.Button === 'function') {
      return resolve(window.payphone);
    }

    // Helper to load a script
    const loadScript = (url: string, id: string): Promise<boolean> => {
      return new Promise((res) => {
        if (document.getElementById(id)) {
          return res(true);
        }
        const script = document.createElement('script');
        script.id = id;
        script.src = url;
        script.type = 'text/javascript';
        script.async = true;
        script.onload = () => res(true);
        script.onerror = () => res(false);
        document.head.appendChild(script);
      });
    };

    // Load PayPhone Button and Box scripts
    Promise.all([
      loadScript(PAYPHONE_BTN_SDK_URL, 'payphone-sdk-btn'),
      loadScript(PAYPHONE_BOX_SDK_URL, 'payphone-sdk-box'),
      loadScript(PAYPHONE_TOKEN_SDK_URL, 'payphone-sdk-token'),
    ]).then(() => {
      // Check for payphone object
      if (window.payphone) {
        return resolve(window.payphone);
      }
      setTimeout(() => {
        resolve(window.payphone || null);
      }, 500);
    });
  });
};

export const loadPayPhoneScript = loadPayPhoneSDK;

/**
 * Optional server-side Prepare session call (fallback/direct)
 */
export async function createPayPhoneSession(params: {
  totalDollars: number;
  subtotalDollars?: number;
  deliveryDollars?: number;
  clientTransactionId?: string;
  reference?: string;
  details?: OrderCustomerDetails;
}): Promise<PayPhoneCreateResponse> {
  const generatedTxId =
    params.clientTransactionId || `SP-${Date.now()}`;

  return {
    success: true,
    token: '',
    clientTransactionId: generatedTxId,
    storeId: DEFAULT_PAYPHONE_STORE_ID,
    appId: DEFAULT_PAYPHONE_APP_ID,
  };
}

/**
 * Backend verification & confirmation handler
 * Verifies transaction with Bearer Token on /api/payphone/confirm
 */
export async function confirmPayPhonePayment(params: {
  id: string | number;
  clientTxId: string;
  amount?: number;
  isDirectConfirmation?: boolean;
}): Promise<PayPhonePaymentInfo> {
  try {
    const response = await fetch('/api/payphone/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: params.id,
        clientTxId: params.clientTxId,
        amount: params.amount,
        isDirectConfirmation: params.isDirectConfirmation ?? true,
      }),
    });

    const responseText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }

    if (data && data.success && data.isPaid && data.payment) {
      return {
        isPaid: true,
        transactionId: String(data.payment.transactionId),
        clientTransactionId: data.payment.clientTxId || params.clientTxId,
        authorizationCode: data.payment.authorizationCode || '',
        transactionStatus: data.payment.status || 'Approved',
        paidAmountDollars: data.payment.amount,
        cardBrand: data.payment.cardBrand || 'PayPhone Ecuador',
        lastDigits: data.payment.lastDigits || '',
        email: data.payment.email,
        phoneNumber: data.payment.phoneNumber,
        paymentDate: data.payment.confirmedAt || new Date().toISOString(),
        message: data.payment.message || 'Pago confirmado por PayPhone',
      };
    }

    const err = data?.error || 'Transacción no verificada por PayPhone Ecuador.';
    throw new Error(err);
  } catch (e: any) {
    throw new Error(e?.message || 'Error al conectar con la pasarela de PayPhone');
  }
}

export interface PayPhoneClientInitConfig {
  containerId: string;
  totalDollars: number;
  subtotalDollars?: number;
  deliveryDollars?: number;
  clientTxId: string;
  token?: string;
  reference?: string;
  onApproved: (paymentInfo: PayPhonePaymentInfo) => void;
  onError: (errorMsg: string) => void;
  onCancel?: () => void;
}

/**
 * Mounts PayPhone's Direct Client SDK mode (payphone.Button)
 * Completely bypasses server-side Prepare token API requirements.
 */
export async function mountPayPhoneButton(config: PayPhoneClientInitConfig): Promise<boolean> {
  try {
    await loadPayPhoneSDK();
    if (!window.payphone || typeof window.payphone.Button !== 'function') {
      return false;
    }

    const rawId = config.containerId.replace(/^#/, '');
    const selector = `#${rawId}`;
    const container = document.getElementById(rawId);
    if (!container) {
      return false;
    }

    container.innerHTML = '';

    const totalAmount = Number(config.totalDollars || 0);
    const totalInCents = Math.round(totalAmount * 100);
    const amountWithoutTax = totalInCents;
    const amountWithTax = 0;
    const tax = 0;
    const service = 0;
    const tip = 0;

    const cleanClientTxId = String(config.clientTxId || `SHERE-${Date.now()}`)
      .replace(/[^a-zA-Z0-9-]/g, '')
      .slice(0, 50);

    const cleanReference = String(config.reference || 'Sher-e-Punjab Order')
      .replace(/[^a-zA-Z0-9 -]/g, '')
      .trim()
      .slice(0, 30);

    const btnConfig = {
      token: config.token || '',
      storeId: DEFAULT_PAYPHONE_STORE_ID,
      appId: DEFAULT_PAYPHONE_APP_ID,
      btnElement: selector,
      btnCons: rawId,
      clientTransactionId: cleanClientTxId,
      amount: totalInCents,
      amountWithTax: amountWithTax,
      amountWithoutTax: amountWithoutTax,
      tax: tax,
      service: service,
      tip: tip,
      currency: 'USD',
      reference: cleanReference,
      onApproved: async (res: any) => {
        try {
          const txId = res?.id || res?.transactionId || cleanClientTxId;
          const cTxId = res?.clientTxId || res?.clientTransactionId || cleanClientTxId;
          const verified = await confirmPayPhonePayment({
            id: txId,
            clientTxId: cTxId,
            amount: config.totalDollars,
            isDirectConfirmation: true,
          });
          config.onApproved(verified);
        } catch (err: any) {
          console.error("PayPhone Error Detail:", err);
          config.onError(typeof err === 'object' ? JSON.stringify(err, null, 2) : (err?.message || 'Error confirmando pago'));
        }
      },
      onCanceled: () => {
        if (config.onCancel) config.onCancel();
      },
      onCancel: () => {
        if (config.onCancel) config.onCancel();
      },
      onError: (err: any) => {
        console.error("PayPhone Error Detail:", err);
        const errMsg = typeof err === 'object' ? JSON.stringify(err, null, 2) : (typeof err === 'string' ? err : err?.message || 'Aviso en pasarela PayPhone');
        config.onError(errMsg);
      },
    };

    const buttonInstance = window.payphone.Button(btnConfig);
    if (buttonInstance && typeof buttonInstance.render === 'function') {
      try {
        buttonInstance.render(selector);
      } catch {
        buttonInstance.render(rawId);
      }
    }

    return true;
  } catch (err: any) {
    config.onError(err?.message || 'No se pudo inicializar el botón de pago');
    return false;
  }
}
