// Type definitions for our e-commerce platform

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  addresses?: Address[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface ProductVariant {
  name: string; // e.g., "Size", "Color"
  options: string[]; // e.g., ["Small", "Medium", "Large"]
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  category: Category;
  images: string[];
  variants?: ProductVariant[];
  inventory: {
    quantity: number;
    lowStockThreshold: number;
    trackQuantity: boolean;
  };
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  tags: string[];
  inStock?: boolean;
  isLowStock?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string;
}

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  variant?: {
    [key: string]: string;
  };
  addedAt: Date;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  total: number;
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  variant?: object;
  image: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: User;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentIntentId: string;
  shippingAddress: Address;
  trackingNumber?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

