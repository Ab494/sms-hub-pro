import axios from 'axios';

/**
 * BlessedTexts Sender ID Registration Service
 *
 * When an admin approves a Sender ID request on TumaPrime, this service
 * forwards the registration request to BlessedTexts (our upstream SMS
 * aggregator) so that the Sender ID can be provisioned with the MNOs.
 */

const BLESSEDTEXTS_API_KEY = process.env.BLESSEDTEXTS_API_KEY;
const TEST_MODE = process.env.BLESSEDTEXTS_TEST_MODE === 'true';

const API_BASE_URL = TEST_MODE
  ? 'https://test.blessedtexts.com/api/sms/v1'
  : 'https://sms.blessedtexts.com/api/sms/v1';

/**
 * Submit a Sender ID registration request to BlessedTexts.
 *
 * @param {Object} params
 * @param {string} params.senderId        - Requested sender ID (3-11 chars)
 * @param {string} params.reason          - Business/use-case justification
 * @param {Object} [params.company]       - Requesting company info
 * @param {string} [params.company.name]
 * @param {string} [params.company.email]
 * @returns {Promise<{success:boolean,data?:any,reference?:string,error?:string}>}
 */
export const registerSenderIdWithProvider = async ({ senderId, reason, company = {} }) => {
  if (!BLESSEDTEXTS_API_KEY) {
    return {
      success: false,
      error: 'BLESSEDTEXTS_API_KEY not configured. Cannot forward Sender ID to provider.',
    };
  }

  const payload = {
    api_key: BLESSEDTEXTS_API_KEY,
    sender_id: senderId,
    reason,
    company_name: company.name || '',
    company_email: company.email || '',
  };

  try {
    console.log(`${TEST_MODE ? '[TEST MODE] ' : ''}Submitting Sender ID "${senderId}" to BlessedTexts...`);

    const response = await axios.post(
      `${API_BASE_URL}/senderid/register`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 30000,
      }
    );

    return {
      success: true,
      data: response.data,
      reference:
        response.data?.reference ||
        response.data?.request_id ||
        response.data?.id ||
        null,
    };
  } catch (error) {
    console.error('BlessedTexts Sender ID registration error:', error.message);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to register Sender ID with provider',
      data: error.response?.data,
    };
  }
};

export default { registerSenderIdWithProvider };
