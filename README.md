# FarmDirect 🌾

A full-stack marketplace connecting local farmers directly to customers — no middlemen, better prices.

## Features

- **Browse & Buy** — Search fresh produce by fruit, farm, or location
- **Farmer Dashboard** — List produce, manage stock, track incoming orders
- **Cart & Checkout** — Address management, voucher/promo codes, transport costs
- **Multi-language** — English, Hindi, Marathi, Tamil, Telugu, Kannada (i18n)
- **Authentication** — JWT login, account locking after 5 failed attempts
- **Forgot Password** — Email reset link via Gmail SMTP
- **AI Chatbot** — Powered by OpenAI GPT-4o-mini; recommends fresh listings and handles account actions (password reset, address update) after OTP identity verification
- **Email Notifications** — Customisable order and status-change email templates

---

## Project Structure

```
farmdirect/
├── backend/
│   ├── src/
│   │   ├── config/         # MongoDB connection
│   │   ├── middleware/     # JWT auth middleware
│   │   ├── models/         # Mongoose models (User, Fruit, Order, Voucher)
│   │   ├── routes/         # API routes (auth, fruits, orders, chat, …)
│   │   └── utils/          # Email (Nodemailer), seed data
│   ├── .env.example        # Environment variable template
│   └── package.json
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/     # Navbar, ChatBot, FruitCard, …
│       ├── context/        # AuthContext, CartContext
│       ├── locales/        # i18n JSON files (en, hi, mr, ta, te, kn)
│       ├── pages/          # All page components
│       └── App.jsx
├── .gitignore
└── README.md
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18 or later |
| MongoDB | v6 or later (local) |
| npm | v9 or later |

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/bhagwatshree/farmdirect.git
cd farmdirect
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
MONGO_URI=mongodb://127.0.0.1:27017/farmdirect
JWT_SECRET=your_long_random_secret
NODE_ENV=development
PORT=5000

# Sender display name + address
EMAIL_FROM=FarmDirect <you@gmail.com>

# Gmail SMTP (use an App Password — not your login password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password

# OpenAI key for the AI chatbot
OPENAI_API_KEY=sk-...
```

> **Gmail App Password:** Google Account → Security → 2-Step Verification → App passwords → generate one for "Mail".

Start the backend:

```bash
npm start
# Server runs on http://localhost:5000
```

### 3. Frontend

```bash
cd ../frontend
npm install
npm start
# Dev server runs on http://localhost:3000
```

The frontend proxies `/api/*` requests to `http://localhost:5000` automatically.

### 4. (Optional) Seed sample data

```bash
cd backend
node src/utils/seed.js
```

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `NODE_ENV` | `development` or `production` |
| `PORT` | Backend port (default `5000`) |
| `EMAIL_FROM` | Sender name and address shown in emails |
| `EMAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (`587` for TLS) |
| `EMAIL_USER` | SMTP login email |
| `EMAIL_PASS` | SMTP password or App Password |
| `OPENAI_API_KEY` | OpenAI API key for the chatbot |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |

### Fruits / Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fruits` | List all available fruits |
| POST | `/api/fruits` | Create listing (farmer) |
| PUT | `/api/fruits/:id` | Update listing (farmer) |
| DELETE | `/api/fruits/:id` | Delete listing (farmer) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place an order |
| GET | `/api/orders` | Get orders (customer or farmer view) |
| PUT | `/api/orders/:id/status` | Update order status (farmer) |

### Chat (AI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send a message to the AI assistant |
| POST | `/api/chat/send-otp` | Request OTP for identity verification |
| POST | `/api/chat/verify-otp` | Verify OTP and receive session token |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET/PUT | `/api/notifications` | Email template management |
| GET/POST | `/api/vouchers` | Voucher/promo code management |

---

## Production Build

```bash
# Build the React frontend
cd frontend
npm run build

# The backend serves the built files automatically
cd ../backend
npm start
# Visit http://localhost:5000
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Material UI v5, React Router v6, i18next |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| AI | OpenAI GPT-4o-mini |
| Testing | Jest, React Testing Library, Supertest |

---

## License

ISC
