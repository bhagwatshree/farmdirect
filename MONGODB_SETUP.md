# MongoDB Integration Guide

Your application has been successfully configured to use **MongoDB** as the database instead of in-memory storage.

## Setup Instructions

### 1. Install MongoDB

**Option A: Local MongoDB Installation (Windows)**
```powershell
# Download and install from: https://www.mongodb.com/try/download/community
# Run the installer and follow the prompts
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/farmdirect`)

### 2. Update .env File

If using **local MongoDB**:
```
MONGO_URI=mongodb+srv://bhagwatshree:<db_password>@cluster0.0vq35.mongodb.net/?appName=Cluster0
JWT_SECRET=farmdirect_secret_key
NODE_ENV=development
PORT=5000
```

If using **MongoDB Atlas**:
```
MONGO_URI=mongodb+srv://bhagwatshree:<db_password>@cluster0.0vq35.mongodb.net/?appName=Cluster0

JWT_SECRET=farmdirect_secret_key
NODE_ENV=development
PORT=5000
```

### 3. Install Dependencies

```bash
cd backend
npm install mongoose
```

### 4. Start MongoDB (if using local)

**Windows PowerShell:**
```powershell
# If installed as a service, it should start automatically
# Or run mongod manually:
mongod
```

### 5. Restart Backend Server

```bash
npm run dev
```

The backend will now connect to MongoDB and create collections automatically.

## Database Models

The application uses the following collections:

1. **Users** - User authentication and profiles
2. **Fruits** - Fruit listings from farmers
3. **Orders** - Customer orders
4. **Vouchers** - Discount codes

## Features

- ✅ Data persists across server restarts
- ✅ Multiple user support
- ✅ Scalable architecture
- ✅ MongoDB Atlas ready (cloud-hosted)
- ✅ Local development support

## Troubleshooting

**Error: "connect ECONNREFUSED"**
- MongoDB is not running
- For local: Start `mongod`
- For Atlas: Check internet connection and connection string

**Error: "Unauthorized: authentication failed"**
- Wrong credentials in MongoDB Atlas
- Check username/password in MONGO_URI

**Error: "MongoError: Invalid URL"**
- Invalid MONGO_URI format
- Check the connection string syntax

## Next Steps

1. Start the application
2. Register a new user
3. Add fruit listings
4. Place orders
5. All data is now persisted in MongoDB!
