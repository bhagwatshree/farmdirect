const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const OpenAI = require('openai');
const Fruit = require('../models/Fruit');
const User = require('../models/User');
const { sendEmail } = require('../utils/notifications');
const authenticate = require('../middleware/auth');

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/chat/send-otp — send 6-digit OTP to user's email
router.post('/send-otp', authenticate, async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.chatOtp = otp;
    user.chatOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendEmail(
      email,
      'FarmDirect — Your verification code',
      `<div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2e7d32">Your Verification Code</h2>
        <p>Hi ${user.name},</p>
        <p>Use this code to verify your identity in the FarmDirect chat:</p>
        <h1 style="letter-spacing:10px;color:#2e7d32;font-size:40px">${otp}</h1>
        <p style="color:#666">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#999;font-size:12px">If you did not request this, please ignore this email.</p>
      </div>`
    );

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// POST /api/chat/verify-otp — verify OTP and return session token
router.post('/verify-otp', authenticate, async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and code required' });

    const user = await User.findOne({
      email,
      chatOtp: otp,
      chatOtpExpiry: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired code' });

    user.chatOtp = null;
    user.chatOtpExpiry = null;
    await user.save();

    const sessionToken = jwt.sign(
      { id: user._id, email: user.email, scope: 'chat_account' },
      JWT_SECRET,
      { expiresIn: '30m' }
    );

    res.json({ sessionToken });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/chat — main chat endpoint
router.post('/', authenticate, async (req, res) => {
  try {
    const { message, history = [], sessionToken } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    // Verify session token if provided
    let sessionUser = null;
    if (sessionToken) {
      try {
        const decoded = jwt.verify(sessionToken, JWT_SECRET);
        if (decoded.scope === 'chat_account') {
          sessionUser = await User.findById(decoded.id).lean();
        }
      } catch (e) { /* invalid/expired token — treat as unauthenticated */ }
    }

    const fruits = await Fruit.find({ quantity: { $gt: 0 } }).lean().limit(50);
    const fruitContext = fruits.length
      ? fruits.map(f =>
          `- ${f.name} (${f.category}): ₹${f.price}/${f.unit}, qty: ${f.quantity}, ` +
          `location: ${f.location || 'unknown'}, farmer: ${f.farmerName}, ` +
          `listed: ${new Date(f.createdAt).toLocaleDateString('en-IN')}`
        ).join('\n')
      : 'No fruits currently available.';

    let systemPrompt, tools = [];

    if (sessionUser) {
      systemPrompt = `You are FarmDirect's helpful assistant with account management capabilities.

Verified Customer:
- Name: ${sessionUser.name}
- Email: ${sessionUser.email}
- Billing Address: ${JSON.stringify(sessionUser.billingAddress || {})}
- Delivery Address: ${JSON.stringify(sessionUser.deliveryAddress || {})}

Current fruit listings:
${fruitContext}

You can help with fruit recommendations AND account management using the tools provided.
- To update an address: collect all fields first (street, city, state, postalCode, country), then call update_address
- To reset password: confirm intent, then call send_password_reset
- To show account details: call get_account_info
- Be concise and confirm actions before executing them`;

      tools = [
        {
          type: 'function',
          function: {
            name: 'get_account_info',
            description: "Retrieve the verified customer's account details (name, email, addresses)",
            parameters: { type: 'object', properties: {} },
          },
        },
        {
          type: 'function',
          function: {
            name: 'update_address',
            description: 'Update the billing and/or delivery address for the verified customer',
            parameters: {
              type: 'object',
              properties: {
                addressType: {
                  type: 'string',
                  enum: ['billing', 'delivery', 'both'],
                  description: 'Which address to update',
                },
                street:     { type: 'string', description: 'Street address' },
                city:       { type: 'string', description: 'City' },
                state:      { type: 'string', description: 'State or province' },
                postalCode: { type: 'string', description: 'Postal or ZIP code' },
                country:    { type: 'string', description: 'Country' },
              },
              required: ['addressType'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'send_password_reset',
            description: "Send a password reset link to the verified customer's registered email",
            parameters: { type: 'object', properties: {} },
          },
        },
      ];
    } else {
      systemPrompt = `You are FarmDirect's helpful shopping assistant. You help customers find fresh fruits from local farmers.

Current available listings:
${fruitContext}

Guidelines:
- Recommend fruits based on location, freshness (newer = fresher), price, and quantity
- Keep responses concise and friendly (2-4 sentences unless listing items)
- Format all prices in ₹ (INR)
- Do not make up listings that aren't in the data above
- For account-specific requests (password reset, address update, view account info): tell the user you can help once they verify their identity via the chat, then end your response with exactly: <<<NEED_AUTH>>>`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];

    const reqParams = { model: 'gpt-4o-mini', max_tokens: 500, messages };
    if (tools.length > 0) {
      reqParams.tools = tools;
      reqParams.tool_choice = 'auto';
    }

    const response = await client.chat.completions.create(reqParams);
    let reply, requiresAuth = false;

    if (response.choices[0].finish_reason === 'tool_calls') {
      const toolCall = response.choices[0].message.tool_calls[0];
      let toolResult = '';

      switch (toolCall.function.name) {
        case 'get_account_info':
          toolResult = JSON.stringify({
            name: sessionUser.name,
            email: sessionUser.email,
            billingAddress: sessionUser.billingAddress,
            deliveryAddress: sessionUser.deliveryAddress,
          });
          break;

        case 'update_address': {
          const args = JSON.parse(toolCall.function.arguments);
          const { addressType, ...fields } = args;
          const fresh = await User.findById(sessionUser._id).lean();
          const patch = {};
          ['street', 'city', 'state', 'postalCode', 'country'].forEach(k => {
            if (fields[k] !== undefined) patch[k] = fields[k];
          });
          const updateQuery = {};
          if (addressType === 'billing' || addressType === 'both') {
            updateQuery.billingAddress = { ...(fresh.billingAddress || {}), ...patch };
          }
          if (addressType === 'delivery' || addressType === 'both') {
            updateQuery.deliveryAddress = { ...(fresh.deliveryAddress || {}), ...patch };
          }
          await User.findByIdAndUpdate(sessionUser._id, updateQuery);
          toolResult = `${addressType} address updated successfully.`;
          break;
        }

        case 'send_password_reset': {
          const resetTok = crypto.randomBytes(32).toString('hex');
          await User.findByIdAndUpdate(sessionUser._id, {
            resetToken: resetTok,
            resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
          });
          const resetLink = `http://localhost:5000/reset-password?token=${resetTok}&email=${encodeURIComponent(sessionUser.email)}`;
          await sendEmail(
            sessionUser.email,
            'FarmDirect — Reset your password',
            `<h2>Reset your FarmDirect password</h2>
             <p>Hi ${sessionUser.name},</p>
             <p>Click below to reset your password. This link expires in 1 hour.</p>
             <p><a href="${resetLink}" style="background:#2e7d32;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">Reset Password</a></p>
             <p style="color:#666;font-size:12px">Or copy: ${resetLink}</p>`
          );
          toolResult = `Password reset email sent to ${sessionUser.email}.`;
          break;
        }

        default:
          toolResult = 'Done.';
      }

      // Follow-up call with tool result
      const followUp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [
          ...messages,
          response.choices[0].message,
          { role: 'tool', tool_call_id: toolCall.id, content: toolResult },
        ],
      });
      reply = followUp.choices[0].message.content;
    } else {
      reply = response.choices[0].message.content;
      if (reply.includes('<<<NEED_AUTH>>>')) {
        reply = reply.replace('<<<NEED_AUTH>>>', '').trim();
        requiresAuth = true;
      }
    }

    res.json({ reply, requiresAuth });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ message: 'Chat error. Please try again.' });
  }
});

module.exports = router;
