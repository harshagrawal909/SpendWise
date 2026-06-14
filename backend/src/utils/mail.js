import nodemailer from 'nodemailer';

/**
 * Sends an email using either Resend API (HTTP-based, recommended for Vercel/serverless)
 * or standard SMTP (Nodemailer, fallback for traditional servers).
 * 
 * Configurable via environment variables:
 * - RESEND_API_KEY: To use Resend API.
 * - EMAIL_FROM: Sender name/email address (e.g., 'SpendWise <onboarding@resend.dev>').
 * - EMAIL_USER / EMAIL_PASS: To use SMTP.
 * - EMAIL_HOST / EMAIL_PORT / EMAIL_SECURE: Optional SMTP server configuration.
 */
export async function sendEmail({ to, subject, text, html }) {
    const recipientList = Array.isArray(to) ? to : [to];

    // 1. Resend HTTP REST API (Recommended for Vercel / serverless)
    if (process.env.RESEND_API_KEY) {
        try {
            console.log(`[Mail Utility] Dispatching email via Resend HTTP API to: ${recipientList.join(', ')}`);
            const fromEmail = process.env.EMAIL_FROM || 'SpendWise <onboarding@resend.dev>';
            
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: fromEmail,
                    to: recipientList,
                    subject,
                    text,
                    html
                })
            });

            const resData = await response.json();
            if (response.ok) {
                console.log('[Mail Utility] Email sent successfully via Resend API. ID:', resData.id);
                return { success: true, provider: 'resend', id: resData.id };
            } else {
                throw new Error(resData.message || JSON.stringify(resData));
            }
        } catch (err) {
            console.error('[Mail Utility] Resend API error:', err.message);
            // If SMTP variables are not configured, rethrow the error
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                throw err;
            }
        }
    }

    // 2. SMTP fallback (Nodemailer)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            console.log(`[Mail Utility] Dispatching email via SMTP transporter to: ${recipientList.join(', ')}`);
            
            const transportConfig = {
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                }
            };

            if (process.env.EMAIL_HOST) {
                transportConfig.host = process.env.EMAIL_HOST;
                transportConfig.port = parseInt(process.env.EMAIL_PORT || '587');
                transportConfig.secure = process.env.EMAIL_SECURE === 'true';
                console.log(`[Mail Utility] Using custom SMTP server config: ${transportConfig.host}:${transportConfig.port} (secure: ${transportConfig.secure})`);
            } else {
                transportConfig.service = process.env.EMAIL_SERVICE || 'gmail';
                console.log(`[Mail Utility] Using standard email service config: ${transportConfig.service}`);
            }

            const transporter = nodemailer.createTransport(transportConfig);
            const fromEmail = process.env.EMAIL_FROM || `"SpendWise System" <${process.env.EMAIL_USER}>`;

            const info = await transporter.sendMail({
                from: fromEmail,
                to: recipientList.join(','),
                subject,
                text,
                html
            });

            console.log('[Mail Utility] Email sent successfully via SMTP. Info:', info.messageId || info);
            return { success: true, provider: 'smtp', id: info.messageId };
        } catch (emailErr) {
            console.error('[Mail Utility] SMTP transporter error:', emailErr.message);
            throw emailErr;
        }
    }

    console.warn('[Mail Utility] Email sending SKIPPED: Neither RESEND_API_KEY nor EMAIL_USER/EMAIL_PASS environment variables are defined in .env');
    return { success: false, reason: 'unconfigured' };
}
