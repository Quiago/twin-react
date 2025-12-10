// api/send-email.js
// Vercel Serverless Function for sending email alerts

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    try {
        // Create transporter with Gmail
        const transporter = nodemailer.createTransport({
            host: process.env.VITE_EMAIL_SMTP_HOST,
            port: parseInt(process.env.VITE_EMAIL_SMTP_PORT),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.VITE_EMAIL_USERNAME,
                pass: process.env.VITE_EMAIL_APP_PASSWORD,
            },
        });

        // Send email
        const info = await transporter.sendMail({
            from: `"${process.env.VITE_EMAIL_FROM_NAME}" <${process.env.VITE_EMAIL_USERNAME}>`,
            to,
            subject,
            text: body,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #ef4444;">🚨 Manufacturing Alert</h2>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <pre style="margin: 0; white-space: pre-wrap;">${body}</pre>
        </div>
        <p style="color: #64748b; font-size: 12px;">
          Sent from Nexus Floor Control System
        </p>
      </div>`,
        });

        console.log('Email sent:', info.messageId);

        return res.status(200).json({
            success: true,
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Email error:', error);
        return res.status(500).json({
            error: 'Failed to send email',
            details: error.message
        });
    }
}
