const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) console.error('Email transporter failed:', error);
  else console.log('Email transporter ready');
});

router.post('/', async (req, res) => {
  console.log('Received POST /forgot-password:', req.body);
  const { email } = req.body;

  if (!email) {
    console.log('Email missing');
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await Farmer.findOne({ email });
    console.log('Database query result:', user);
    if (!user) {
      console.log('No user found for email:', email);
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;

    // Update user with reset token
    await Farmer.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry
    });
    console.log('Reset token stored for:', email);

    const resetUrl = `http://localhost:3000/reset-password.html?token=${resetToken}`;
    console.log('Generated reset URL:', resetUrl); // Debug the URL

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - Kisaan Connect',
      text: `You requested a password reset for your Kisaan Connect account. Visit this link to reset your password: ${resetUrl}. This link expires in 1 hour. If you didn’t request this, ignore this email.`, // Plain text fallback
      html: `
        <p>You requested a password reset for your Kisaan Connect account.</p>
        <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn’t request this, ignore this email.</p>
      `
    };

    console.log('Sending email with options:', mailOptions); // Debug email content
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Failed to send email:', error);
      } else {
        console.log('Email sent successfully:', info.response);
      }
    });
    console.log('Reset email sent to:', email);

    res.status(200).json({ message: 'Password reset email sent!' });
  } catch (error) {
    console.error('Error in /forgot-password:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

router.post('/reset', async (req, res) => {
    console.log('Received POST /forgot-password/reset:', req.body);
    const { token, newPassword } = req.body;
  
    if (!token || !newPassword) {
      console.log('Missing token or newPassword');
      return res.status(400).json({ error: 'Token and new password are required' });
    }
  
    try {
      console.log('Querying database with token:', token);
      const user = await Farmer.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() }
      });
      console.log('Query result:', user);
      if (!user) {
        console.log('No user found for token');
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log('Hashed new password');
  
      // Update password and clear reset token
      await Farmer.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      });
      console.log('Password reset for user:', user.email);
  
      res.status(200).json({ message: 'Password reset successfully!' });
    } catch (error) {
      console.error('Error in /forgot-password/reset:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

module.exports = router;