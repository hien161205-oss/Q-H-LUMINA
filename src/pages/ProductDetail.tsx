import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, getDocs, limit, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { formatPrice, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Star, ArrowLeft, ShieldCheck, Truck, RotateCcw, Heart, Gift, Info, CheckCircle2, ChevronRight, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [giftItem, setGiftItem] = useState<Product | null>(null);
  const { addToCart, buyNow, toggleWishlist, isInWishlist, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(productData);
          setActiveImage(productData.imageUrl);
          
          // Fetch gift item (cheapest product)
          const productsRef = collection(db, 'products');
          // Sử dụng limit(5) để lấy danh sách rồi chọn sản phẩm khác với sản phẩm hiện tại
          const giftQuery = query(productsRef, limit(5));
          const giftSnap = await getDocs(giftQuery);
          if (!giftSnap.empty) {
            const potentialGifts = giftSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            const selectedGift = potentialGifts.find(p => p.id !== id) || potentialGifts[0];
            setGiftItem(selectedGift);
          }
          
          const reviewsRef = collection(db, 'reviews');
          const q = query(reviewsRef, where('productId', '==', id), orderBy('createdAt', 'desc'), limit(10));
          const reviewSnap = await getDocs(q);
          const reviewsData = reviewSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
          setReviews(reviewsData);
        } else {
          toast.error("Không tìm thấy sản phẩm");
          navigate('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return null;

  const handleBuyNow = () => {
    if (!product) return;
    buyNow(product, quantity);
    navigate('/checkout');
  };

  const reviewStarsCount = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length
  }));
  const totalReviews = reviews.length;
  const sumRating = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = totalReviews > 0 ? sumRating / totalReviews : 5.0;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-400 hover:text-brand-500 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs uppercase font-bold tracking-widest">Quay lại</span>
        </button>

        {/* Top Product Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8 p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Gallery */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-50 border border-brand-100">
                <img 
                  src={activeImage || product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg">
                   <span className="text-[10px] font-black tracking-tighter text-brand-600">PREMIUM COLLECTION</span>
                </div>
              </div>
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                 {[product.imageUrl, ...(product.gallery || [])].map((img, i) => (
                    <div 
                    key={i} 
                    onClick={() => setActiveImage(img)}
                    className={cn(
                        "w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all",
                        activeImage === img ? "border-brand-500 shadow-md" : "border-brand-100 hover:border-brand-300"
                    )}
                   >
                     <img src={img} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                   </div>
                 ))}
              </div>
            </motion.div>

            {/* Main Info */}
            <div className="flex flex-col space-y-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-brand-500 text-sm font-bold uppercase tracking-widest">
                  <span>{product.brand || product.features?.find(f => f.toLowerCase().includes('thương hiệu'))?.split(':')?.[1]?.trim() || 'Thương hiệu ưu tiên'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-snug">{product.name}</h1>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-1 text-amber-400">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("w-4 h-4 fill-current", i >= Math.round(avgRating) && "text-gray-200 fill-none")} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-400">({totalReviews} đánh giá)</span>
                </div>
                <div className="h-4 w-px bg-gray-200"></div>
                <span className="text-sm text-gray-500">Chưa có câu hỏi</span>
                <div className="h-4 w-px bg-gray-200"></div>
                <span className="text-3xl font-black text-gray-900 tracking-tight">Đã bán {product.salesCount || 0}+</span>
              </div>

              <div className="bg-brand-50/50 p-6 rounded-[2rem] flex flex-wrap items-center gap-6 border border-brand-100">
                <p className="text-5xl font-black text-gray-900">
                  {formatPrice(product.onFlashSale ? product.price * (1 - (product.flashSaleDiscount || 25) / 100) : product.price)}
                </p>
                {product.onFlashSale && (
                  <div className="flex flex-col">
                    <p className="text-xl text-gray-400 line-through font-medium">
                      {formatPrice(product.price)}
                    </p>
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md w-fit mt-1">
                      -{product.flashSaleDiscount || 25}%
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-500 w-20">Số lượng:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-gray-50 font-bold"> - </button>
                    <span className="px-6 py-2 font-bold text-lg">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-4 py-2 hover:bg-gray-50 font-bold"> + </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  onClick={handleBuyNow}
                  className="flex-grow bg-blue-500 text-white py-4 px-8 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 active:scale-95"
                >
                  Mua Ngay
                </button>
                <button 
                  onClick={() => {
                    addToCart(product);
                    setIsCartOpen(true);
                  }}
                  className="flex-grow bg-white text-gray-900 border-2 border-gray-100 py-4 px-8 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Thêm vào giỏ
                </button>
                <button 
                    onClick={() => toggleWishlist(product)}
                    className={cn(
                        "p-4 border border-gray-200 rounded-xl transition-all shrink-0",
                        isInWishlist(product.id) ? "bg-red-50 border-red-200 text-red-500" : "hover:bg-gray-50 text-gray-400"
                    )}
                >
                  <Heart className={cn("w-6 h-6", isInWishlist(product.id) && "fill-current")} />
                </button>
              </div>

              {/* Promo Boxes */}
              <div className="space-y-3">
                <div className="border border-brand-100 rounded-xl p-4 bg-white relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-400"></div>
                  <div className="flex items-center space-x-3 mb-2">
                    <Gift className="w-5 h-5 text-brand-500" />
                    <span className="text-xs font-black text-brand-600 uppercase tracking-widest">QUÀ TẶNG KHUYẾN MÃI</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded bg-brand-50 flex-shrink-0 overflow-hidden border border-brand-100">
                       <img src={giftItem?.imageUrl || "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200"} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-gray-600 leading-tight italic">Ưu đãi đặc biệt: Tặng kèm {giftItem?.name || 'mẫu thử cao cấp'} cho mỗi đơn hàng từ 1tr.</p>
                  </div>
                </div>

                <div className="border border-red-100 rounded-xl p-4 bg-red-50/10 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                  <div className="flex items-center space-x-3 mb-2">
                    <ShieldCheck className="w-5 h-5 text-red-500" />
                    <span className="text-xs font-black text-red-600 uppercase tracking-widest">QUÀ TẶNG CHO ĐƠN TỪ 5 TRIỆU</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded bg-red-50 flex-shrink-0">
                       <img src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=200" className="w-full h-full object-cover opacity-50" />
                    </div>
                    <p className="text-xs text-gray-600 leading-tight">Cơ hội nhận thêm quà tặng cao cấp cho đơn hàng từ 5,000,000đ.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Specs Section */}
        <section className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12 mb-8">
           <div className="inline-block border-b-2 border-brand-500 pb-2 mb-8">
             <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Chi tiết sản phẩm</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-12">
              <div className="space-y-4">
                 {[
                   { label: 'Tên sản phẩm', value: product.name },
                   { label: 'Trọng lượng', value: product.weight || product.features?.find(f => f.toLowerCase().includes('trọng lượng'))?.split(':')?.[1]?.trim() || '4g' },
                   { label: 'Thương hiệu', value: product.brand || product.features?.find(f => f.toLowerCase().includes('thương hiệu'))?.split(':')?.[1]?.trim() || 'Q&H Lumina (Hàn Quốc)' },
                   { label: 'Kết cấu', value: product.texture || product.features?.find(f => f.toLowerCase().includes('kết cấu'))?.split(':')?.[1]?.trim() || 'Mịn lỳ' },
                   { label: 'Nơi sản xuất', value: product.origin || product.features?.find(f => f.toLowerCase().includes('xuất xứ'))?.split(':')?.[1]?.trim() || 'Hàn Quốc' },
                 ].map((item, i) => (
                   <div key={i} className="flex text-sm">
                      <span className="w-32 font-bold text-gray-900">{item.label}:</span>
                      <span className="text-gray-500">{item.value}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-8">
              <div className="space-y-3">
                 <h3 className="font-bold text-gray-900">1. Thông tin sản phẩm</h3>
                 <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description || product.features?.find(f => f.length > 50) || "Sản phẩm được tuyển chọn kỹ lưỡng, đảm bảo chất lượng và uy tín tuyệt đối từ thương hiệu."}
                 </p>
              </div>
              <div className="space-y-3">
                 <h3 className="font-bold text-gray-900">2. Đặc điểm nổi bật</h3>
                 <ul className="space-y-2">
                    {(product.features || [
                      "Sản phẩm chính hãng, được phân phối trực tiếp từ thương hiệu.",
                      "Đảm bảo chất lượng và an toàn cho người sử dụng.",
                      "Độ lỳ màu cực tốt, bám môi suốt cả ngày dài.",
                      "Thành phần dưỡng chất tự nhiên bảo vệ làn môi căng mọng."
                    ]).map((f, i) => (
                      <li key={i} className="flex items-start space-x-3 text-sm text-gray-600 leading-relaxed">
                         < CheckCircle2 className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" />
                         <span>{f}</span>
                      </li>
                    ))}
                 </ul>
              </div>
           </div>
        </section>

        {/* Enhanced Reviews Section */}
        <section className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12">
            <div className="inline-block border-b-2 border-brand-500 pb-2 mb-10">
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Đánh giá sản phẩm</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 items-center">
              <div className="text-center md:text-left space-y-2">
                <p className="text-7xl font-bold text-brand-500">{avgRating.toFixed(1)}</p>
                <div className="flex justify-center md:justify-start text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-5 h-5 fill-current", i >= Math.round(avgRating) && "text-gray-200 fill-none")} />)}
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{totalReviews} đánh giá</p>
              </div>

              <div className="md:col-span-2 space-y-3">
                {reviewStarsCount.map(({ star, count }) => (
                   <div key={star} className="flex items-center space-x-4">
                      <span className="text-xs font-bold text-gray-500 w-8">{star} sao</span>
                      <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-400 rounded-full" 
                          style={{ width: `${totalReviews > 0 ? (count / totalReviews) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 w-8">{count}</span>
                   </div>
                ))}
              </div>
            </div>

            <div className="mb-12">
               <button className="flex items-center space-x-3 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all group">
                  <Info className="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition-colors" />
                  <span className="text-sm font-bold text-gray-600">Lọc đánh giá</span>
               </button>
            </div>

            <div className="space-y-10 divide-y divide-gray-50">
              {reviews.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-gray-400 italic">Hiện tại chưa có đánh giá trực tiếp cho sản phẩm này.</p>
                </div>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="pt-10 first:pt-0 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-900">{r.userName}</h4>
                        <p className="text-[10px] text-gray-400">{new Date((r.createdAt as any)?.toDate() || Date.now()).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("w-3 h-3 fill-current", i >= r.rating && "text-gray-200")} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed italic">"{r.comment}"</p>
                    
                    {/* Store Reply Mockup */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-brand-100 mt-4 space-y-2">
                       <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-black uppercase text-brand-600">PHẢN HỒI:</span>
                       </div>
                       <p className="text-xs text-gray-500 leading-relaxed italic">Cảm ơn bạn đã tin tưởng ủng hộ shop ạ! Hy vọng bạn sẽ có những trải nghiệm tuyệt vời.</p>
                    </div>
                  </div>
                ))
              )}
            </div>
        </section>

        {/* Related Products */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Sản phẩm liên quan</h2>
            <Link to={`/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs font-bold text-brand-500 uppercase tracking-widest hover:underline">Xem tất cả</Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* We'll fetch related products in the component, for now a placeholder pattern matching Home.tsx */}
            <RelatedProducts category={product.category} currentId={product.id} />
          </div>
        </section>
      </div>
    </div>
  );
}

function RelatedProducts({ category, currentId }: { category: string, currentId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('category', '==', category),
          limit(4)
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Product))
          .filter(p => p.id !== currentId);
        setProducts(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRelated();
  }, [category, currentId]);

  if (products.length === 0) return null;

  return (
    <>
      {products.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col group cursor-pointer bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
          onClick={() => {
            navigate(`/product/${p.id}`);
            window.scrollTo(0, 0);
          }}
        >
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-50 mb-6 group-hover:shadow-lg transition-all duration-500">
            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                addToCart(p);
                setIsCartOpen(true);
              }}
              className="absolute bottom-3 right-3 bg-brand-500 text-white p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-600 active:scale-95 z-20"
              title="Thêm vào giỏ"
            >
              <ShoppingBag className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[2.5rem] uppercase tracking-tight">{p.name}</h4>
            <p className="text-lg font-black text-gray-900">{formatPrice(p.price)}</p>
          </div>
        </motion.div>
      ))}
    </>
  );
}
