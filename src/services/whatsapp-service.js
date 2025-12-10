// src/services/whatsapp-service.js
// WhatsApp Business API integration

const API_VERSION = import.meta.env.VITE_WHATSAPP_API_VERSION || 'v18.0';
const PHONE_ID = import.meta.env.VITE_WHATSAPP_PHONE_ID;
const ACCESS_TOKEN = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;

/**
 * Send WhatsApp message via Meta Business API
 * @param {string} toPhone - Phone number in international format (e.g., +1234567890)
 * @param {string} message - Message text
 * @returns {Promise<object>} Response from WhatsApp API
 */
export async function sendWhatsAppMessage(toPhone, message) {
    if (!PHONE_ID || !ACCESS_TOKEN) {
        console.error('WhatsApp credentials not configured');
        throw new Error('WhatsApp API credentials missing');
    }

    // Remove + and any spaces from phone number
    const cleanPhone = toPhone.replace(/[+\s]/g, '');

    const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
            body: message
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        console.log('WhatsApp message sent:', data);
        return data;
    } catch (error) {
        console.error('WhatsApp send error:', error);
        throw error;
    }
}

/**
 * Format alert message for WhatsApp
 * @param {object} alert - Alert object with equipment, severity, message
 * @returns {string} Formatted message
 */
export function formatWhatsAppAlert(alert) {
    const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';

    return `${emoji} *Manufacturing Alert*

*Equipment:* ${alert.equipment}
*Severity:* ${alert.severity.toUpperCase()}
*Sensor:* ${alert.sensor}
*Value:* ${alert.value}
*Threshold:* ${alert.threshold}

${alert.message}

_Sent from Nexus Floor Control_`;
}
