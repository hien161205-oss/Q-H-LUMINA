import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { ArrowLeft, Star, ChevronRight as ChevronRightIcon, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('Danh mục');
  const [maxPrice, setMaxPrice] = useState(5000000);
  const { buyNow, addToCart, setIsCartOpen } = useCart();

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        // Try to find the actual category name if the slug matches
        const catsSnap = await getDocs(collection(db, 'categories'));
        let foundName = '';
        const allCategories = catsSnap.docs.map(d => d.data().name);
        
        // Fallback names if Firebase categories collection is empty or inaccessible
        const defaultCats = ['Chăm sóc da', 'Trang điểm', 'Nước hoa', 'Chăm sóc cơ thể'];
        const searchCats = allCategories.length > 0 ? allCategories : defaultCats;

        foundName = searchCats.find(name => name.toLowerCase().replace(/\s+/g, '-') === categoryId) || 'Danh mục';
        setDisplayName(foundName);

        const q = query(
          collection(db, 'products'),
          where('category', '==', foundName),
          orderBy('name')
        );
        const snap = await getDocs(q);
        const fetchedProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(fetchedProducts);
        
        // Extract unique brands
        const brands = Array.from(new Set(fetchedProducts.map(p => {
          if (p.brand) return p.brand;
          const brandFeature = p.features?.find(f => f.toLowerCase().includes('thương hiệu'));
          if (brandFeature && brandFeature.includes(':')) {
            return brandFeature.split(':')[1].trim();
          }
          return null;
        }).filter(Boolean))) as string[];
        setAllBrands(brands);
      } catch (err) {
        console.error('Error fetching category products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
    window.scrollTo(0, 0);
  }, [categoryId]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const priceOptions = [
    { label: 'Giá dưới 100.000đ', max: 100000 },
    { label: '100.000đ - 200.000đ', min: 100000, max: 200000 },
    { label: '200.000đ - 300.000đ', min: 200000, max: 300000 },
    { label: '300.000đ - 500.000đ', min: 300000, max: 500000 },
    { label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
    { label: 'Giá trên 1.000.000đ', min: 1000000 }
  ];

  const [activePriceRange, setActivePriceRange] = useState<typeof priceOptions[0] | null>(null);

  const filteredProducts = products.filter(p => {
    const brandName = p.brand || p.features?.find(f => f.toLowerCase().includes('thương hiệu'))?.split(':')?.[1]?.trim();
    const brandMatch = selectedBrands.length === 0 || (brandName && selectedBrands.includes(brandName));
    let priceMatch = true;
    if (activePriceRange) {
        if (activePriceRange.min !== undefined && p.price < activePriceRange.min) priceMatch = false;
        if (activePriceRange.max !== undefined && p.price > activePriceRange.max) priceMatch = false;
    }
    return brandMatch && priceMatch;
  });

  const [showAllBrands, setShowAllBrands] = useState(false);
  const displayedBrands = showAllBrands ? allBrands : allBrands.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-gray-400 hover:text-brand-500 transition-colors mb-8 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs uppercase font-bold tracking-widest">Trang chủ</span>
      </button>

      <div className="mb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">{displayName}</h1>
        <div className="w-20 h-1 bg-brand-500 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar */}
        <aside className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-sm font-bold tracking-widest text-gray-900 border-b border-gray-100 pb-4 uppercase">Thương hiệu</h3>
            <div className="space-y-4">
              {allBrands.length > 0 ? (
                <>
                  {displayedBrands.map(brand => (
                    <label key={brand} className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="peer w-6 h-6 rounded-lg border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer appearance-none border-2 transition-all checked:bg-brand-500 checked:border-brand-500 shadow-sm"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      </div>
                      <span className={`text-sm tracking-tight transition-colors ${selectedBrands.includes(brand) ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>
                        {brand}
                      </span>
                    </label>
                  ))}
                  {allBrands.length > 5 && (
                    <button 
                        onClick={() => setShowAllBrands(!showAllBrands)}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-brand-500 transition-colors pt-2"
                    >
                        <span>{showAllBrands ? 'Thu gọn' : 'Xem thêm'}</span>
                        <ChevronRightIcon className={`w-4 h-4 transition-transform ${showAllBrands ? '-rotate-90' : 'rotate-90'}`} />
                    </button>
                  )}
                </>
              ) : <p className="text-xs text-gray-400 italic">Đang cập nhật...</p>}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold tracking-widest text-gray-900 border-b border-gray-100 pb-4 uppercase">Mức giá</h3>
            <div className="space-y-4">
               {priceOptions.map((option, i) => (
                 <label key={i} className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={activePriceRange === option}
                          onChange={() => setActivePriceRange(activePriceRange === option ? null : option)}
                          className="peer w-6 h-6 rounded-lg border-gray-200 text-brand-500 focus:ring-brand-500 cursor-pointer appearance-none border-2 transition-all checked:bg-brand-500 checked:border-brand-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 text-white">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                    </div>
                    <span className={`text-sm tracking-tight transition-colors ${activePriceRange === option ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>
                      {option.label}
                    </span>
                 </label>
               ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="space-y-4 animate-pulse">
                  <div className="aspect-[4/5] bg-brand-100 rounded-2xl" />
                  <div className="h-4 bg-brand-100 w-3/4 rounded" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-brand-50 rounded-[3rem] border border-brand-100">
              <p className="text-xl font-serif italic text-gray-400">Không tìm thấy sản phẩm nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {filteredProducts.map((p, idx) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group cursor-pointer bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col"
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-50 mb-6 group-hover:shadow-lg transition-all duration-500">
                    <img 
                      src={p.imageUrl} 
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-brand-600 shadow-sm border border-brand-100/20">
                        {p.brand || p.features?.find(f => f.toLowerCase().includes('thương hiệu'))?.split(':')?.[1]?.trim() || 'Premium'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p);
                          setIsCartOpen(true);
                        }}
                        className="bg-brand-500 text-white p-3 rounded-xl shadow-xl hover:bg-brand-600 transition-all active:scale-95 flex items-center justify-center self-end"
                        title="Thêm vào giỏ"
                      >
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 flex-grow flex flex-col">
                    <div className="flex items-center text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="ml-1 text-[10px] font-bold text-gray-400">{p.rating || 5}.0</span>
                      <span className="ml-auto text-[10px] font-bold text-gray-400">Đã bán {p.salesCount || 0}</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 group-hover:text-brand-500 transition-colors uppercase tracking-tight line-clamp-2 leading-snug flex-grow">{p.name}</h3>
                    <p className="text-lg font-black text-gray-900 mt-2">{formatPrice(p.price)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
