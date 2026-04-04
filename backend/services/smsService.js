import axios from 'axios';

/**
 * BlessedTexts SMS Service
 * Handles SMS sending via BlessedTexts API
 */

const BLESSEDTEXTS_API_KEY = process.env.BLESSEDTEXTS_API_KEY;
const BLESSEDTEXTS_SENDER = process.env.BLESSEDTEXTS_SENDER || 'FERRITE';
const DEFAULT_SENDER_ID = process.env.DEFAULT_SENDER_ID || 'FERRITE';

const API_BASE_URL = 'https://sms.blessedtexts.com/api/sms/v1';

// Console logging removed for production

/**
 * Send SMS via BlessedText API
 * @param {string} phone - Recipient phone number
 * @param {string} message - SMS message
 * @param {string} senderId - Sender ID
 * @returns {Promise<Object>} API response
 */
export const sendSMS = async (phone, message, senderId = DEFAULT_SENDER_ID) => {
  try {
    console.log('Sending SMS:', { phone, messageLength: message.length, senderId });

    // Validate API key
    if (!BLESSEDTEXTS_API_KEY) {
      console.error('BlessedTexts API key not configured');
      return {
        success: false,
        error: 'SMS service not configured. Please contact administrator.',
        code: 500
      };
    }

    // Format phone number - BlessedTexts expects formats like 254722XXXXXX or 0722XXXXXX
    const formattedPhone = formatPhoneNumberBlessedTexts(phone);
    console.log('Formatted phone:', formattedPhone);

    const payload = {
      api_key: BLESSEDTEXTS_API_KEY,
      sender_id: senderId || BLESSEDTEXTS_SENDER,
      message: message,
      phone: formattedPhone
    };

    const response = await axios.post(
      `${API_BASE_URL}/sendsms`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    return {
      success: true,
      data: response.data,
      messageId: response.data[0]?.message_id,
      status: response.data[0]?.status_desc || 'sent'
    };
  } catch (error) {
    console.error('BlessedTexts SMS Error:', error.message);
    console.error('Response data:', error.response?.data);

    // Handle specific error responses
    if (error.response) {
      const errorData = error.response.data;
      return {
        success: false,
        error: errorData?.message || errorData?.error || errorData || 'API error',
        code: error.response.status,
        data: errorData
      };
    }

    // Network or timeout errors
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
      code: error.code
    };
  }
};

/**
 * Send bulk SMS via BlessedText API
 * @param {Array} phones - Array of phone numbers
 * @param {string} message - SMS message
 * @param {string} senderId - Sender ID
 * @returns {Promise<Object>} API response
 */
export const sendBulkSMS = async (phones, message, senderId = DEFAULT_SENDER_ID) => {
  try {
    if (!BLESSEDTEXTS_API_KEY) {
      throw new Error('BlessedTexts API key not configured');
    }

    // Format all phone numbers
    const formattedPhones = phones.map(phone => formatPhoneNumber(phone));

    const payload = {
      api_key: BLESSEDTEXTS_API_KEY,
      to: formattedPhones,
      message: message,
      sender: senderId || BLESSEDTEXTS_SENDER
    };

    const response = await axios.post(
      'https://app.blessedtextsms.com/api/send',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout for bulk
      }
    );

    return {
      success: true,
      data: response.data,
      status: response.data?.status || 'queued'
    };
  } catch (error) {
    console.error('BlessedText Bulk SMS Error:', error.message);

    if (error.response) {
      return {
        success: false,
        error: error.response.data?.message || 'API error',
        code: error.response.status
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to send bulk SMS'
    };
  }
};

/**
 * Get account balance from BlessedText
 * @returns {Promise<Object>} Balance info
 */
export const getBalance = async () => {
  try {
    if (!BLESSEDTEXTS_API_KEY) {
      throw new Error('BlessedTexts API key not configured');
    }

    const response = await axios.get(
      `${API_BASE_URL}/account/balance`,
      {
        params: { api_key: BLESSEDTEXTS_API_KEY },
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get Balance Error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to get balance'
    };
  }
};

/**
 * Get message status from BlessedText
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} Status info
 */
export const getMessageStatus = async (messageId) => {
  try {
    if (!BLESSEDTEXTS_API_KEY) {
      throw new Error('BlessedTexts API key not configured');
    }

    const response = await axios.get(
      `${API_BASE_URL}/sms/status/${messageId}`,
      {
        params: { api_key: BLESSEDTEXTS_API_KEY },
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get Status Error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to get message status'
    };
  }
};

/**
 * Format phone number to E.164 format
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle Kenyan numbers
  if (cleaned.startsWith('0')) {
    // Convert 07xx xxx xxx to 2547xx xxx xxx
    cleaned = '254' + cleaned.substring(1);
  } else if (!cleaned.startsWith('254') && !cleaned.startsWith('+')) {
    // Assume it's a local number without prefix
    cleaned = '254' + cleaned;
  }

  // Add + if not present
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
};

/**
 * Format phone number for BlessedTexts API
 * BlessedTexts expects formats like 254722XXXXXX or 0722XXXXXX (no + sign)
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
const formatPhoneNumberBlessedTexts = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle Kenyan numbers
  if (cleaned.startsWith('0')) {
    // Keep leading 0 (e.g., 0722XXXXXX)
    cleaned = cleaned;
  } else if (cleaned.startsWith('254')) {
    // Keep 254 prefix (e.g., 254722XXXXXX)
    cleaned = cleaned;
  } else if (cleaned.startsWith('+254')) {
    // Remove + sign
    cleaned = cleaned.substring(1);
  } else {
    // Assume it's a local number without prefix, add 254
    cleaned = '254' + cleaned;
  }

  return cleaned;
};

/**
 * Calculate SMS segments (160 chars per segment)
 * @param {string} message - Message text
 * @returns {number} Number of segments
 */
export const calculateSegments = (message) => {
  return Math.ceil(message.length / 160);
};

export default {
  sendSMS,
  sendBulkSMS,
  getBalance,
  getMessageStatus,
  calculateSegments
};
