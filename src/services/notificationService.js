// src/services/notificationService.js
// Notification service with real email and WhatsApp support

// Check if mock mode is enabled
const MOCK_MODE = import.meta.env.VITE_NOTIFICATION_MOCK_MODE === 'true';

/**
 * Notification result object
 */
class NotificationResult {
    constructor(success, channel, recipient, messageId = null, error = null) {
        this.success = success;
        this.channel = channel;
        this.recipient = recipient;
        this.message_id = messageId;
        this.error = error;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Mock notification - logs to console instead of sending.
 * 
 * @param {string} channel - 'whatsapp' | 'email' | 'webhook'
 * @param {string} recipient - Phone number, email, or URL
 * @param {string} message - Message content
 * @returns {NotificationResult}
 */
function mockNotification(channel, recipient, message) {
    console.log(`[MOCK ${channel.toUpperCase()}] To: ${recipient}`);
    console.log(`[MOCK ${channel.toUpperCase()}] Message: ${message.slice(0, 100)}...`);

    return new NotificationResult(
        true,
        channel,
        recipient,
        `mock_${channel}_${Date.now()}`
    );
}

/**
 * Send WhatsApp message via Meta WhatsApp Business API.
 *
 * @param {string} phoneNumber - Recipient phone number (formato: +1234567890)
 * @param {string} message - Message text
 * @returns {Promise<NotificationResult>}
 */
export async function sendWhatsApp(phoneNumber, message) {
    if (MOCK_MODE) {
        return mockNotification('whatsapp', phoneNumber, message);
    }

    try {
        const apiVersion = import.meta.env.VITE_WHATSAPP_API_VERSION || 'v18.0';
        const phoneId = import.meta.env.VITE_WHATSAPP_PHONE_ID;
        const accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;

        if (!phoneId || !accessToken) {
            throw new Error('WhatsApp credentials not configured');
        }

        const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phoneNumber.replace(/\D/g, ''), // Remove non-digits
                type: 'text',
                text: {
                    body: message
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'WhatsApp API error');
        }

        console.log('[WhatsApp] Message sent successfully:', data);

        return new NotificationResult(
            true,
            'whatsapp',
            phoneNumber,
            data.messages?.[0]?.id || 'sent'
        );
    } catch (error) {
        console.error('[WhatsApp] Error sending message:', error);
        return new NotificationResult(
            false,
            'whatsapp',
            phoneNumber,
            null,
            error.message
        );
    }
}

/**
 * Send email using Web3Forms API (free service for frontend).
 *
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {Promise<NotificationResult>}
 */
export async function sendEmail(email, subject, body) {
    if (MOCK_MODE) {
        return mockNotification('email', email, `${subject}: ${body}`);
    }

    try {
        // Using SMTP.js or similar would require backend
        // For frontend-only solution, we'll use a simple notification approach

        // Option 1: Use Web3Forms (free, no backend needed)
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                access_key: '8a2c4e6f-1d3b-4a9e-8c7f-2b5d9e1a3c6f', // You need to get your own from web3forms.com
                to: email,
                from: import.meta.env.VITE_EMAIL_USERNAME || 'noreply@nexus.com',
                subject: subject,
                message: body,
                from_name: import.meta.env.VITE_EMAIL_FROM_NAME || 'Nexus Floor Control'
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            // Fallback: Log to console and show in UI
            console.log('[Email] Would send:', { to: email, subject, body });
            throw new Error(data.message || 'Email sending failed');
        }

        console.log('[Email] Sent successfully:', data);

        return new NotificationResult(
            true,
            'email',
            email,
            data.message_id || 'sent'
        );
    } catch (error) {
        console.error('[Email] Error:', error);

        // For now, log the email that would have been sent
        console.log('[Email] Notification (not sent):', {
            to: email,
            subject,
            body,
            error: error.message
        });

        return new NotificationResult(
            false,
            'email',
            email,
            null,
            error.message
        );
    }
}

/**
 * Send webhook (mock).
 * 
 * @param {string} url - Webhook URL
 * @param {Object} payload - JSON payload
 * @returns {Promise<NotificationResult>}
 */
export async function sendWebhook(url, payload) {
    // In production, this would make an HTTP POST request
    return mockNotification('webhook', url, JSON.stringify(payload));
}

/**
 * Generate alert message content.
 * 
 * @param {Object} options - Alert options
 * @returns {Object} { text, html, subject }
 */
export function createThresholdAlert({
    equipmentName,
    sensor,
    value,
    threshold,
    unit = '',
    severity = 'warning',
}) {
    const emoji = severity === 'critical' ? '🔴' : severity === 'warning' ? '🟡' : '🟢';
    const now = new Date().toLocaleString();

    const text = `${emoji} NEXUS ALERT - ${severity.toUpperCase()}

Equipment: ${equipmentName}
Sensor: ${sensor}
Current Value: ${value} ${unit}
Threshold: ${threshold} ${unit}
Time: ${now}`;

    const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #1a1a2e; color: white;">
      <h2 style="color: ${severity === 'critical' ? '#ef4444' : '#eab308'};">
        ${emoji} NEXUS ALERT - ${severity.toUpperCase()}
      </h2>
      <table style="margin: 20px 0;">
        <tr><td style="padding: 5px; color: #9ca3af;">Equipment:</td><td style="padding: 5px;">${equipmentName}</td></tr>
        <tr><td style="padding: 5px; color: #9ca3af;">Sensor:</td><td style="padding: 5px;">${sensor}</td></tr>
        <tr><td style="padding: 5px; color: #9ca3af;">Current Value:</td><td style="padding: 5px; color: #ef4444;">${value} ${unit}</td></tr>
        <tr><td style="padding: 5px; color: #9ca3af;">Threshold:</td><td style="padding: 5px;">${threshold} ${unit}</td></tr>
        <tr><td style="padding: 5px; color: #9ca3af;">Time:</td><td style="padding: 5px;">${now}</td></tr>
      </table>
      <p style="color: #6b7280; font-size: 12px;">Sent by Nexus Monitoring System</p>
    </div>
  `;

    return {
        text,
        html,
        subject: `[${severity.toUpperCase()}] ${equipmentName} - ${sensor} Alert`,
    };
}

/**
 * Send alert via specified channel.
 * 
 * @param {string} channel - 'whatsapp' | 'email' | 'webhook'
 * @param {string} recipient - Target recipient
 * @param {string} message - Alert message
 * @param {Object} options - Additional options
 * @returns {Promise<NotificationResult>}
 */
export async function sendAlert(channel, recipient, message, options = {}) {
    switch (channel.toLowerCase()) {
        case 'whatsapp':
            return sendWhatsApp(recipient, message);
        case 'email':
            return sendEmail(recipient, options.subject || 'Nexus Alert', message);
        case 'webhook':
            return sendWebhook(recipient, options.payload || { message, recipient });
        default:
            return new NotificationResult(false, channel, recipient, null, `Unknown channel: ${channel}`);
    }
}

const notificationService = {
    sendWhatsApp,
    sendEmail,
    sendWebhook,
    sendAlert,
    createThresholdAlert,
};

export default notificationService;
