import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';
import { ArrowLeft, Trash2, Heart, CreditCard, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

export default function Wishlist() {
  const { wishlist, toggleWishlist, buyNow, addToCart, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-[60vh]">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-400 hover:text-brand-500 transition-colors mb-12 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs uppercase font-bold tracking-widest">Tiếp tục mua sắm</span>
      </button>

      <div className="mb-16">
        <h1 className="text-5xl font-serif text-gray-900 mb-4 flex items-center">
            Yêu thích <Heart className="ml-4 w-10 h-10 text-brand-500 fill-brand-500" />
        </h1>
        <div className="w-20 h-1 bg-brand-500 rounded-full"></div>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-24 bg-brand-50 rounded-[3rem] border border-brand-100 italic font-serif text-gray-400 text-xl">
          Danh sách yêu thích của bạn đang trống.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {wishlist.map((p) => (
            <motion.div 
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group cursor-pointer bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col"
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-50 mb-6 group-hover:shadow-lg transition-all duration-500 border border-brand-50/50">
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(p);
                        }}
                        className="bg-white text-brand-500 p-2.5 rounded-xl shadow-lg hover:bg-brand-500 hover:text-white transition-all transform hover:scale-110"
                        title="Xóa khỏi yêu thích"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p);
                            setIsCartOpen(true);
                        }}
                        className="bg-brand-500 text-white p-2.5 rounded-xl shadow-lg hover:bg-brand-600 transition-all transform hover:scale-110"
                        title="Thêm vào giỏ"
                    >
                        <ShoppingBag className="w-4 h-4" />
                    </button>
                </div>
              </div>
              <div className="space-y-2 flex-grow flex flex-col">
                <h3 className="text-sm font-bold text-gray-800 group-hover:text-brand-500 transition-colors uppercase tracking-tight line-clamp-2 leading-snug flex-grow">{p.name}</h3>
                <p className="text-lg font-black text-gray-900 mt-2">{formatPrice(p.price)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
