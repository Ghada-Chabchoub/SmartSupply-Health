require('dotenv').config(); 
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  dnsTimeout: 10000, // 10 seconds
  connectionTimeout: 10000, // 10 seconds
  socketTimeout: 10000, // 10 seconds
  dns: {
    family: 4, // Force IPv4 resolution
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"SmartSupply Health" <${process.env.EMAIL_FROM || 'noreply@smartsupply.com'}>`,
      to,
      subject,
      html,
    });

    // Log a success message
    console.log('Message sent: %s', info.messageId);

    // If using Ethereal, log the preview URL
    if (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('ethereal.email')) {
      console.log('📫 Preview URL for test email: %s', nodemailer.getTestMessageUrl(info));
    }
    
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
