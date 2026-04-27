import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { Product, Blog } from '../types';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { Search, SlidersHorizontal, Plus, Zap, ChevronLeft, ChevronRight as ChevronRightIcon, Star, ShoppingBag } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'motion/react';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [maxPrice, setMaxPrice] = useState(5000000); // 5M VND
  const { addToCart, setIsCartOpen } = useCart();

  const searchTerm = searchParams.get('search') || '';

  // Flash Sale state
  const [flashSaleTab, setFlashSaleTab] = useState<'current' | 'upcoming'>('current');
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 36, seconds: 59 });

  // Best Sellers carousel
  const [bestSellersIndex, setBestSellersIndex] = useState(0);
  const bestSellers = products
    .filter(p => (p.salesCount || 0) >= 0) 
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 15);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(bestSellers.length / itemsPerPage);
  
  const [flashSaleIndex, setFlashSaleIndex] = useState(0);
  const flashSaleProducts = products.filter(p => p.onFlashSale);
  const flashSaleTotalPages = Math.ceil(flashSaleProducts.length / itemsPerPage);

  // Latest Products carousel
  const [latestProductsIndex, setLatestProductsIndex] = useState(0);
  const latestProducts = [...products]
    .sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    })
    .slice(0, 15);
  const latestProductsTotalPages = Math.ceil(latestProducts.length / itemsPerPage);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll logic for Filter Bar
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const categories = ['Tất cả', 'Chăm sóc da', 'Trang điểm', 'Nước hoa', 'Chăm sóc cơ thể'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), limit(50));
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        
        // Sort client-side to avoid filtering out docs without createdAt
        const sortedProducts = fetchedProducts.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        
        setProducts(sortedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categoryMap: Record<string, string> = {
    'Chăm sóc da': 'Chăm sóc da',
    'Trang điểm': 'Trang điểm',
    'Nước hoa': 'Nước hoa',
    'Chăm sóc cơ thể': 'Chăm sóc cơ thể'
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Normalize category for comparison
    const productCategory = categoryMap[p.category] || p.category;
    const matchesCategory = selectedCategory === 'Tất cả' || productCategory === selectedCategory;
    
    const matchesPrice = p.price <= maxPrice;
    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Blog state
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const q = query(collection(db, 'blogs'), limit(10));
        const snap = await getDocs(q);
        const fetchedBlogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog));
        
        // Sort client-side
        const sortedBlogs = fetchedBlogs.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        
        setBlogs(sortedBlogs.slice(0, 3));
      } catch (err) {
        console.error('Error fetching blogs:', err);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="space-y-12 pb-20 min-h-screen">
      {/* Phần hiển thị kết quả tìm kiếm */}
      {searchTerm && (
        <section className="max-w-7xl mx-auto px-6 pt-12">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-serif text-gray-900">Kết quả tìm kiếm cho: <span className="text-brand-500">"{searchTerm}"</span></h2>
              <p className="text-sm text-gray-400 mt-2 font-medium">Tìm thấy {filteredProducts.length} sản phẩm phù hợp</p>
            </div>
            <button onClick={() => navigate('/')} className="text-xs font-bold uppercase tracking-widest text-brand-500 hover:underline">Xóa tìm kiếm</button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-brand-200">
              <Search className="w-16 h-16 text-brand-100 mx-auto mb-6" />
              <p className="text-gray-400 italic text-lg font-serif">Rất tiếc, chúng tôi không tìm thấy sản phẩm nào khớp với từ khóa của bạn.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((p) => (
                <motion.div 
                  key={p.id}
                  layout
                  className="flex flex-col group cursor-pointer bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-50 mb-6 group-hover:shadow-lg transition-all duration-500">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[2.5rem] uppercase tracking-tight">{p.name}</h4>
                    <p className="text-lg font-black text-gray-900">{formatPrice(p.price)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {!searchTerm && (
        <>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto mt-6 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[3rem] overflow-hidden bg-white shadow-2xl shadow-brand-100/20"
        >
          <img 
            src="https://i.ibb.co/qFsR28Fv/Screenshot-2026-04-26-120729.png" 
            alt="3CE Banner"
            className="w-full h-auto block"
          />
        </motion.div>
      </section>

      {/* Flash Sale Section */}
      <section className="max-w-7xl mx-auto px-6 mt-24 md:mt-32">
        <div className="bg-brand-50 rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(14,165,233,0.15)] border-2 border-brand-200">
          <div className="bg-gradient-to-r from-brand-600 via-blue-600 to-brand-600 py-6 px-10 flex items-center justify-center space-x-4">
            <Zap className="w-8 h-8 text-yellow-400 fill-current animate-pulse" />
            <h2 className="text-3xl md:text-4xl font-black italic tracking-[0.2em] text-white uppercase drop-shadow-lg">Flash Sale</h2>
            <Zap className="w-8 h-8 text-yellow-400 fill-current animate-pulse" />
          </div>

          <div className="p-10 md:p-14 space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-4 border-b border-brand-100">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-bold text-brand-600 uppercase tracking-[0.3em]">• Ưu đãi giới hạn chỉ hôm nay</span>
              </div>
              
              <div className="flex items-center space-x-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thời gian còn lại:</span>
                <div className="flex space-x-3">
                  {[timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((val, i) => (
                    <div key={i} className="flex items-center">
                      <div className="bg-white border-2 border-brand-100 rounded-xl w-14 h-14 flex items-center justify-center font-black text-xl text-brand-600 shadow-sm">
                        {val.toString().padStart(2, '0')}
                      </div>
                      {i < 2 && <span className="mx-2 font-black text-2xl text-brand-200">:</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden">
              <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${flashSaleIndex * 100}%)` }}>
                {Array.from({ length: flashSaleTotalPages }).map((_, pageIdx) => (
                  <div key={pageIdx} className="w-full flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {flashSaleProducts.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage).map((p) => (
                      <div 
                        key={p.id} 
                        className="bg-white rounded-[2rem] p-6 border border-brand-50 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer relative"
                        onClick={() => navigate(`/product/${p.id}`)}
                      >
                        <div className="absolute top-4 right-4 z-10">
                          <span className="bg-brand-600 text-white text-xs font-black px-2 py-1 rounded-sm shadow-lg shadow-brand-200">-{p.flashSaleDiscount || 25}%</span>
                        </div>
                        <div className="aspect-square relative overflow-hidden rounded-2xl mb-6">
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
                            <ShoppingBag className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[2.5rem] leading-snug uppercase tracking-tight">{p.name}</h4>
                          <div className="flex flex-col">
                            <span className="text-brand-500 font-black text-lg">
                              {formatPrice(p.price * (1 - (p.flashSaleDiscount || 25) / 100))}
                            </span>
                            <span className="text-xs text-gray-300 line-through font-medium">{formatPrice(p.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {flashSaleProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 italic text-sm">
                  Hiện chưa có sản phẩm Flash Sale nào.
                </div>
              )}

              {flashSaleTotalPages > 1 && (
                <div className="flex justify-center space-x-3 mt-12">
                  {Array.from({ length: flashSaleTotalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFlashSaleIndex(idx)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        flashSaleIndex === idx 
                          ? 'bg-brand-500 w-8' 
                          : 'bg-brand-200 hover:bg-brand-300'
                      }`}
                      aria-label={`Go to page ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="max-w-7xl mx-auto px-6 mt-24 md:mt-32">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-widest text-gray-900 leading-relaxed pt-2">
            SẢN PHẨM <span className="text-brand-500">BÁN CHẠY</span>
          </h2>
          <div className="w-24 h-1 bg-brand-500 mx-auto mt-2 rounded-full"></div>
        </div>

        <div className="relative group overflow-hidden">
          <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${bestSellersIndex * 100}%)` }}>
            {Array.from({ length: totalPages }).map((_, pageIdx) => (
              <div key={pageIdx} className="w-full flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-8">
                {bestSellers.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage).map((p) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="flex flex-col group cursor-pointer bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                    onClick={() => navigate(`/product/${p.id}`)}
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
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                      {p.salesCount && (
                        <div className="absolute top-2 left-2 bg-brand-500 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                          Bán chạy
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[2.5rem] uppercase tracking-tight uppercase">{p.name}</h4>
                      <p className="text-lg font-black text-gray-900">{formatPrice(p.price)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center space-x-3 mt-12">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setBestSellersIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    bestSellersIndex === idx 
                      ? 'bg-brand-500 w-8' 
                      : 'bg-brand-200 hover:bg-brand-300'
                  }`}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Latest Products Section */}
      <section className="max-w-7xl mx-auto px-6 mt-24 md:mt-32">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-widest text-gray-900 leading-relaxed pt-2">MỚI NHẤT</h2>
          <div className="w-24 h-1 bg-brand-500 mx-auto mt-2 rounded-full"></div>
        </div>
        
        <div className="relative group overflow-hidden">
          <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${latestProductsIndex * 100}%)` }}>
            {Array.from({ length: latestProductsTotalPages }).map((_, pageIdx) => (
              <div key={pageIdx} className="w-full flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-8">
                {latestProducts.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage).map((p, idx) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col group cursor-pointer bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-brand-50 mb-6 group-hover:shadow-lg transition-all duration-500">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p);
                          setIsCartOpen(true);
                        }}
                        className="absolute bottom-3 right-3 bg-brand-500 text-white p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-600 active:scale-95 z-20"
                        title="Thêm vào giỏ"
                      >
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                      <div className="absolute top-4 right-4 h-8 w-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg">
                        <Star className="w-4 h-4 text-brand-400 fill-current" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[2.5rem] uppercase tracking-tight uppercase">{p.name}</h3>
                      <p className="text-lg font-black text-gray-900">{formatPrice(p.price)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>

          {latestProductsTotalPages > 1 && (
            <div className="flex justify-center space-x-3 mt-12">
              {Array.from({ length: latestProductsTotalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setLatestProductsIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    latestProductsIndex === idx 
                      ? 'bg-brand-500 w-8' 
                      : 'bg-brand-200 hover:bg-brand-300'
                  }`}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Category Grid Boxes */}
      <section className="max-w-7xl mx-auto px-6 mt-24 md:mt-32">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-widest text-gray-900 leading-relaxed pt-2">CÁC DANH MỤC</h2>
          <div className="w-24 h-1 bg-brand-500 mx-auto mt-2 rounded-full"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { id: 'cham-soc-da', label: 'Chăm sóc da', image: 'https://s3-ap-southeast-1.amazonaws.com/lixibox-production-uploads/blogs/pictures/18440/original_1692762586.jpg' },
            { id: 'trang-diem', label: 'Trang điểm', image: 'https://image.made-in-china.com/380f0j00yfGRNKUFhtlk/What-Surprising-Secrets-Do-Makeup-Sets-Hold-for-Global-Buyers-in-2026-.jpg' },
            { id: 'nuoc-hoa', label: 'Nước hoa', image: 'https://cdn.s99.vn/ss1/prod/product/70dd53015626f1158d1090459177d62b.jpg' },
            { id: 'cham-soc-co-the', label: 'Chăm sóc cơ thể', image: 'https://cdn.s99.vn/ss0/prod/product/138ac0a2f51b473db2548738da83241b.jpg' }
          ].map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(`/category/${cat.id}`)}
              className="group relative aspect-square w-full rounded-[2.5rem] overflow-hidden bg-brand-50 shadow-lg border border-brand-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <img 
                src={cat.image} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 scale-100 group-hover:scale-110" 
                alt={cat.label}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors duration-500">
                <h3 className="text-2xl md:text-4xl font-black text-white px-4 text-center transition-transform duration-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] uppercase tracking-tighter">{cat.label}</h3>
              </div>
              <div className="absolute inset-0 border-4 border-transparent group-hover:border-white/20 transition-all duration-500 rounded-[2.5rem]"></div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Beauty Trends (Xu hướng làm đẹp) Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 pb-0 text-center">
        <div className="flex flex-col items-center mb-16 px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-relaxed pt-2 mb-6 uppercase tracking-widest">XU HƯỚNG MỚI</h2>
          <button 
            onClick={() => navigate('/blog')}
            className="group flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-brand-500 transition-all border-b-2 border-transparent hover:border-brand-500 pb-2"
          >
            <span>Khám phá thêm</span>
            <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {blogs.length > 0 ? (
            blogs.map((blog, idx) => (
              <motion.div 
                key={blog.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden group cursor-pointer shadow-md hover:shadow-2xl hover:shadow-brand-100/50 hover:-translate-y-2 transition-all duration-500"
                onClick={() => navigate(`/blog/${blog.id}`)}
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img 
                    src={blog.imageUrl} 
                    alt={blog.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                </div>
                <div className="p-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-brand-500 transition-colors uppercase tracking-tight">{blog.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed italic opacity-80">{blog.excerpt}</p>
                </div>
              </motion.div>
            ))
          ) : (
            // Placeholder/Default if no blogs in DB yet
            [
              {
                id: 'bi-quyet-glass-skin',
                title: "Bí quyết cho làn da căng mọng chuẩn Glass Skin",
                desc: "Khám phá quy trình 7 bước dưỡng da giúp bạn sở hữu làn da trong suốt và rạng rỡ chuẩn Hàn.",
                image: "https://images.unsplash.com/photo-1590156221170-ce35ee07c751?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: 'review-3ce-stylenanda',
                title: "Review 3CE Stylenanda: Vì sao lại hot đến thế?",
                desc: "Tìm hiểu sức hút từ dòng mỹ phẩm đình đám 3CE và các mã màu son nhất định phải có.",
                image: "https://images.unsplash.com/photo-1586776977607-310e9c725c37?q=80&w=600&auto=format&fit=crop"
              },
              {
                id: 'bi-kip-makeup-trong-treo',
                title: "Bí kíp trang điểm trong trẻo mỗi ngày",
                desc: "Chỉ với 10 phút, bạn hoàn toàn có thể tự tin sải bước với phong cách Clean Girl rạng rỡ.",
                image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=600&auto=format&fit=crop"
              }
            ].map((blog, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden group cursor-pointer shadow-md hover:shadow-2xl hover:shadow-brand-100/50 hover:-translate-y-2 transition-all duration-500"
                onClick={() => navigate('/blog')}
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-brand-500 transition-colors uppercase tracking-tight">{blog.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed italic opacity-80">{blog.desc}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
        </>
      )}
    </div>
  );
}
