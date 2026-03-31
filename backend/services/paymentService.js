import axios from 'axios';
import crypto from 'crypto';

/**
 * M-Pesa Payment Service
 * Handles STK Push for credit purchases
 */

const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE || '174379',
  passkey: process.env.MPESA_PASSKEY,
  callbackUrl: process.env.MPESA_CALLBACK_URL || '/api/credits/callback',
  stkPushUrl: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
  authUrl: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
};

/**
 * Get M-Pesa OAuth token
 * @returns {Promise<string>} Access token
 */
export const getMpesaToken = async () => {
  try {
    if (!MPESA_CONFIG.consumerKey || !MPESA_CONFIG.consumerSecret) {
      throw new Error('M-Pesa credentials not configured');
    }

    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');

    const response = await axios.get(MPESA_CONFIG.authUrl, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa Token Error:', error.message);
    throw new Error('Failed to get M-Pesa token');
  }
};

/**
 * Generate M-Pesa password
 * @returns {string} Base64 encoded password
 */
const generateMpesaPassword = () => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '');
  const shortcode = MPESA_CONFIG.shortcode;
  const passkey = MPESA_CONFIG.passkey || 'bfb279f9aa9b4cf154ad3c42209832a';
  
  const password = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(password).toString('base64');
};

/**
 * Initiate STK Push
 * @param {string} phone - Phone number (e.g., 254712345678)
 * @param {number} amount - Amount in KES
 * @param {string} accountReference - Account reference (e.g., user ID or order ID)
 * @param {string} transactionDesc - Transaction description
 * @returns {Promise<Object>} STK Push response
 */
export const initiateStkPush = async (phone, amount, accountReference, transactionDesc) => {
  try {
    // Validate configuration
    if (!MPESA_CONFIG.consumerKey || !MPESA_CONFIG.consumerSecret) {
      return {
        success: false,
        error: 'M-Pesa not configured. Please contact administrator.',
        code: 'MPESA_NOT_CONFIGURED'
      };
    }

    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '');
    const password = generateMpesaPassword();

    const payload = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: Math.ceil(amount), // M-Pesa requires integer
      PartyA: phone,
      PartyB: MPESA_CONFIG.shortcode,
      PhoneNumber: phone,
      CallBackURL: `${process.env.CLIENT_URL || 'http://localhost:5173'}${MPESA_CONFIG.callbackUrl}`,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc || 'SMS Credit Purchase'
    };

    const response = await axios.post(MPESA_CONFIG.stkPushUrl, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data,
      message: 'STK Push initiated successfully'
    };
  } catch (error) {
    console.error('STK Push Error:', error.response?.data || error.message);
    
    // Handle specific M-Pesa errors
    if (error.response?.data?.errorCode === 'InvalidPhoneNumber') {
      return {
        success: false,
        error: 'Invalid phone number. Use format: 2547XXXXXXXX',
        code: 'INVALID_PHONE'
      };
    }

    if (error.response?.data?.errorCode === 'InsufficientFunds') {
      return {
        success: false,
        error: 'Insufficient funds in M-Pesa account',
        code: 'INSUFFICIENT_FUNDS'
      };
    }

    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to initiate payment',
      code: error.response?.data?.errorCode || 'STK_PUSH_FAILED'
    };
  }
};

/**
 * Process M-Pesa callback
 * @param {Object} callbackData - M-Pesa callback data
 * @returns {Object} Processed result
 */
export const processMpesaCallback = async (callbackData) => {
  try {
    const { Body } = callbackData;
    
    if (!Body || !Body.stkCallback) {
      return { success: false, message: 'Invalid callback data' };
    }

    const { stkCallback } = Body;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || [];
      const amount = metadata.find(i => i.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = metadata.find(i => i.Name === 'PhoneNumber')?.Value;

      return {
        success: true,
        data: {
          merchantRequestId: MerchantRequestID,
          checkoutRequestId: CheckoutRequestID,
          amount,
          mpesaReceiptNumber,
          phoneNumber,
          status: 'completed'
        }
      };
    } else {
      // Payment failed
      return {
        success: false,
        data: {
          merchantRequestId: MerchantRequestID,
          checkoutRequestId: CheckoutRequestID,
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          status: 'failed'
        }
      };
    }
  } catch (error) {
    console.error('Callback Processing Error:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Verify payment with M-Pesa
 * @param {string} checkoutRequestId - Checkout request ID from STK Push
 * @returns {Promise<Object>} Transaction status
 */
export const verifyPayment = async (checkoutRequestId) => {
  try {
    const token = await getMpesaToken();
    
    const payload = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await axios.post(
      'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Payment Verification Error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to verify payment'
    };
  }
};

/**
 * Check if M-Pesa is configured
 * @returns {boolean}
 */
export const isMpesaConfigured = () => {
  return !!(MPESA_CONFIG.consumerKey && MPESA_CONFIG.consumerSecret);
};

export default {
  getMpesaToken,
  initiateStkPush,
  processMpesaCallback,
  verifyPayment,
  isMpesaConfigured
};
