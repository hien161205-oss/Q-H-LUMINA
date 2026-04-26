import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Order, UserProfile, Review } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Package, User as UserIcon, Calendar, MapPin, Phone, Mail, ChevronRight, Edit2, Save, X, Star } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCart } from '../context/CartContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  // Review fields
  const [reviewingItem, setReviewingItem] = useState<{orderId: string, itemIdx: number, productId: string} | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { setIsLoginModalOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            setUser(userData);
            setDisplayName(userData.displayName || '');
            setPhoneNumber(userData.phoneNumber || '');
            setAddress(userData.address || '');
          } else {
            // Create initial profile if doesn't exist
            const initialProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'user',
              createdAt: new Date()
            };
            setUser(initialProfile);
          }

          // Fetch orders
          const ordersRef = collection(db, 'orders');
          const q = query(
            ordersRef, 
            where('userId', '==', firebaseUser.uid),
            orderBy('createdAt', 'desc')
          );
          const snap = await getDocs(q);
          const ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
          setOrders(ordersData);
        } catch (err) {
          console.error("Error fetching profile/orders:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setIsLoginModalOpen(true);
        navigate('/');
      }
    });
    return unsubscribe;
  }, [navigate]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updatedProfile = {
        ...user,
        displayName,
        phoneNumber,
        address,
        lastActive: new Date()
      };
      await setDoc(userDocRef, updatedProfile, { merge: true });
      setUser(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewingItem) return;
    setSubmittingReview(true);
    const { orderId, itemIdx, productId } = reviewingItem;
    const reviewPath = 'reviews';
    const orderPath = `orders/${orderId}`;

    try {
      // 1. Add review to reviews collection
      const reviewData: Omit<Review, 'id'> = {
        productId,
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        userEmail: user.email,
        rating,
        comment,
        createdAt: serverTimestamp()
      };
      
      try {
        await addDoc(collection(db, reviewPath), reviewData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, reviewPath);
      }

      // 2. Update order item to mark as reviewed
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data() as Order;
        const updatedItems = [...orderData.items];
        updatedItems[itemIdx] = { ...updatedItems[itemIdx], reviewed: true };
        
        try {
          await updateDoc(orderRef, { items: updatedItems });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, orderPath);
        }
        
        // Update local state
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: updatedItems } : o));
      }

      setReviewingItem(null);
      setRating(5);
      setComment('');
      toast.success('Đánh giá của bạn đã được gửi thành công!');
    } catch (err) {
      console.error("Error submitting review:", err);
      // The error is already handled and thrown as JSON by handleFirestoreError
      // But we should show a user-friendly toast if it's not our special JSON error
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (!errorMsg.startsWith('{')) {
        toast.error("Không thể gửi đánh giá. Vui lòng thử lại sau.");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
    </div>
  );

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'text-brand-500 bg-brand-50 border-brand-100';
      case 'shipping': return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'confirmed': return 'text-amber-500 bg-amber-50 border-amber-100';
      default: return 'text-gray-500 bg-gray-50 border-gray-100';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'Đã hoàn thành';
      case 'shipping': return 'Đang giao hàng';
      case 'confirmed': return 'Đã xác nhận';
      default: return 'Chờ xử lý';
    }
  };

    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const membershipLabel = user?.role === 'admin' 
      ? 'Quản trị viên' 
      : (orders.length > 5 || totalSpent > 5000000) 
        ? 'Khách hàng thân thiết' 
        : 'Tài khoản mới';

  return (
    <div className="max-w-7xl mx-auto px-6 py-24 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Sidebar Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-8"
        >
          <div className="p-8 rounded-[3rem] bg-white border border-brand-100 shadow-xl shadow-brand-50/50 relative overflow-hidden">
            <div className="absolute top-6 right-6">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-gray-400 hover:bg-brand-50 hover:text-brand-500 transition-colors"
                title="Chỉnh sửa thông tin"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 border-2 border-brand-100 shadow-inner">
                <UserIcon className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-serif text-gray-900">
                  {user?.displayName || user?.email?.split('@')[0]}
                </h2>
                <p className="text-xs text-brand-500 font-bold uppercase tracking-widest mt-1">
                  {membershipLabel}
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-12 space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 px-1">Tên hiển thị</label>
                      <input 
                        type="text" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Nhập tên của bạn"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-brand-100 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 px-1">Số điện thoại</label>
                      <input 
                        type="text" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Nhập số điện thoại"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-brand-100 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 px-1">Địa chỉ</label>
                      <textarea 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Nhập địa chỉ giao hàng"
                        rows={3}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-brand-100 transition-all resize-none"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="w-full bg-brand-600 text-white py-4 rounded-2xl text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-brand-700 transition-all flex items-center justify-center space-x-2 disabled:bg-brand-200"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        <span>Lưu thay đổi</span>
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-12 space-y-6"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                    </div>
                  </div>
                  
                  {user?.phoneNumber && (
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-gray-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Số điện thoại</p>
                        <p className="text-sm font-medium text-gray-700">{user.phoneNumber}</p>
                      </div>
                    </div>
                  )}

                  {user?.address && (
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-gray-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Địa chỉ</p>
                        <p className="text-sm font-medium text-gray-700 leading-snug">{user.address}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-gray-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Ngày gia nhập</p>
                      <p className="text-sm font-medium text-gray-700">
                        {user?.createdAt?.toDate?.() ? new Date(user.createdAt.toDate()).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : 'Tháng 4, 2026'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>

        {/* Order History */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-serif text-gray-900">Lịch sử đơn hàng</h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{orders.length} đơn hàng</span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-brand-200">
              <Package className="w-16 h-16 text-brand-100 mx-auto mb-6" />
              <p className="text-gray-400 italic font-serif text-lg">Bạn chưa có đơn hàng nào.</p>
              <Link to="/" className="mt-8 inline-block text-brand-500 font-bold uppercase tracking-widest text-[10px] hover:underline underline-offset-8">
                Khám phá sản phẩm ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-[2.5rem] border border-brand-50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-8 border-b border-brand-50 bg-slate-50/50 flex flex-wrap justify-between items-center gap-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-brand-100 flex items-center justify-center text-brand-500">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Mã đơn: #{order.id.slice(-6).toUpperCase()}</h4>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {new Date(order.createdAt?.toDate?.() || order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                      getStatusColor(order.status)
                    )}>
                      {getStatusText(order.status)}
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="space-y-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center space-x-3">
                            <span className="text-gray-400 font-serif italic text-xs">{item.quantity}x</span>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700">{item.name}</span>
                              {order.status === 'completed' && !item.reviewed && (
                                <button 
                                  onClick={() => setReviewingItem({ orderId: order.id, itemIdx: idx, productId: item.id })}
                                  className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-1 hover:underline text-left"
                                >
                                  Viết đánh giá
                                </button>
                              )}
                              {item.reviewed && (
                                <span className="text-[10px] text-brand-500 font-bold uppercase tracking-widest mt-1">
                                  Đã đánh giá
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-gray-500">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-brand-50 flex justify-between items-center">
                      <div className="flex flex-col space-y-1">
                         <div className="flex items-center text-gray-400 space-x-2">
                           <MapPin className="w-3 h-3" />
                           <span className="text-[10px] font-medium uppercase tracking-tight">{order.customerInfo.address.split(',')[0]}...</span>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Tổng cộng</p>
                        <p className="text-xl font-serif text-brand-600">{formatPrice(order.total)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setReviewingItem(null)}
                className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-serif text-gray-900 mb-2">Đánh giá sản phẩm</h2>
              <p className="text-sm text-gray-500 mb-8">Chia sẻ trải nghiệm của bạn về sản phẩm này</p>

              <div className="space-y-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={cn(
                          "transition-all transform hover:scale-110",
                          star <= rating ? "text-amber-400" : "text-gray-200"
                        )}
                      >
                        <Star className="w-8 h-8 fill-current" />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-500">
                    {rating === 5 ? 'Tuyệt vời' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Tệ' : 'Rất tệ'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400 px-1">Nhận xét của bạn</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Sản phẩm dùng rất thích, đóng gói cẩn thận..."
                    rows={4}
                    className="w-full px-6 py-4 rounded-3xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-brand-100 transition-all resize-none"
                  />
                </div>

                <button 
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !comment.trim()}
                  className="w-full bg-brand-600 text-white py-5 rounded-2xl text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-brand-700 transition-all flex items-center justify-center space-x-2 disabled:bg-brand-200"
                >
                  {submittingReview ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Gửi đánh giá</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
