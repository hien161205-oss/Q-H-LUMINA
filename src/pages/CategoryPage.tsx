import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { ArrowLeft, Star, ChevronRight as ChevronRightIcon, ShoppingBag, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

/**
 * Component hiển thị giao diện danh mục (UI & Logic Lọc/Sắp xếp)
 */
interface CategoryViewProps {
  title: string;
  products: Product[];
  loading: boolean;
}

function CategoryView({ title, products, loading }: CategoryViewProps) {
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  
  // State cho lọc và sắp xếp
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [activePriceRange, setActivePriceRange] = useState<{label: string, min?: number, max?: number} | null>(null);
  const [sortPrice, setSortPrice] = useState<'asc' | 'desc' | ''>('');

  const priceOptions = [
    { label: 'Giá dưới 100.000đ', max: 100000 },
    { label: '100.000đ - 200.000đ', min: 100000, max: 200000 },
    { label: '200.000đ - 500.000đ', min: 200000, max: 500000 },
    { label: 'Giá trên 500.000đ', min: 500000 }
  ];

  // Tự động lấy danh sách thương hiệu từ danh sách sản phẩm hiện tại
  const allBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort() as string[];

  // Logic xử lý sản phẩm (Lọc trước, sau đó Sắp xếp)
  const processedProducts = products
    .filter(p => {
      const brandMatch = selectedBrands.length === 0 || (p.brand && selectedBrands.includes(p.brand));
      let priceMatch = true;
      if (activePriceRange) {
        if (activePriceRange.min !== undefined && p.price < activePriceRange.min) priceMatch = false;
        if (activePriceRange.max !== undefined && p.price > activePriceRange.max) priceMatch = false;
      }
      return brandMatch && priceMatch;
    })
    .sort((a, b) => {
      if (sortPrice === 'asc') return a.price - b.price;
      if (sortPrice === 'desc') return b.price - a.price;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* BÊN TRÁI: SIDEBAR BỘ LỌC */}
        <aside className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-sm font-bold tracking-widest text-brand-600 border-b border-brand-100 pb-4 uppercase">Thương hiệu</h3>
            <div className="space-y-4">
              {allBrands.map(brand => (
                <label key={brand} className="flex items-center space-x-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={selectedBrands.includes(brand)}
                    onChange={() => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand])}
                    className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                  />
                  <span className={cn("text-sm transition-colors", selectedBrands.includes(brand) ? "text-gray-900 font-bold" : "text-gray-500 group-hover:text-gray-900")}>
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold tracking-widest text-brand-600 border-b border-brand-100 pb-4 uppercase">Mức giá</h3>
            <div className="space-y-4">
               {priceOptions.map((option, i) => (
                 <label key={i} className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="priceRange"
                      checked={activePriceRange?.label === option.label}
                      onChange={() => setActivePriceRange(option)}
                      className="w-5 h-5 border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className={cn("text-sm transition-colors", activePriceRange?.label === option.label ? "text-gray-900 font-bold" : "text-gray-500 group-hover:text-gray-900")}>
                      {option.label}
                    </span>
                 </label>
               ))}
               {activePriceRange && (
                 <button onClick={() => setActivePriceRange(null)} className="text-[10px] uppercase font-bold text-brand-500 hover:underline">Xóa lọc giá</button>
               )}
            </div>
          </div>
        </aside>

        {/* BÊN PHẢI: NỘI DUNG SẢN PHẨM */}
        <div className="lg:col-span-3 space-y-8">
          <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-brand-50/40 p-6 rounded-[2rem] border-2 border-brand-200 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">{title}</h1>
            <div className="relative">
              <select 
                value={sortPrice}
                onChange={(e) => setSortPrice(e.target.value as any)}
                className="appearance-none bg-white border-2 border-brand-300 rounded-2xl px-6 py-3 pr-10 text-xs font-bold uppercase tracking-widest text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer shadow-sm"
              >
                <option value="">Sắp xếp: Mặc định</option>
                <option value="asc">Giá: Thấp đến Cao</option>
                <option value="desc">Giá: Cao đến Thấp</option>
              </select>
              <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 rotate-90 pointer-events-none" />
            </div>
          </header>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-[3/4] bg-gray-100 rounded-[2.5rem] animate-pulse" />)}
            </div>
          ) : processedProducts.length === 0 ? (
            <div className="py-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200 italic text-gray-400">
              Không tìm thấy sản phẩm nào trong mục này.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
              {processedProducts.map((p) => (
                <motion.div 
                  key={p.id}
                  layout
                  className="group cursor-pointer bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col"
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-brand-50 mb-6">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToCart(p); setIsCartOpen(true); }}
                      className="absolute bottom-4 right-4 bg-brand-500 text-white p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-600"
                    >
                      <ShoppingBag className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="ml-1 text-[10px] font-bold text-gray-400">{(p.rating || 5.0).toFixed(1)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight line-clamp-2 leading-snug">{p.name}</h3>
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

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('Danh mục');

  // Hàm slugify chuẩn để khớp với Header
  const slugify = (text: string) => 
    text.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/\s+/g, '-');

  useEffect(() => {
    let unsubProducts: (() => void) | undefined;
    setLoading(true);

    // Lấy danh sách danh mục để ánh xạ slug (URL) sang tên gốc trong Database
    getDocs(collection(db, 'categories')).then(catsSnap => {
      const searchCats = catsSnap.docs.map(d => d.data().name as string);
      const foundName = searchCats.find(name => slugify(name) === categoryId);

      if (foundName) {
        setDisplayName(foundName);
        const q = query(collection(db, 'products'), where('category', '==', foundName));
        
        unsubProducts = onSnapshot(q, (snap) => {
          const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          const sorted = fetched.sort((a, b) => a.name.localeCompare(b.name));
          setProducts(sorted);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error('Lỗi truy vấn danh mục:', err);
      setLoading(false);
    });

    window.scrollTo(0, 0);
    return () => { if (unsubProducts) unsubProducts(); };
  }, [categoryId]);

  return <CategoryView key={categoryId} title={displayName} products={products} loading={loading} />;
}
