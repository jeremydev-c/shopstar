# MongoDB Setup Guide for Tests

## Quick Setup: MongoDB Atlas (Recommended - 5 minutes)

### Step 1: Create Free MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a free cluster (M0 - Free forever)

### Step 2: Get Connection String
1. In Atlas dashboard, click "Connect"
2. Choose "Connect your application"
3. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
4. Replace `<password>` with your database password
5. Add database name: `/ecommerce-test` at the end

### Step 3: Update .env File
Add to your `.env` file:
```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster.mongodb.net/ecommerce-test?retryWrites=true&w=majority
```

### Step 4: Run Tests
```bash
npm test
```

---

## Alternative: Install MongoDB Locally

### Windows
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Run installer (choose "Complete" installation)
3. MongoDB will install as a Windows service automatically
4. Verify it's running: Check Windows Services for "MongoDB Server"

### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## Verify MongoDB is Running

```bash
# Check if MongoDB is accessible
mongosh

# Or check connection
mongosh "mongodb://localhost:27017"
```

If you see a MongoDB prompt, you're ready!

---

## For Tests Only (No Production DB)

Tests use a separate database: `ecommerce-test` so they won't affect your development data.

