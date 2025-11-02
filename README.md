# ⭐ ShopStar

A full-stack e-commerce platform with payment processing, inventory management, and admin dashboard.

## 🚀 Features

### Customer Features
- ✅ User Registration & Authentication (JWT)
- ✅ Product Browsing & Search
- ✅ Shopping Cart Management
- ✅ Secure Checkout (Stripe)
- ✅ Order History
- ✅ Order Tracking

### Admin Features
- ✅ Product Management (CRUD)
- ✅ Category Management
- ✅ Order Management
- ✅ Inventory Tracking
- ✅ Low Stock Alerts
- ✅ Sales Analytics

### Technical Features
- ✅ RESTful API
- ✅ MongoDB Database
- ✅ Stripe Payment Processing
- ✅ Email Notifications (Resend)
- ✅ Request Logging
- ✅ Comprehensive Testing
- ✅ JWT Authentication
- ✅ Role-Based Access Control

## 📁 Project Structure

```
ecommerce-platform/
├── backend/
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/      # Auth, validation
│   │   ├── services/        # Email, payments
│   │   ├── controllers/     # Business logic
│   │   └── tests/          # Test files
│   ├── server.js
│   └── package.json
└── frontend/               # Next.js frontend application
```

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Stripe (Payments)
- Resend (Email)
- JWT (Authentication)
- Jest (Testing)

**Frontend:**
- Next.js 16
- TypeScript
- Tailwind CSS
- Stripe Elements

## 📦 Installation

### Backend Setup

1. **Navigate to backend:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file:**
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

RESEND_API_KEY=re_your_key
```

4. **Start server:**
```bash
npm run dev
```

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env.local` file:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

4. **Start development server:**
```bash
npm run dev
```

## 🧪 Testing

Run tests:
```bash
cd backend
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

Watch mode:
```bash
npm run test:watch
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get profile

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create (admin)
- `PUT /api/products/:id` - Update (admin)
- `DELETE /api/products/:id` - Delete (admin)

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add item
- `PUT /api/cart/:itemId` - Update quantity
- `DELETE /api/cart/:itemId` - Remove item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get my orders
- `GET /api/orders/:id` - Get order
- `POST /api/orders/:id/confirm-payment` - Confirm payment
- `PUT /api/orders/:id/status` - Update status (admin)

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get category
- `POST /api/categories` - Create (admin)
- `PUT /api/categories/:id` - Update (admin)
- `DELETE /api/categories/:id` - Delete (admin)

## 🔐 Security

- JWT token authentication
- Password hashing (bcrypt)
- Role-based access control
- Input validation
- CORS protection
- Environment variables for secrets

## 📧 Email Notifications

Automatically sends:
- Order confirmation emails
- Order status updates (shipped, delivered)
- Payment confirmations

## 💳 Payment Processing

Integrated with Stripe:
- Secure payment processing
- Webhook support for automatic confirmations
- Test mode ready (use test cards)

## 🧪 Testing Coverage

- Unit tests for routes
- Integration tests for API endpoints
- Authentication tests
- Cart functionality tests
- Product management tests

## 🚀 Deployment

### Backend (Render/Railway)
1. Push to GitHub
2. Connect to Render/Railway
3. Set environment variables
4. Deploy!

### Frontend (Vercel)
1. Connect GitHub repo
2. Set environment variables
3. Deploy!

See `QUICK_DEPLOY.md` for detailed deployment instructions.

## 📝 Environment Variables

See `env.example` files for all required variables.

## 🎯 Project Status

- ✅ Backend API complete
- ✅ Frontend application complete
- ✅ Testing implemented
- ✅ Ready for deployment

## 📄 License

ISC

---

Built with ❤️ for learning and portfolio
