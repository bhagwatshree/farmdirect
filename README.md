# React + Node.js Application

A full-stack application with React frontend and Node.js/Express backend.

## Project Structure

```
├── backend/          # Node.js/Express server
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── controllers/  # Business logic
│   │   ├── models/   # Database models
│   │   ├── middleware/   # Custom middleware
│   │   ├── utils/    # Utility functions
│   │   └── index.js  # Server entry point
│   └── package.json
├── frontend/         # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/    # Page components
│   │   ├── styles/   # CSS files
│   │   ├── App.jsx   # Main App component
│   │   └── index.jsx # Entry point
│   ├── public/       # Static assets
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## Running Both Services

You can run both services simultaneously in separate terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

## API Communication

The frontend is configured to proxy API requests to the backend through the `proxy` setting in `package.json`. You can make requests like:

```javascript
fetch('/api/health')
```

## Available Scripts

### Backend
- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload (requires nodemon)
- `npm test` - Run tests

### Frontend
- `npm start` - Start the development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from create-react-app (irreversible)

## Technologies

- **Frontend:** React 18, JavaScript/JSX, CSS
- **Backend:** Node.js, Express.js
- **Utilities:** CORS, dotenv

## License

ISC
