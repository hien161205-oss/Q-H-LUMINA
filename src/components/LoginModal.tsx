import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, User, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen } = useCart();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && password !== confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp!');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Chào mừng trở lại!');
        setIsLoginModalOpen(false);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const role = user.email === 'nghyn5851@gmail.com' ? 'admin' : 'user';
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          name: name,
          role: role,
          createdAt: serverTimestamp()
        });
        
        toast.success('Tạo tài khoản thành công!');
        setIsLoginModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLoginModalOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-brand-50 overflow-hidden"
          >
            <button 
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-brand-50 text-gray-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-4 mb-10">
              <h2 className="text-3xl font-serif text-gray-900">{isLogin ? 'Chào mừng trở lại' : 'Tham gia Q&H LUMINA'}</h2>
              <p className="text-sm text-gray-500 italic">Trải nghiệm tinh hoa của vẻ đẹp hữu cơ.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Họ và tên</label>
                  <div className="flex items-center bg-brand-50 rounded-2xl px-6 py-4">
                    <User className="w-5 h-5 text-brand-300 mr-4" />
                    <input 
                      type="text" 
                      required 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-full"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Địa chỉ Email</label>
                <div className="flex items-center bg-brand-50 rounded-2xl px-6 py-4">
                  <Mail className="w-5 h-5 text-brand-300 mr-4" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-full"
                    placeholder="email@vidu.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Mật khẩu</label>
                <div className="flex items-center bg-brand-50 rounded-2xl px-6 py-4">
                  <Lock className="w-5 h-5 text-brand-300 mr-4" />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-full"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Nhập lại mật khẩu</label>
                  <div className="flex items-center bg-brand-50 rounded-2xl px-6 py-4">
                    <Lock className="w-5 h-5 text-brand-300 mr-4" />
                    <input 
                      type="password" 
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-full"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-500 text-white rounded-2xl py-5 font-bold uppercase tracking-[0.2em] text-xs shadow-lg shadow-brand-200 hover:bg-brand-600 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
              </button>
            </form>

            <div className="mt-10 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-gray-500 hover:text-brand-600 transition-colors inline-flex items-center space-x-2"
              >
                <span>{isLogin ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
