export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
  stock: number;
  onFlashSale?: boolean;
  flashSaleDiscount?: number;
  salesCount?: number;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  weight?: string;
  texture?: string;
  origin?: string;
  features?: string[];
  gallery?: string[];
  createdAt?: any;
}

export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author?: string;
  createdAt?: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
  displayName?: string;
  phoneNumber?: string;
  address?: string;
  createdAt?: any;
  lastActive?: any;
}

export interface Order {
  id: string;
  userId: string | null;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    reviewed?: boolean;
  }[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipping' | 'completed';
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  };
  createdAt: any; // Firestore Timestamp
}
