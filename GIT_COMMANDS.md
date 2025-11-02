# Git Commands for ShopStar

## You're currently in the frontend folder. Let's set up git at the root level:

### Step 1: Go to root directory
```bash
cd ..
```

This takes you from `ecommerce-platform/frontend` to `ecommerce-platform`

### Step 2: Check if git exists at root
```bash
git status
```

### Step 3: If git doesn't exist at root, initialize it
```bash
git init
```

### Step 4: Add all files
```bash
git add .
```

### Step 5: Commit
```bash
git commit -m "ShopStar: Full-stack e-commerce platform ready for deployment"
```

### Step 6: Add GitHub remote (after creating repo on GitHub)
```bash
git remote add origin https://github.com/YOUR_USERNAME/shopstar.git
git branch -M main
git push -u origin main
```

---

**Quick copy-paste sequence:**
```bash
cd ..
git status
git add .
git commit -m "ShopStar: Full-stack e-commerce platform ready for deployment"
```

