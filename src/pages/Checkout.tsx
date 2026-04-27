import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, serverTimestamp, doc, writeBatch, increment, getDoc, query, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useCart } from '../context/CartContext';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';
import { CreditCard, Truck, ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react';
import { Product } from '../types';

export default function Checkout() {
  const { cart, totalAmount, clearCart, setIsLoginModalOpen } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<'cod' | 'bank_transfer' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  });
  const navigate = useNavigate();
  const [giftProduct, setGiftProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchGift = async () => {
      if (totalAmount >= 1000000) {
        try {
          const q = query(collection(db, 'products'), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setGiftProduct({ id: snap.docs[0].id, ...snap.docs[0].data() } as Product);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchGift();
  }, [totalAmount]);

  useEffect(() => {
    if (cart.length === 0 && !orderSuccess) {
      navigate('/');
    }
  }, [cart.length, navigate, orderSuccess]);

  if (!auth.currentUser) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-blue-50">
          <ShieldCheck className="w-12 h-12 text-blue-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-serif">Bạn cần đăng nhập</h1>
          <p className="text-gray-500 italic">Vui lòng đăng nhập để tiếp tục thanh toán và nhận các ưu đãi hấp dẫn.</p>
        </div>
        <div className="flex flex-col space-y-4">
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
          >
            Đăng nhập ngay
          </button>
          <button onClick={() => navigate('/')} className="text-blue-500 font-bold uppercase text-xs tracking-[0.2em]">Quay lại trang chủ</button>
        </div>
      </div>
    );
  }

  const finalTotal = totalAmount;

  // Bank Info
  const accountNumber = '0393040003';
  const accountName = 'NGUYEN THI THANH HIEN';
  const qrMemoBase = `QH ${formData.phone || 'DH'}`;
  
  const [orderInfo, setOrderInfo] = useState<{ total: number, memo: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('Vui lòng điền đủ thông tin giao hàng');
      return;
    }
    setLoading(true);
    try {
      // Kiểm tra tồn kho trước khi thanh toán
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const currentStock = productSnap.data().stock || 0;
          if (currentStock < item.quantity) {
            toast.error(`Sản phẩm "${item.name}" chỉ còn ${currentStock} món trong kho.`);
            setLoading(false);
            return;
          }
        }
      }

      const batch = writeBatch(db);
      let items = cart.map(i => ({ 
        id: i.id, 
        name: i.name, 
        quantity: i.quantity, 
        price: i.onFlashSale ? i.price * (1 - (i.flashSaleDiscount || 25) / 100) : i.price 
      }));

      // Tự động thêm quà tặng dựa trên tổng tiền
      if (totalAmount >= 5000000) {
        items.push({
          id: 'GIFT-VIP',
          name: `QUÀ TẶNG VIP: ${giftProduct?.name || 'Combo cao cấp'}`,
          quantity: 1,
          price: 0
        });
      } else if (totalAmount >= 1000000) {
        items.push({
          id: 'GIFT-BASIC',
          name: `QUÀ TẶNG: ${giftProduct?.name || 'Mẫu thử Premium'}`,
          quantity: 1,
          price: 0
        });
      }
      
      const currentFinalTotal = finalTotal;
      const currentMemo = qrMemoBase;

      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, {
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
        items,
        total: currentFinalTotal,
        paymentMethod,
        customerInfo: formData,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // LƯU Ý: Việc trừ tồn kho nên thực hiện qua Cloud Functions để bảo mật.
      // Nếu Rules Firebase của bạn chặn User sửa collection 'products', 
      // đoạn code dưới đây sẽ gây lỗi "Missing Permissions".
      // cart.forEach(item => {
      //   const productRef = doc(db, 'products', item.id);
      //   batch.update(productRef, { stock: increment(-item.quantity) });
      // });
      
      await batch.commit();
      setOrderInfo({ total: currentFinalTotal, memo: currentMemo });
      setOrderSuccess(paymentMethod);
      clearCart();
    } catch (err) {
      toast.error('Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess && orderInfo) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 bg-white min-h-[80vh] flex flex-col items-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-serif text-gray-900">
            {orderSuccess === 'bank_transfer' ? 'Chờ thanh toán chuyển khoản' : 'Đặt hàng thành công!'}
          </h1>
          <p className="text-gray-500 max-w-md mx-auto italic">
            {orderSuccess === 'bank_transfer' 
              ? 'Đơn hàng của bạn đã được ghi nhận. Hệ thống sẽ xác nhận ngay khi bạn hoàn tất chuyển khoản theo mã QR bên dưới.' 
              : 'Đơn hàng của bạn đã được tiếp nhận. Chúng tôi sẽ sớm liên hệ xác nhận qua điện thoại.'}
          </p>

          {orderSuccess === 'bank_transfer' && (
            <div className="bg-[#f8fafc] border-2 border-dashed border-blue-200 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-12 text-left shadow-xl shadow-blue-50/50 max-w-3xl mx-auto">
              <div className="bg-white p-6 rounded-[2rem] shadow-lg shrink-0 border border-blue-50">
                <img 
                  src={`https://img.vietqr.io/image/MB-${accountNumber}-compact.png?amount=${orderInfo.total}&addInfo=${encodeURIComponent(orderInfo.memo)}&accountName=${encodeURIComponent(accountName)}`}
                  alt="VietQR" 
                  className="w-48 h-48" 
                />
              </div>
              <div className="space-y-4 flex-grow font-medium text-sm text-gray-700">
                <div className="flex justify-between border-b border-gray-100 pb-2"><span>Ngân hàng:</span> <span className="font-bold">MB BANK</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-2"><span>Số tài khoản:</span> <span className="font-black text-blue-600 tracking-widest">0393040003</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-2"><span>Chủ tài khoản:</span> <span className="font-bold uppercase">{accountName}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-2"><span>Số tiền:</span> <span className="font-black text-red-500 text-xl">{formatPrice(orderInfo.total)}</span></div>
                <div className="flex justify-between bg-blue-100/30 p-4 rounded-2xl"><span>Nội dung:</span> <span className="font-black text-blue-600">{orderInfo.memo}</span></div>
              </div>
            </div>
          )}

          <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">Quay lại trang chủ</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-12">
            <h1 className="text-5xl font-serif text-gray-900 leading-tight">Thanh toán</h1>
            <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-blue-50/50 border border-gray-50 space-y-10">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-blue-500 ml-4 tracking-widest">Người nhận</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-blue-100 border-none shadow-sm" placeholder="Họ và tên..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-blue-500 ml-4 tracking-widest">Số điện thoại</label>
                    <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-blue-100 border-none shadow-sm" placeholder="Số điện thoại..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-blue-500 ml-4 tracking-widest">Địa chỉ giao hàng</label>
                  <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={3} className="w-full bg-slate-50 rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-blue-100 border-none shadow-sm resize-none" placeholder="Địa chỉ chi tiết..." />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-blue-500 ml-4 tracking-widest">Hình thức thanh toán</label>
                  <div className="relative">
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'bank_transfer')}
                      className="w-full appearance-none bg-slate-50 rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-blue-100 text-sm font-bold text-gray-700 cursor-pointer shadow-sm border-none"
                    >
                      <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                      <option value="bank_transfer">Chuyển khoản ngân hàng (VietQR)</option>
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] py-8 font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-blue-100 transition-all active:scale-95">
                {loading ? 'Đang xử lý...' : `XÁC NHẬN ĐẶT HÀNG • ${formatPrice(finalTotal)}`}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-blue-50/50 space-y-10 sticky top-32">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] border-b border-gray-50 pb-6">Đơn hàng của bạn</h2>
              <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-gray-400">{item.quantity} × {formatPrice(item.onFlashSale ? item.price * (1 - (item.flashSaleDiscount || 25) / 100) : item.price)}</p>
                    </div>
                    <span className="text-sm font-black">{formatPrice((item.onFlashSale ? item.price * (1 - (item.flashSaleDiscount || 25) / 100) : item.price) * item.quantity)}</span>
                  </div>
                ))}
                
                {/* Hiển thị quà tặng trong danh sách items */}
                {totalAmount >= 5000000 ? (
                  <div className="flex gap-4 p-4 bg-red-50/50 rounded-2xl border border-red-100 items-center">
                    <div className="w-12 h-12 rounded-lg bg-white p-1 shrink-0 shadow-sm">
                      <img src={giftProduct?.imageUrl || "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=100"} className="w-full h-full object-cover rounded-md" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-xs font-bold text-red-600 uppercase">QUÀ TẶNG VIP</p>
                      <p className="text-[10px] text-gray-500 italic">{giftProduct?.name || 'Combo dưỡng da cao cấp'}</p>
                    </div>
                    <span className="text-xs font-black text-red-600 uppercase">Miễn phí</span>
                  </div>
                ) : totalAmount >= 1000000 ? (
                  <div className="flex gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100 items-center">
                    <div className="w-12 h-12 rounded-lg bg-white p-1 shrink-0 shadow-sm">
                      <img src={giftProduct?.imageUrl || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=100"} className="w-full h-full object-cover rounded-md" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-xs font-bold text-brand-600 uppercase">QUÀ TẶNG</p>
                      <p className="text-[10px] text-gray-400 italic">{giftProduct?.name || 'Mẫu thử Premium'}</p>
                    </div>
                    <span className="text-xs font-black text-brand-600 uppercase">Miễn phí</span>
                  </div>
                ) : null}
              </div>
              <div className="space-y-6 pt-10 border-t border-gray-50">
                <div className="space-y-3 font-medium text-sm text-gray-500">
                  <div className="flex justify-between"><span>Tạm tính</span><span className="text-gray-900 font-bold">{formatPrice(totalAmount)}</span></div>
                  <div className="flex justify-between"><span>Vận chuyển</span><span className="text-blue-500 font-black tracking-widest uppercase text-[10px]">Miễn phí</span></div>
                </div>
                <div className="flex justify-between pt-6 border-t border-gray-50">
                  <span className="text-[11px] font-black uppercase tracking-widest">Tổng cộng</span>
                  <span className="text-3xl font-black text-gray-900 tracking-tighter">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
