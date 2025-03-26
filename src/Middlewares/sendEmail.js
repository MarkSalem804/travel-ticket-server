require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email content (HTML format)
 */
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: '"Gary Valenciano Hataw na" <yourcompany@gmail.com>',
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
  }
};

module.exports = sendEmail;
