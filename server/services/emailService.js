// services/emailService.js - Email sending service
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter;

// Initialize email transporter
const initializeEmailService = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn('⚠️  Email credentials not configured - email service disabled');
    return false;
  }

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      logger.warn('⚠️  Email service verification failed', { error: error.message });
    } else {
      logger.info('✅ Email service ready');
    }
  });

  return true;
};

// Send verification email
const sendVerificationEmail = async (email, token, userName) => {
  if (!transporter) {
    logger.warn('Email service not initialized');
    return false;
  }

  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your VendorLink Account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #d97706; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .button { background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to VendorLink! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for signing up for VendorLink. Please verify your email address to complete your registration and start using our platform.</p>
              <a href="${verifyUrl}" class="button">Verify Email</a>
              <p>Or copy this link: <a href="${verifyUrl}">${verifyUrl}</a></p>
              <p>This link will expire in 24 hours.</p>
              <p>Best regards,<br>VendorLink Team</p>
            </div>
            <div class="footer">
              <p>© 2026 VendorLink. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Verification email sent', { email });
    return true;
  } catch (error) {
    logger.error('Failed to send verification email', { email, error: error.message });
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetUrl, userName) => {
  if (!transporter) {
    logger.warn('Email service not initialized');
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your VendorLink Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #d97706; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .button { background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>We received a request to reset your password. Click the button below to create a new password.</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <p>Best regards,<br>VendorLink Team</p>
            </div>
            <div class="footer">
              <p>© 2026 VendorLink. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Password reset email sent', { email });
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', { email, error: error.message });
    return false;
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (email, orderId, orderDetails) => {
  if (!transporter) {
    logger.warn('Email service not initialized');
    return false;
  }

  const itemsHTML = orderDetails.items
    .map(item => `<li>${item.name} x ${item.quantity} - ₹${item.price}</li>`)
    .join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Order Confirmation - ${orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #d97706; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
            .items-list { list-style: none; padding: 0; }
            .total { font-size: 18px; font-weight: bold; padding-top: 10px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed! ✓</h1>
            </div>
            <div class="content">
              <p>Your order has been placed successfully.</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              <h3>Order Items:</h3>
              <ul class="items-list">${itemsHTML}</ul>
              <div class="total">Total: ₹${orderDetails.totalAmount}</div>
              <p>You can track your order status in your account dashboard.</p>
              <p>Best regards,<br>VendorLink Team</p>
            </div>
            <div class="footer">
              <p>© 2026 VendorLink. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Order confirmation email sent', { email, orderId });
    return true;
  } catch (error) {
    logger.error('Failed to send order confirmation email', { email, orderId, error: error.message });
    return false;
  }
};

// Generic email sender
const sendEmail = async (email, subject, htmlContent) => {
  if (!transporter) {
    logger.warn('Email service not initialized');
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Email sent', { email, subject });
    return true;
  } catch (error) {
    logger.error('Failed to send email', { email, subject, error: error.message });
    return false;
  }
};

module.exports = {
  initializeEmailService,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendEmail,
};
