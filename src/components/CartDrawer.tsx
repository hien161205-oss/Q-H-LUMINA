import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, removeFromCart, updateQuantity, totalAmount } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full md:w-[450px] bg-white shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-8 border-b border-brand-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-gray-900">Túi hàng</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{cart.length} sản phẩm</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-gray-400 hover:bg-brand-50 hover:text-brand-500 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-gray-200">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <p className="text-gray-400 italic font-serif">Túi hàng của bạn đang trống</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-[10px] font-black uppercase tracking-widest text-brand-500 hover:underline underline-offset-8"
                  >
                    Tiếp tục khám phá
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-24 h-32 rounded-2xl overflow-hidden bg-brand-50 border border-brand-50 shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow space-y-2">
                       <div className="flex justify-between items-start">
                         <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight uppercase tracking-tight">{item.name}</h4>
                       </div>
                       <p className="text-lg font-black text-gray-900">{formatPrice(item.price)}</p>
                       
                       <div className="flex items-center justify-between pt-2">
                         <div className="flex items-center border border-gray-100 rounded-xl overflow-hidden bg-white">
                           <button 
                             onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                             className="p-2 hover:bg-slate-50 text-gray-400 transition-colors"
                           >
                             <Minus className="w-3 h-3" />
                           </button>
                           <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                           <button 
                             onClick={() => updateQuantity(item.id, item.quantity + 1)}
                             className="p-2 hover:bg-slate-50 text-gray-400 transition-colors"
                           >
                             <Plus className="w-3 h-3" />
                           </button>
                         </div>
                         <button 
                           onClick={() => removeFromCart(item.id)}
                           className="text-red-200 hover:text-red-500 transition-colors"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 bg-white border-t border-brand-50 space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng cộng tạm tính</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tighter">{formatPrice(totalAmount)}</p>
                  </div>
                  <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-brand-200">Miễn phí vận chuyển</p>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] py-6 font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-100 transition-all flex items-center justify-center space-x-3 group"
                >
                  <span>Thanh toán ngay</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
