const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { sendEmail } = require('../utils/notifications');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const MAX_LOGIN_ATTEMPTS = 5;

router.post('/register', async (req, res) => {
  try {
    const { name, password, role, location, phone, billingAddress, deliveryAddress } = req.body;
    const email = req.body.email?.toLowerCase().trim();
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }
    if (!['farmer', 'customer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be farmer or customer' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      _id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role,
      location: location || '',
      phone: phone || '',
      billingAddress: billingAddress || {},
      deliveryAddress: deliveryAddress || billingAddress || {},
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.locked) {
      return res.status(403).json({ message: 'Account locked. Reset your password to unlock.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.locked = true;
      }
      await user.save();
      if (user.locked) {
        return res.status(403).json({ message: 'Account locked after too many failed attempts. Reset your password to unlock.' });
      }
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Successful login — reset counters
    user.loginAttempts = 0;
    user.locked = false;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, location: user.location },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    // Always return 200 to prevent email enumeration
    const user = await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetToken = token;
      user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const resetLink = `http://localhost:5000/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      const html = `
        <h2>Reset your FarmDirect password</h2>
        <p>Hi ${user.name},</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetLink}" style="background:#2e7d32;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">Reset Password</a></p>
        <p>Or copy this link: ${resetLink}</p>
        <p>If you did not request this, ignore this email.</p>
      `;
      sendEmail(user.email, 'FarmDirect — Reset your password', html).catch(err =>
        console.error('[Auth] forgot-password email error:', err.message)
      );
    }

    res.json({ message: 'If that email is registered, a reset link was sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const email = req.body.email?.toLowerCase().trim();
    if (!email || !token || !password) {
      return res.status(400).json({ message: 'Email, token and password are required' });
    }

    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.loginAttempts = 0;
    user.locked = false;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
