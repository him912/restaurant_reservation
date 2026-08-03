const nodemailer = require("nodemailer");

function createSmtpTransporter() {
  const user = process.env.MAIL_SMTP_USER;
  const pass = process.env.MAIL_SMTP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "MAIL_SMTP_USER and MAIL_SMTP_PASSWORD are required when EMAIL_PROVIDER=smtp"
    );
  }

  return nodemailer.createTransport({
    host: process.env.MAIL_SMTP_HOST,
    port: Number(process.env.MAIL_SMTP_PORT),
    secure: process.env.MAIL_SMTP_ENCRYPTION === "ssl",
    auth: { user, pass },
  });
}

function getFromAddress() {
  const name = process.env.MAIL_FROM_NAME || "DineFlow";
  const email =
    process.env.MAIL_FROM_ADDRESS || process.env.MAIL_SMTP_USER;

  return { name, email, formatted: `"${name}" <${email}>` };
}

async function sendViaSmtp({ to, subject, html }) {
  const from = getFromAddress();
  const transporter = createSmtpTransporter();

  await transporter.sendMail({
    from: from.formatted,
    to,
    subject,
    html,
  });
}

async function sendViaBrevo({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set");
  }

  if (apiKey.startsWith("xsmtpsib-")) {
    throw new Error(
      "BREVO_API_KEY is an SMTP key. Create an API v3 key (starts with xkeysib-) in Brevo → SMTP & API → API Keys"
    );
  }

  const from = getFromAddress();

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: from.name, email: from.email },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Brevo API error (${response.status})`);
  }
}

async function sendEmail({ to, subject, html }) {
  const provider = process.env.EMAIL_PROVIDER || "smtp";

  if (provider === "brevo") {
    return sendViaBrevo({ to, subject, html });
  }

  return sendViaSmtp({ to, subject, html });
}

module.exports = { sendEmail };
