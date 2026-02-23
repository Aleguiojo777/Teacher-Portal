const nodemailer = require('nodemailer');
const logger = require('./logger');

// Reads SMTP config from environment. If not configured, alerts are disabled.
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465, // true for 465, false for other ports
    auth: { user, pass }
  });
}

async function sendLockoutEmail(email, ip) {
  const transporter = getTransporter();
  if (!transporter) {
    logger.warn(`Alert email not sent; SMTP not configured. Lockout for ${email} from ${ip}`);
    return;
  }

  const to = process.env.ALERT_EMAIL_TO || process.env.SMTP_USER;
  const from = process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER;
  const subject = `Account locked: ${email}`;
  const text = `The account ${email} was locked due to repeated failed login attempts. IP: ${ip}. Time: ${new Date().toISOString()}`;

  try {
    await transporter.sendMail({ from, to, subject, text });
    logger.info(`Lockout alert sent for ${email} to ${to}`);
  } catch (err) {
    logger.error(`Failed to send lockout alert for ${email}: ${err && err.message}`);
  }
}

module.exports = { sendLockoutEmail };
