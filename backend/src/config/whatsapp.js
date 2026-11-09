/**
 * Casekaaran — Meta WhatsApp Business Cloud API Configuration
 */
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || 'mock_phone_id';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'mock_access_token';
const GRAPH_API_VERSION = 'v21.0';

module.exports = {
  GRAPH_URL: `https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
  TOKEN: WHATSAPP_ACCESS_TOKEN,
  PHONE_ID: WHATSAPP_PHONE_NUMBER_ID,
  isMock: () => WHATSAPP_ACCESS_TOKEN === 'mock_access_token'
};
