import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { toast } from 'react-hot-toast';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, silent?: boolean) => void;
  buyNow: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalAmount: number;
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (product: Product, silent?: boolean) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
      if (!silent) {
        toast.success(`Đã cập nhật số lượng ${product.name}`);
      }
    } else {
      setCart((prev) => [...prev, { ...product, quantity: 1 }]);
      if (!silent) {
        toast.success(`Đã thêm ${product.name}`);
      }
    }
  };

  const buyNow = (product: Product, quantity: number = 1) => {
    setCart([{ ...product, quantity }]);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    toast.error('Đã xóa khỏi giỏ hàng');
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (product: Product) => {
    const isFav = wishlist.some(p => p.id === product.id);
    if (isFav) {
      setWishlist((prev) => prev.filter(p => p.id !== product.id));
      toast.error('Đã xóa khỏi danh sách yêu thích');
    } else {
      setWishlist((prev) => [...prev, product]);
      toast.success('Đã thêm vào danh sách yêu thích');
    }
  };

  const isInWishlist = (productId: string) => wishlist.some(p => p.id === productId);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cart.reduce((acc, item) => {
    const price = item.onFlashSale ? item.price * (1 - (item.flashSaleDiscount || 25) / 100) : item.price;
    return acc + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, buyNow, removeFromCart, updateQuantity, clearCart, cartCount, totalAmount,
      wishlist, toggleWishlist, isInWishlist,
      isCartOpen, setIsCartOpen,
      isLoginModalOpen, setIsLoginModalOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};
