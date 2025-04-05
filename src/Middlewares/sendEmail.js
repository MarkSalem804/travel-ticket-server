require("dotenv").config();
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email with optional attachment
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email content (HTML format)
 * @param {string|array|null} attachmentPath - Optional file attachment path(s)
 */
const sendEmail = async (to, subject, html, attachmentPath = null) => {
  try {
    const attachments = Array.isArray(attachmentPath)
      ? attachmentPath.map((pathItem) => ({
          filename: path.basename(pathItem),
          path: pathItem,
        }))
      : attachmentPath
      ? [
          {
            filename: path.basename(attachmentPath),
            path: attachmentPath,
          },
        ]
      : [];

    const mailOptions = {
      from: `"SDOIC - TRIP TICKET MAIL" <${process.env.EMAIL_USER}>`, // Use company name as sender
      to,
      subject,
      html,
      attachments, // Attach the array of attachments
    };

    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`❌ Error sending email:`, error);
  }
};

module.exports = sendEmail;
