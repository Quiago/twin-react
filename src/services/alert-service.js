// src/services/alert-service.js
// Main alert orchestration service

import { formatWhatsAppAlert, sendWhatsAppMessage } from './whatsapp-service';

const MOCK_MODE = import.meta.env.VITE_NOTIFICATION_MOCK_MODE === 'true';

/**
 * Send email alert via Vercel API route
 * @param {string} to - Email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {Promise<object>} Response
 */
export async function sendEmailAlert(to, subject, body) {
    if (MOCK_MODE) {
        console.log('[MOCK] Email would be sent:', { to, subject, body });
        return { success: true, mock: true };
    }

    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to, subject, body }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || 'Failed to send email');
        }

        return await response.json();
    } catch (error) {
        console.error('Email alert error:', error);
        throw error;
    }
}

/**
 * Send WhatsApp alert
 * @param {string} toPhone - Phone number in international format
 * @param {string} message - Message text
 * @returns {Promise<object>} Response
 */
export async function sendWhatsApp(toPhone, message) {
    if (MOCK_MODE) {
        console.log('[MOCK] WhatsApp would be sent:', { toPhone, message });
        return { success: true, mock: true };
    }

    return await sendWhatsAppMessage(toPhone, message);
}

/**
 * Process workflow alert action
 * @param {object} alert - Alert data from simulation
 * @param {object} actionConfig - Workflow action configuration
 * @returns {Promise<void>}
 */
export async function processAlertAction(alert, actionConfig) {
    const {
        phone_number,
        email,
        message_template,
        severity
    } = actionConfig;

    // Build message
    const defaultMessage = `Alert: ${alert.equipment} - ${alert.sensor} = ${alert.value} (threshold: ${alert.threshold})`;
    const message = message_template || defaultMessage;

    const results = [];

    // Send email if configured
    if (email) {
        try {
            const subject = `[${severity?.toUpperCase() || 'ALERT'}] ${alert.equipment}`;
            const result = await sendEmailAlert(email, subject, message);
            results.push({ type: 'email', success: true, result });
            console.log('✅ Email alert sent to:', email);
        } catch (error) {
            results.push({ type: 'email', success: false, error: error.message });
            console.error('❌ Email alert failed:', error);
        }
    }

    // Send WhatsApp if configured
    if (phone_number) {
        try {
            const formattedMessage = formatWhatsAppAlert({
                ...alert,
                severity: severity || 'warning',
                message
            });
            const result = await sendWhatsApp(phone_number, formattedMessage);
            results.push({ type: 'whatsapp', success: true, result });
            console.log('✅ WhatsApp alert sent to:', phone_number);
        } catch (error) {
            results.push({ type: 'whatsapp', success: false, error: error.message });
            console.error('❌ WhatsApp alert failed:', error);
        }
    }

    return results;
}
