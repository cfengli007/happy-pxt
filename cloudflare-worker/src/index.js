// Cloudflare Worker script for scheduling emails

// Helper function for sending response
function jsonResponse(data, status = 200) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Allow all origins
  };
  return new Response(JSON.stringify(data), {
    status: status,
    headers: headers,
  });
}

// Helper function to generate a unique ID (simple version)
function generateVerificationCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

// Helper function to generate a unique ID (simple version)
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Placeholder for encryption/decryption functions
// In a real application, use a robust library like 'encrypt-workers-kv' or Web Crypto API
async function encryptData(data, secret) {
  console.warn("Using placeholder encryption. Implement robust encryption for production.");
  return `encrypted_${secret}_${JSON.stringify(data)}`;
}

async function decryptData(encryptedDataString, secret) {
  console.warn("Using placeholder decryption. Implement robust encryption for production.");
  const prefix = `encrypted_${secret}_`;
  if (encryptedDataString.startsWith(prefix)) {
    return JSON.parse(encryptedDataString.substring(prefix.length));
  }
  throw new Error("Decryption failed or invalid format");
}

export default {
  /**
   * Handles incoming HTTP requests.
   * This endpoint will be used by the frontend to schedule an email.
   * @param {Request} request
   * @param {object} env - Environment variables, including KV namespace bindings and secrets.
   * @param {object} ctx - Execution context.
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204, // No Content
        headers: {
          'Access-Control-Allow-Origin': '*', // Or your specific frontend origin e.g., http://localhost:8080
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Add any other headers your frontend sends
        },
      });
    }

    const { SCHEDULED_EMAILS_KV, RESEND_API_KEY, ENCRYPTION_SECRET } = env;

    if (!SCHEDULED_EMAILS_KV) {
      return jsonResponse({ error: 'KV Namespace not bound' }, 500);
    }
    if (!RESEND_API_KEY) {
      return jsonResponse({ error: 'RESEND_API_KEY secret not configured' }, 500);
    }
    if (!ENCRYPTION_SECRET) {
      return jsonResponse({ error: 'ENCRYPTION_SECRET not configured for data protection' }, 500);
    }

    const url = new URL(request.url);

    // Endpoint to send a verification email
    if (request.method === 'POST' && url.pathname === '/send-verification-email') {
      try {
        const { email } = await request.json();
        if (!email) {
          return jsonResponse({ error: 'Missing required field: email' }, 400);
        }

        // Basic email format validation (optional, but good practice)
        if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(email)) {
          return jsonResponse({ error: 'Invalid email format' }, 400);
        }

        const birthdayWishes = JSON.parse(env.BIRTHDAY_WISHES);
        const randomWishAsCode = birthdayWishes[Math.floor(Math.random() * birthdayWishes.length)];
        const verificationKey = `verification:${email}`;
        const expiresAt = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes

        const verificationData = {
          email: email,
          code: randomWishAsCode, // Store the wish as the code
          status: 'pending_verification',
          expiresAt: expiresAt,
        };

        // Encrypt verification data before storing
        const encryptedVerificationData = await encryptData(verificationData, ENCRYPTION_SECRET);
        await SCHEDULED_EMAILS_KV.put(verificationKey, encryptedVerificationData, { expiration: Math.floor(expiresAt / 1000) });

        // Send verification email via Resend
        const verificationEmailHtml = env.VERIFICATION_EMAIL_TEMPLATE.replace('${randomWishAsCode}', randomWishAsCode);

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${env.VERIFICATION_SENDER_NAME || '祝你快乐'} <${env.VERIFICATION_EMAIL}>`, // 从环境变量获取发送邮箱
            to: [email],
            subject: env.VERIFICATION_EMAIL_SUBJECT || '【祝你快乐】邮箱验证码',
            html: verificationEmailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const errorResult = await resendResponse.json();
          console.error('Failed to send verification email:', errorResult);
          // Don't expose detailed error to client for security, but log it
          return jsonResponse({ error: 'Failed to send verification email. Please try again later.' }, 500);
        }

        return jsonResponse({ success: true, message: '验证邮件已发送，请检查您的收件箱。' });
      } catch (error) {
        console.error('Error sending verification email:', error);
        return jsonResponse({ error: 'Failed to send verification email.', details: error.message }, 500);
      }
    }

    // Endpoint to verify an email address
    if (request.method === 'POST' && url.pathname === '/verify-email') {
      try {
        const { email, code } = await request.json();
        if (!email || !code) {
          return jsonResponse({ error: 'Missing required fields: email, code' }, 400);
        }

        const verificationKey = `verification:${email}`;
        const encryptedStoredDataString = await SCHEDULED_EMAILS_KV.get(verificationKey);

        if (!encryptedStoredDataString) {
          return jsonResponse({ error: 'Verification code not found or expired. Please request a new one.' }, 400);
        }

        let storedData;
        try {
          storedData = await decryptData(encryptedStoredDataString, ENCRYPTION_SECRET);
        } catch (decryptionError) {
          console.error(`Failed to decrypt verification data for ${email}:`, decryptionError);
          return jsonResponse({ error: 'Internal server error during verification data processing.' }, 500);
        }

        if (storedData.expiresAt < Date.now()) {
          await SCHEDULED_EMAILS_KV.delete(verificationKey); // Clean up expired code
          return jsonResponse({ error: '验证祝福语已过期，请重新获取。' }, 400);
        }

        if (storedData.code !== code) { // 'code' here is the wish sent by the user
          return jsonResponse({ error: '验证祝福语不正确，请重试。' }, 400);
        }

        // Mark as verified - for simplicity, we'll update the existing record.
        storedData.status = 'verified';
        const updatedEncryptedVerificationData = await encryptData(storedData, ENCRYPTION_SECRET);
        await SCHEDULED_EMAILS_KV.put(verificationKey, updatedEncryptedVerificationData, { expiration: Math.floor(storedData.expiresAt / 1000) });

        return jsonResponse({ success: true, message: '邮箱验证成功！祝福已送达！' });
      } catch (error) {
        console.error('Error verifying email:', error);
        return jsonResponse({ error: 'Failed to verify email.', details: error.message }, 500);
      }
    }

    // Endpoint to schedule a new email
    if (request.method === 'POST' && url.pathname === '/schedule-email') {
      try {
        const { email, message, sendDate } = await request.json();

        if (!email || !message || !sendDate) {
          return jsonResponse({ error: 'Missing required fields: email, message, sendDate' }, 400);
        }

        // Validate sendDate (must be a future date)
        // The sendDate from the client is already a UTC timestamp string (e.g., "2026-05-29T00:00:00.000Z")
        const scheduledTime = new Date(sendDate).getTime(); // This directly gives UTC milliseconds

        if (isNaN(scheduledTime)) {
          return jsonResponse({ error: 'Invalid sendDate format.' }, 400);
        }
        // Ensure the scheduledTime is in the future. Date.now() is also UTC milliseconds.
        if (scheduledTime <= Date.now()) {
          return jsonResponse({ error: 'sendDate must be in the future.' }, 400);
        }

        const emailId = generateId();
        const emailData = {
          id: emailId,
          to: email,
          subject: env.SCHEDULED_EMAIL_SUBJECT || '来自2025的你的一封信！', // 中文邮件主题
          html: env.SCHEDULED_EMAIL_TEMPLATE.replace('${message}', message),

          scheduledTime: scheduledTime, // Already in UTC milliseconds
          status: 'pending', // pending, sent, failed
        };

        // Encrypt the email data before storing
        const encryptedEmailData = await encryptData(emailData, ENCRYPTION_SECRET);

        // Store in KV. Key could be `email:${emailId}` or `scheduled:${scheduledTime}:${emailId}` for easier querying by time
        // For simplicity, using emailId as key for now.
        await SCHEDULED_EMAILS_KV.put(`email:${emailId}`, encryptedEmailData, {
          // Optional: Set expiration if emails should be auto-deleted after a certain time post-sending
          // expirationTtl: (scheduledTime / 1000) + (7 * 24 * 60 * 60) // e.g., expire 7 days after scheduled send time
        });

        return jsonResponse({ success: true, emailId: emailId, message: 'Email scheduled successfully.' });
      } catch (error) {
        console.error('Error scheduling email:', error);
        return jsonResponse({ error: 'Failed to schedule email.', details: error.message }, 500);
      }
    }

    return jsonResponse({ message: 'Welcome to the Birthday Email Scheduler Worker!' });
  },

  /**
   * Handles scheduled events (Cron Triggers).
   * This function will run based on the cron schedule in wrangler.toml
   * @param {object} controller - Contains information about the scheduled event.
   * @param {object} env - Environment variables, including KV namespace bindings and secrets.
   * @param {object} ctx - Execution context.
   */
  async scheduled(controller, env, ctx) {
    const { SCHEDULED_EMAILS_KV, RESEND_API_KEY, ENCRYPTION_SECRET } = env;
    console.log(`Cron event triggered at: ${new Date(controller.scheduledTime).toISOString()}`);

    if (!SCHEDULED_EMAILS_KV || !RESEND_API_KEY || !ENCRYPTION_SECRET) {
      console.error('Scheduled task: Missing required environment variables or bindings.');
      return; // Exit if configuration is incomplete
    }

    try {
      const { keys } = await SCHEDULED_EMAILS_KV.list({ prefix: 'email:' });
      const currentTime = Date.now();

      for (const kvKey of keys) {
        const encryptedEmailDataString = await SCHEDULED_EMAILS_KV.get(kvKey.name);
        if (!encryptedEmailDataString) continue;

        let emailData;
        try {
          emailData = await decryptData(encryptedEmailDataString, ENCRYPTION_SECRET);
        } catch (decryptionError) {
          console.error(`Failed to decrypt email data for key ${kvKey.name}:`, decryptionError);
          // Optionally, update status to 'decryption_failed' or handle appropriately
          await SCHEDULED_EMAILS_KV.put(kvKey.name, await encryptData({...JSON.parse(encryptedEmailDataString.substring(encryptedEmailDataString.indexOf('{'))), status: 'decryption_failed'}, ENCRYPTION_SECRET));
          continue;
        }

        if (emailData.status === 'pending' && emailData.scheduledTime <= currentTime) {
          console.log(`Processing email ID: ${emailData.id} to ${emailData.to}`);

          try {
            const resendResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: `${env.SCHEDULED_SENDER_NAME || 'FROM 2025'} <${env.SENDER_EMAIL}>`, // 从环境变量获取发送邮箱
                to: [emailData.to],
                subject: emailData.subject,
                html: emailData.html,
              }),
            });

            const resendResult = await resendResponse.json();

            if (resendResponse.ok && resendResult.id) {
              console.log(`Email sent successfully to ${emailData.to}, Resend ID: ${resendResult.id}`);
              emailData.status = 'sent';
              emailData.sentTime = Date.now();
              emailData.resendId = resendResult.id;
            } else {
              console.error(`Failed to send email to ${emailData.to}:`, resendResult);
              emailData.status = 'failed';
              emailData.error = resendResult.message || 'Unknown error from Resend';
            }
          } catch (sendError) {
            console.error(`Error sending email via Resend for ID ${emailData.id}:`, sendError);
            emailData.status = 'failed';
            emailData.error = sendError.message;
          }

          // Update the status in KV
          const updatedEncryptedEmailData = await encryptData(emailData, ENCRYPTION_SECRET);
          await SCHEDULED_EMAILS_KV.put(kvKey.name, updatedEncryptedEmailData);
        }
      }
      console.log('Scheduled email check complete.');
    } catch (error) {
      console.error('Error in scheduled task:', error);
    }
  },
};