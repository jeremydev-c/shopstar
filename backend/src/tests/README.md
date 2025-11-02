# Test Suite Documentation

## ⚠️ Prerequisites

**MongoDB must be running before running tests!**

### Quick Setup Options:

**Option 1: MongoDB Atlas (Free Cloud - Recommended)**
1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Create free cluster (M0)
3. Get connection string from "Connect" button
4. Add to `.env`: `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommerce-test`

**Option 2: Local MongoDB**
- Windows: Install from https://www.mongodb.com/try/download/community
- macOS: `brew install mongodb-community && brew services start mongodb-community`
- Linux: `sudo apt-get install mongodb && sudo systemctl start mongod`

See `MONGODB_SETUP.md` in backend folder for detailed instructions.

---

## Overview

This test suite provides comprehensive coverage for the ShopStar e-commerce platform backend API.

## Test Files

### 1. `auth.test.js`
Tests authentication routes:
- User registration (validation, duplicate emails, password strength)
- User login (correct/incorrect credentials)
- Protected routes (token validation)

### 2. `products.test.js`
Tests product management:
- Get all products (public)
- Get single product
- Create product (admin only)
- Update product (admin only)
- Delete product (admin only)
- Search and filtering

### 3. `cart.test.js`
Tests shopping cart functionality:
- Get cart
- Add items to cart
- Update item quantities
- Remove items from cart
- Clear entire cart
- Total calculation

### 4. `orders.test.js`
Tests order management:
- Create order from cart
- Get user orders
- Get single order
- Update order status (admin)
- Cancel order
- Order authorization (users can only see their orders)

### 5. `users.test.js`
Tests user management (admin):
- Get all users (admin only)
- Search users by name/email
- Update user roles
- Prevent removing last admin

### 6. `categories.test.js`
Tests category management:
- Get all categories (public)
- Get single category
- Create category (admin only)
- Update category (admin only)
- Delete category (admin only)

### 7. `integration.test.js`
End-to-end integration tests:
- Complete user journey (browse → cart → checkout → order)
- Admin product and order management
- Inventory management

## Running Tests

### Run all tests
```bash
npm test
```

### Run with coverage
```bash
npm run test:coverage
```

### Run in watch mode
```bash
npm run test:watch
```

### Run specific test file
```bash
npm test -- auth.test.js
```

### Run with verbose output
```bash
npm run test:verbose
```

### Run all tests with coverage and verbose
```bash
npm run test:all
```

## Test Setup

Tests use a separate test database (`ecommerce-test`) to avoid affecting development data.

### Before Each Test
- Database is cleared
- Fresh test data is created

### After All Tests
- Test database is dropped
- Database connection is closed

## Test Coverage Goals

- **Current Coverage**: ~70%+
- **Target Coverage**: 80%+

### Coverage Areas
- ✅ Authentication routes (100%)
- ✅ Product routes (90%+)
- ✅ Cart routes (90%+)
- ✅ Order routes (85%+)
- ✅ User management routes (85%+)
- ✅ Category routes (90%+)
- ✅ Integration flows (80%+)

## Writing New Tests

### Test Structure
```javascript
describe('Route Name', () => {
  let token;
  let userId;

  beforeEach(async () => {
    // Setup test data
  });

  describe('GET /api/route', () => {
    it('should do something', async () => {
      const response = await request(app)
        .get('/api/route')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
```

### Best Practices
1. **Use descriptive test names**: "should do something specific"
2. **Test both success and error cases**
3. **Test authorization**: Verify admin-only routes reject non-admins
4. **Test validation**: Test invalid inputs
5. **Clean up**: Use beforeEach/afterEach for setup/teardown

## Mocking External Services

Currently, tests don't mock external services (Stripe, Resend). For production-ready tests, you should:

1. Mock Stripe API calls
2. Mock Resend email service
3. Use environment variables for test configurations

## Continuous Integration

To add CI/CD:

1. Create `.github/workflows/test.yml`
2. Run tests on every push/PR
3. Generate coverage reports
4. Fail build if coverage drops below threshold

Example GitHub Actions workflow:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Troubleshooting

### Tests fail with "Port already in use"
- Make sure test server is not running
- Check for zombie processes

### Database connection errors
- Ensure MongoDB is running
- Check MONGODB_URI in test environment

### Timeout errors
- Increase timeout in jest.config.js
- Check for async operations not completing

