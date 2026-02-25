const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(compression());
app.set('trust proxy', 1);

// Skip logging and rate-limiting in test environment
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use('/api', limiter);
}

app.use(cors());

// Webhook MUST be registered before express.json() — needs raw body for signature verification
app.use('/api/webhook', require('./routes/webhook'));

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/fruits', require('./routes/fruits'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/payment', require('./routes/payment'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

// Serve frontend build
const frontendBuild = path.join(__dirname, '../../frontend/build');
app.use(express.static(frontendBuild));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuild, 'index.html'));
});

module.exports = app;
