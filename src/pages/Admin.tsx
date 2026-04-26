import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  BarChart3, 
  Package, 
  ClipboardList, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight,
  Upload,
  CheckCircle2,
  Truck,
  PackageCheck,
  Zap,
  TrendingUp,
  FileText,
  Search
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  collection, 
  query, 
  getDocs, 
  doc,
  onSnapshot,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  orderBy,
  serverTimestamp,
  where,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, forceReconnect } from '../lib/firebase';
import { Product, Order, UserProfile } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { label: 'Tổng quan', path: '/admin', icon: BarChart3 },
    { label: 'Sản phẩm', path: '/admin/products', icon: Package },
    { label: 'Danh mục', path: '/admin/categories', icon: ChevronRight },
    { label: 'Đơn hàng', path: '/admin/orders', icon: ClipboardList },
    { label: 'Người dùng', path: '/admin/users', icon: Users },
    { label: 'Flash Sale', path: '/admin/flash', icon: Zap },
    { label: 'Bài viết', path: '/admin/blogs', icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
      {/* Sidebar */}
      <aside className="w-full md:w-64 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center space-x-3 px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all",
                isActive 
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-100" 
                  : "text-gray-500 hover:bg-brand-50 hover:text-brand-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </aside>

      {/* Content */}
      <main className="flex-grow bg-white rounded-[2.5rem] p-8 min-h-[60vh] border border-brand-50 shadow-sm overflow-hidden">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/categories" element={<CategoryManagement />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/flash" element={<FlashSaleManagement />} />
          <Route path="/blogs" element={<BlogManagement />} />
        </Routes>
      </main>
    </div>
  );
}

// Hàm fetch an toàn cho các collection, tránh lỗi Missing Permissions làm treo app
const safeFetchColl = async (name: string) => {
  try {
    const snap = await getDocs(collection(db, name));
    return { snap, error: false };
  } catch (e) {
    console.warn(`Admin SafeFetch: Không có quyền truy cập ${name}`);
    return { snap: { size: 0, docs: [] } as any, error: true };
  }
};

function CategoryManagement() {
  const [categories, setCategories] = useState<{ id: string, name: string, productCount: number, totalStock: number }[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCategoryStats = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        safeFetchColl('products'),
        safeFetchColl('categories')
      ]);

      const products: Product[] = prodRes.snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Product));
      let cats = catRes.snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as any));
      
      // Default categories if missing
      const defaultCats = ['Chăm sóc da', 'Trang điểm', 'Nước hoa', 'Chăm sóc cơ thể'];
      
      if (cats.length === 0) {
        // Initialize if empty
        const initialCats = defaultCats.map(name => ({ name }));
        for (const cat of initialCats) {
          const docRef = await addDoc(collection(db, 'categories'), cat);
          cats.push({ id: docRef.id, ...cat });
        }
      }

      const stats = cats.map((cat: any) => {
        const cName = String(cat.name || '').trim().toLowerCase();
        const catProds = products.filter((p: Product) => String(p.category || '').trim().toLowerCase() === cName);
        
        return {
          id: cat.id,
          name: cat.name || 'Chưa đặt tên',
          productCount: catProds.length,
          totalStock: catProds.reduce((acc: number, p: Product) => acc + (Number(p.stock) || 0), 0)
        };
      });

      setCategories(stats);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    // Lắng nghe real-time cả categories và products để tính toán số lượng tự động
    const unsubCats = onSnapshot(collection(db, 'categories'), (catSnap) => {
      const catsData = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const unsubProds = onSnapshot(collection(db, 'products'), (prodSnap) => {
        const products = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        
        const stats = catsData.map((cat: any) => {
          const cName = String(cat.name || '').trim().toLowerCase();
          const catProds = products.filter((p: Product) => String(p.category || '').trim().toLowerCase() === cName);
          
          return {
            id: cat.id,
            name: cat.name || 'Chưa đặt tên',
            productCount: catProds.length,
            totalStock: catProds.reduce((acc: number, p: Product) => acc + (Number(p.stock) || 0), 0)
          };
        });

        setCategories(stats);
        setLoading(false);
      });

      return () => unsubProds();
    });

    return () => unsubCats();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'categories'), { name: newCatName.trim() });
      toast.success('Đã thêm danh mục mới');
      setNewCatName('');
      setIsAdding(false);
      fetchCategoryStats();
    } catch (err) {
      toast.error('Lỗi khi thêm danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat && cat.productCount > 0) {
      toast.error(`Không thể xóa danh mục đang có ${cat.productCount} sản phẩm`);
      return;
    }
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        toast.success('Đã xóa danh mục');
        fetchCategoryStats();
      } catch (err) {
        toast.error('Lỗi khi xóa');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif">Quản lý danh mục</h2>
          <p className="text-xs text-gray-500 mt-1">Phân loại sản phẩm để khách hàng dễ tìm kiếm.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-brand-500 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center space-x-2 shadow-lg shadow-brand-100"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm danh mục</span>
        </button>
      </div>

      {isAdding && (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAddCategory} 
          className="bg-brand-50/50 p-6 rounded-3xl flex items-end gap-6 border border-brand-100"
        >
          <div className="flex-grow space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Tên danh mục mới</label>
            <input 
              required value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
              placeholder="Nhập tên danh mục..."
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-gray-400"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-brand-600 text-white px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-100 disabled:opacity-50"
            >
              Thêm
            </button>
          </div>
        </motion.form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            onClick={() => navigate(`/admin/products?category=${encodeURIComponent(cat.name)}`)}
            className="p-6 rounded-[2rem] border border-brand-50 bg-white shadow-sm flex flex-col space-y-4 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-500">
                <ChevronRight className="w-5 h-5" />
              </div>
              <button 
                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{cat.name}</h3>
              <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
                {cat.productCount} mẫu mã • {cat.totalStock} số lượng
              </p>
            </div>
            <div className="pt-2">
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, (cat.productCount / 20) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Overview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0, blogs: 0, categories: 0 });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [prodRes, orderRes, userRes, blogRes, catRes] = await Promise.all([
          safeFetchColl('products'),
          safeFetchColl('orders'),
          safeFetchColl('users'),
          safeFetchColl('blogs'),
          safeFetchColl('categories')
        ]);
        
        const orders: Order[] = orderRes.snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Order));
        const totalRevenue = orders.reduce((acc: number, order: Order) => acc + (Number(order.total) || 0), 0);
        
        const uniqueCatsFromProducts = new Set(prodRes.snap.docs.map((d: any) => d.data().category).filter(Boolean)).size;
      
        setStats({
          products: prodRes.snap.size,
          orders: orders.length,
          users: userRes.snap.size,
          revenue: totalRevenue,
          blogs: blogRes.snap.size,
          categories: catRes.snap.size || (uniqueCatsFromProducts > 0 ? uniqueCatsFromProducts : 4),
        });

        const last7Days = [...Array(7)].map((_: any, i: number) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          d.setHours(0, 0, 0, 0);
          return {
            date: d,
            label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            revenue: 0
          };
        });

        orders.forEach((order: Order) => {
          if (order.createdAt) {
            const orderDate = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date(order.createdAt as any);
            const dayIndex = last7Days.findIndex((d: any) => 
              d.date.getDate() === orderDate.getDate() && 
              d.date.getMonth() === orderDate.getMonth()
            );
            if (dayIndex !== -1) {
              last7Days[dayIndex].revenue += (Number(order.total) || 0);
            }
          }
        });

        setChartData(last7Days);
      } catch (err) {
        console.error("Overview Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Doanh thu', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'text-brand-500', bg: 'bg-brand-50', path: '/admin/orders' },
    { label: 'Đơn hàng', value: stats.orders, icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50', path: '/admin/orders' },
    { label: 'Danh mục', value: stats.categories || 0, icon: ChevronRight, color: 'text-orange-500', bg: 'bg-orange-50', path: '/admin/categories' },
    { label: 'Người dùng', value: stats.users, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', path: '/admin/users' },
  ];

  return (
    loading ? (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    ) : (
    <div className="space-y-12">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-serif">Tổng quan hệ thống</h2>
          <p className="text-sm text-gray-500 italic mt-2">Dữ liệu thời gian thực phản ánh sức sống của thương hiệu.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(card.path)}
            className="p-8 rounded-[2rem] border border-brand-50 bg-white space-y-4 cursor-pointer hover:shadow-xl hover:shadow-brand-100/50 hover:-translate-y-1 transition-all group"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", card.bg, card.color)}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase font-bold tracking-widest text-gray-400">{card.label}</p>
              <h3 className="text-2xl font-medium mt-1">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-brand-50/30 p-8 rounded-[3rem] border border-brand-50">
        <div className="flex items-center justify-between mb-8">
           <div>
             <h3 className="text-xl font-serif">Biểu đồ doanh thu</h3>
             <p className="text-sm text-brand-400 mt-1 italic">Dữ liệu tăng trưởng trong 7 ngày gần nhất</p>
           </div>
           <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-widest text-brand-500">
             <div className="w-3 h-3 bg-brand-500 rounded-full"></div>
             <span>Doanh số (VND)</span>
           </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                tickFormatter={(value) => `${value / 1000000}M`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                formatter={(value: any) => [formatPrice(value), 'Doanh thu']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#0ea5e9" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    )
  );
}

function ProductManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [existingBrands, setExistingBrands] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '', price: 0, imageUrl: '', category: 'Chăm sóc da', stock: 10, onFlashSale: false, flashSaleDiscount: 0,
    brand: '', weight: '', texture: '', origin: '', features: [], gallery: []
  });
  const [galleryText, setGalleryText] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    // Tự động cập nhật danh sách danh mục trong form
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const sorted = cats.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(sorted);
      if (!currentProduct.id && sorted.length > 0 && !currentProduct.category) {
        setCurrentProduct(prev => ({ ...prev, category: sorted[0].name }));
      }
    });

    // Tự động cập nhật danh sách sản phẩm và gợi ý thương hiệu (datalist)
    const unsubProds = onSnapshot(collection(db, 'products'), (snap) => {
      let allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      const brands = Array.from(new Set(allProducts.map(p => p.brand).filter(Boolean))) as string[];
      setExistingBrands(brands.sort());
      
      const catFilter = searchParams.get('category');
      if (catFilter) {
        allProducts = allProducts.filter(p => p.category === catFilter);
      }
      setProducts(allProducts.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });

    return () => {
      unsubCats();
      unsubProds();
    };
  }, [searchParams, currentProduct.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Safety timeout to prevent getting stuck
    const timeout = setTimeout(async () => {
      setLoading(false);
      toast.error('Phát hiện lỗi kết nối. Đang thử kết nối lại...');
      await forceReconnect();
    }, 15000);

    try {
      console.log("Đang bắt đầu lưu sản phẩm:", currentProduct.name);
      let finalImageUrl = currentProduct.imageUrl;

      if (imageFile) {
        toast.loading('Đang tải ảnh lên...', { id: 'img-upload' });
        try {
          const fileRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
          await uploadBytes(fileRef, imageFile);
          finalImageUrl = await getDownloadURL(fileRef);
          toast.success('Đã tải ảnh thành công', { id: 'img-upload' });
        } catch (storageErr: any) {
          console.error("Storage Error:", storageErr);
          toast.error('Tải ảnh thất bại (CORS/Lỗi mạng). Vui lòng sử dụng đường dẫn ảnh.', { id: 'img-upload' });
          throw storageErr;
        }
      }

      const productData = { 
        ...currentProduct, 
        name: currentProduct.name?.trim() || '',
        category: currentProduct.category?.trim() || 'Chăm sóc da',
        brand: currentProduct.brand?.trim() || '',
        imageUrl: finalImageUrl,
        gallery: galleryText ? galleryText.split(',').map(s => s.trim()) : [],
        features: featuresText ? featuresText.split('\n').map(s => s.trim()).filter(s => s) : [],
        stock: Number(currentProduct.stock) || 0,
        updatedAt: serverTimestamp() 
      };

      if (currentProduct.id) {
        await updateDoc(doc(db, 'products', currentProduct.id), productData);
        toast.success('Sản phẩm đã được cập nhật thành công');
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success('Sản phẩm đã được tạo thành công');
      }
      
      setIsEditing(false);
      setCurrentProduct({ name: '', price: 0, imageUrl: '', description: '', category: 'Chăm sóc da', stock: 10, onFlashSale: false, flashSaleDiscount: 0, brand: '', weight: '', texture: '', origin: '', features: [], gallery: [] });
      setGalleryText('');
      setFeaturesText('');
      setImageFile(null);
    } catch (error: any) {
      console.error("Save ritual failed critically:", error);
      toast.error(`Divine rejection: ${error.message}`);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Sản phẩm đã được xóa');
    }
  };

  const filteredAdminProducts = products.filter(p => 
    p.name.toLowerCase().includes(adminSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif">
            Sản phẩm {searchParams.get('category') && ` - ${searchParams.get('category')}`}
          </h2>
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            Tinh chỉnh bộ sưu tập của bạn.
            {searchParams.get('category') && (
              <button 
                onClick={() => setSearchParams({})} 
                className="ml-2 text-brand-500 font-bold hover:underline"
              >
                (Xóa bộ lọc)
              </button>
            )}
          </p>
        </div>
        <button 
          onClick={() => { 
            setIsEditing(true); 
            setCurrentProduct({ name: '', price: 0, imageUrl: '', category: 'Chăm sóc da', stock: 10, onFlashSale: false, flashSaleDiscount: 0, brand: '', weight: '', texture: '', origin: '', features: [], gallery: [] }); 
            setGalleryText('');
            setFeaturesText('');
          }}
          className="bg-brand-500 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center space-x-2 shadow-lg shadow-brand-100"
        >
          <Plus className="w-4 h-4" />
          <span>Sản phẩm mới</span>
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-brand-50/50 p-8 rounded-[2rem] space-y-6 border border-brand-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-widest text-brand-500 ml-4">Tên</label>
              <input 
                required value={currentProduct.name}
                onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-widest text-brand-500 ml-4">Giá (VND)</label>
              <input 
                type="text"
                value={currentProduct.price === 0 ? '' : currentProduct.price}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, '');
                  setCurrentProduct({...currentProduct, price: val === '' ? 0 : Number(val)});
                }}
                className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-widest text-brand-500 ml-4">Danh mục</label>
              <select 
                value={currentProduct.category}
                onChange={(e) => setCurrentProduct({...currentProduct, category: e.target.value})}
                className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200 appearance-none"
              >
                {categories.length > 0 ? categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                )) : (
                  <>
                    <option>Chăm sóc da</option>
                    <option>Trang điểm</option>
                    <option>Nước hoa</option>
                    <option>Chăm sóc cơ thể</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-widest text-brand-500 ml-4">Số lượng</label>
              <input 
                type="text"
                value={currentProduct.stock === 0 ? '' : currentProduct.stock}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, '');
                  setCurrentProduct({...currentProduct, stock: val === '' ? 0 : Number(val)});
                }}
                className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 bg-white p-6 rounded-2xl border border-brand-100">
              <input 
                type="checkbox"
                id="onFlashSale"
                checked={currentProduct.onFlashSale || false}
                onChange={(e) => setCurrentProduct({...currentProduct, onFlashSale: e.target.checked})}
                className="w-5 h-5 rounded-md border-brand-200 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="onFlashSale" className="text-sm font-bold text-gray-700">Hiển thị trong mục Flash Sale</label>
            </div>
            {currentProduct.onFlashSale && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Giảm giá (%)</label>
                <input 
                  type="text"
                  value={currentProduct.flashSaleDiscount === 0 ? '' : currentProduct.flashSaleDiscount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?!$)/, '');
                    setCurrentProduct({...currentProduct, flashSaleDiscount: val === '' ? 0 : Number(val)});
                  }}
                  className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Thương hiệu</label>
              <input 
                list="brand-suggestions"
                value={currentProduct.brand}
                onChange={(e) => setCurrentProduct({...currentProduct, brand: e.target.value})}
                placeholder="vd: Q&H Lumina"
                className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
              />
              <datalist id="brand-suggestions">
                {existingBrands.map(brand => <option key={brand} value={brand} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Trọng lượng</label>
              <input 
                value={currentProduct.weight}
                onChange={(e) => setCurrentProduct({...currentProduct, weight: e.target.value})}
                placeholder="vd: 4g, 50ml"
                className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Mịn lỳ / Kết cấu</label>
              <input 
                value={currentProduct.texture}
                onChange={(e) => setCurrentProduct({...currentProduct, texture: e.target.value})}
                placeholder="vd: Mịn lỳ, Dạng lỏng"
                className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Xuất xứ</label>
              <input 
                value={currentProduct.origin}
                onChange={(e) => setCurrentProduct({...currentProduct, origin: e.target.value})}
                placeholder="vd: Hàn Quốc"
                className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Nguồn ảnh</label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow flex items-center bg-white rounded-2xl px-6 py-4 border border-dashed border-brand-200">
                <Upload className="w-5 h-5 text-brand-300 mr-4" />
                <input 
                  type="file" accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="text-xs file:hidden cursor-pointer"
                />
              </div>
              <div className="flex items-center text-gray-300 px-4">HOẶC</div>
              <input 
                placeholder="Đường dẫn ảnh..."
                value={currentProduct.imageUrl}
                onChange={(e) => setCurrentProduct({...currentProduct, imageUrl: e.target.value})}
                className="flex-grow bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Ảnh bổ sung (ngăn cách bởi dấu phẩy)</label>
            <textarea 
              value={galleryText}
              onChange={(e) => setGalleryText(e.target.value)}
              placeholder="url1, url2, url3..."
              rows={2}
              className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Đặc điểm nổi bật (mỗi dòng 1 đặc điểm)</label>
            <textarea 
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="Sản phẩm bền đẹp&#10;Chiết xuất tự nhiên..."
              rows={3}
              className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button 
              type="button" onClick={() => setIsEditing(false)}
              className="px-8 py-4 rounded-2xl text-[10px] uppercase font-bold tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
            >
              Quay lại
            </button>
            <button 
              type="submit" disabled={loading}
              className="bg-brand-600 text-white px-10 py-4 rounded-2xl text-[10px] uppercase font-bold tracking-widest shadow-lg shadow-brand-100 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận thay đổi'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              placeholder="Tìm kiếm sản phẩm theo tên..."
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              className="w-full bg-white border border-brand-50 rounded-2xl pl-12 pr-6 py-3 outline-none focus:ring-2 focus:ring-brand-100 text-sm shadow-sm"
            />
          </div>
          
        <div className="overflow-x-auto rounded-[2rem] border border-brand-50">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-50 border-b border-brand-100">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-xs text-gray-500">Hình ảnh</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-xs text-gray-500">Tên</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-xs text-gray-500">Danh mục</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-xs text-gray-500">Giá</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-xs text-gray-500">Số lượng</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-xs text-gray-500 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filteredAdminProducts.map(p => (
                <tr key={p.id} className="hover:bg-brand-50/20 transition-colors">
                  <td className="px-6 py-4">
                    <img src={p.imageUrl} className="w-12 h-12 object-cover rounded-xl" />
                  </td>
                  <td className="px-6 py-4 font-medium text-base">{p.name} {p.onFlashSale && <Zap className="inline w-3 h-3 text-brand-500 ml-1 fill-current" />}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs uppercase tracking-widest px-2 py-1 bg-brand-50 rounded-full font-bold text-brand-600 border border-brand-100">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-serif italic text-sm">{formatPrice(p.price)}</td>
                  <td className={cn(
                    "px-6 py-4 text-sm font-medium",
                    (p.stock || 0) < 5 ? "text-red-600 font-bold" : "text-gray-700"
                  )}>
                    {p.stock}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => { 
                            setCurrentProduct(p); 
                            setGalleryText(p.gallery?.join(', ') || '');
                            setFeaturesText(p.features?.join('\n') || '');
                            setIsEditing(true); 
                        }}
                        className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
}

function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const statusColors = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    confirmed: 'bg-blue-50 text-blue-600 border-blue-100',
    shipping: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    completed: 'bg-brand-50 text-brand-600 border-brand-100',
  };
  
  const statusLabels = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao hàng',
    completed: 'Đã hoàn thành',
  };

  const fetchOrders = async () => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: Order['status']) => {
    await updateDoc(doc(db, 'orders', id), { status });
    toast.success('Đã cập nhật trạng thái');
    fetchOrders();
  };

  const deleteOrder = async (id: string) => {
    if (confirm('Xóa hồ sơ đơn hàng này?')) {
      await deleteDoc(doc(db, 'orders', id));
      toast.success('Đã xóa hồ sơ đơn hàng');
      fetchOrders();
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-serif">Đơn hàng</h2>
        <p className="text-xs text-gray-500 mt-1">Theo dõi hành trình của sự lung linh.</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {orders.map(order => (
          <div key={order.id} className="p-8 rounded-[2.5rem] border border-brand-50 bg-white grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Mã đơn hàng</p>
                <p className="text-xs font-mono font-medium truncate mt-1">#{order.id.slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Khách hàng</p>
                <h4 className="text-sm font-medium mt-1">{order.customerInfo.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{order.customerInfo.phone}</p>
                <p className="text-xs text-gray-400 mt-1 italic">{order.customerInfo.address}</p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-4">Các mục</p>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-2 border-b border-brand-50 last:border-0">
                    <span className="text-gray-600">{item.name} <span className="text-[10px] text-gray-300">×{item.quantity}</span></span>
                    <span className="font-serif italic">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest">Tổng cộng</span>
                  <span className="font-medium text-brand-600">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 flex flex-col justify-between items-end">
              <div className={cn("px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest border", statusColors[order.status])}>
                {statusLabels[order.status]}
              </div>
              
              <div className="flex flex-wrap gap-2 justify-end">
                {order.status === 'pending' && (
                  <button onClick={() => updateStatus(order.id, 'confirmed')} className="p-2 bg-brand-50 text-brand-500 rounded-xl hover:bg-brand-500 hover:text-white transition-all">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button onClick={() => updateStatus(order.id, 'shipping')} className="p-2 bg-brand-50 text-brand-500 rounded-xl hover:bg-brand-500 hover:text-white transition-all">
                    <Truck className="w-4 h-4" />
                  </button>
                )}
                {order.status === 'shipping' && (
                  <button onClick={() => updateStatus(order.id, 'completed')} className="p-2 bg-brand-50 text-brand-500 rounded-xl hover:bg-brand-500 hover:text-white transition-all">
                    <PackageCheck className="w-4 h-4" />
                  </button>
                )}
                {order.status !== 'completed' && (
                   <button onClick={() => deleteOrder(order.id)} className="p-2 text-gray-200 hover:text-red-500 transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    setUsers(snap.docs.map(doc => doc.data() as UserProfile));
  };

  const toggleRole = async (user: UserProfile) => {
    if (user.email === 'nghyn5851@gmail.com') {
      toast.error('Không thể thay đổi quyền của quản trị viên hệ thống.');
      return;
    }
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
      toast.success(`Đã cập nhật vai trò cho ${user.email}`);
      fetchUsers();
    } catch (err) {
      toast.error('Cập nhật thất bại');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-serif">Quản lý người dùng</h2>
        <p className="text-xs text-gray-500 mt-1">Quản lý tư cách thành viên và quyền hạn.</p>
      </header>

      <div className="overflow-x-auto rounded-[2rem] border border-brand-50">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 border-b border-brand-100">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-xs text-gray-500">Email</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-xs text-gray-500">UID</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-xs text-gray-500">Vai trò</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-brand-50/20 transition-colors">
                <td className="px-6 py-4 font-medium text-base">{u.email}</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-400">{u.uid}</td>
                <td className="px-6 py-4">
                  {u.email === 'nghyn5851@gmail.com' ? (
                    <span className="text-xs uppercase tracking-widest px-4 py-2 rounded-full font-bold bg-brand-500 text-white cursor-default opacity-80">
                      Quản trị viên Hệ thống
                    </span>
                  ) : (
                    <button 
                      onClick={() => toggleRole(u)}
                      className={cn(
                        "text-xs uppercase tracking-widest px-4 py-2 rounded-full font-bold transition-all hover:scale-105",
                        u.role === 'admin' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-brand-100'
                      )}
                    >
                      {u.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FlashSaleManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState<Record<string, number>>({});

  const fetchProducts = async () => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const snap = await getDocs(q);
    const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    setProducts(prods);
    
    const discMap: Record<string, number> = {};
    prods.forEach(p => {
      if (p.onFlashSale) discMap[p.id] = p.flashSaleDiscount || 0;
    });
    setDiscounts(discMap);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleUpdate = async (p: Product) => {
    try {
      const isCurrentlyOnSale = p.onFlashSale;
      const discount = discounts[p.id] || 0;
      
      await updateDoc(doc(db, 'products', p.id), { 
        onFlashSale: !isCurrentlyOnSale,
        flashSaleDiscount: !isCurrentlyOnSale ? (discount || 10) : 0, 
        updatedAt: serverTimestamp()
      });
      toast.success(`Đã ${!isCurrentlyOnSale ? 'thêm vào' : 'gỡ khỏi'} Flash Sale`);
      fetchProducts();
    } catch (err) {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleDiscountChange = (p: Product, value: number) => {
    setDiscounts(prev => ({ ...prev, [p.id]: value }));
  };

  const saveDiscount = async (p: Product) => {
    try {
      await updateDoc(doc(db, 'products', p.id), { 
        flashSaleDiscount: discounts[p.id] || 0,
        updatedAt: serverTimestamp()
      });
      toast.success('Đã lưu mức giảm giá');
      fetchProducts();
    } catch (err) {
      toast.error('Lưu thất bại');
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400 italic">Đang tải...</div>;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-serif">Flash Sale</h2>
        <p className="text-xs text-gray-500 mt-1">Lên kế hoạch giảm giá chớp nhoáng cho các sản phẩm tiêu biểu.</p>
      </header>

      <div className="overflow-x-auto rounded-[2rem] border border-brand-50">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 border-b border-brand-100">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-gray-500">Sản phẩm</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-gray-500">Giá gốc</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-gray-500">Trạng thái</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-gray-500">Giảm giá (%)</th>
              <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-gray-500 text-right">Giá sau giảm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {products.map(p => (
              <tr key={p.id} className={cn("hover:bg-brand-50/20 transition-colors", p.onFlashSale && "bg-brand-50/10")}>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <img src={p.imageUrl} className="w-10 h-10 object-cover rounded-lg" />
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs italic text-gray-400">{formatPrice(p.price)}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleUpdate(p)}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                      p.onFlashSale 
                        ? "bg-brand-500 text-white" 
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    <Zap className={cn("w-3 h-3", p.onFlashSale && "fill-current")} />
                    <span>{p.onFlashSale ? 'Đang Sale' : 'Không Sale'}</span>
                  </button>
                </td>
                <td className="px-6 py-4">
                  {p.onFlashSale ? (
                    <div className="flex items-center space-x-2">
                       <input 
                        type="number"
                        value={discounts[p.id] || 0}
                        onChange={(e) => handleDiscountChange(p, Number(e.target.value))}
                        className="w-16 bg-white border border-brand-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button 
                        onClick={() => saveDiscount(p)}
                        className="p-1 text-brand-500 hover:bg-brand-50 rounded-md"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-300">--</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {p.onFlashSale ? (
                    <span className="font-bold text-brand-600">
                      {formatPrice(p.price * (1 - (discounts[p.id] || 0) / 100))}
                    </span>
                  ) : (
                    <span className="text-gray-300">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlogManagement() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<any>({
    title: '', excerpt: '', content: '', imageUrl: '', author: 'Admin'
  });
  const [loading, setLoading] = useState(false);

  const fetchBlogs = async () => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setBlogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchBlogs(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const blogData = { 
        ...currentBlog, 
        updatedAt: serverTimestamp() 
      };
      if (!currentBlog.id) {
        blogData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'blogs'), blogData);
        toast.success('Đã tạo bài viết mới');
      } else {
        await updateDoc(doc(db, 'blogs', currentBlog.id), blogData);
        toast.success('Đã cập nhật bài viết');
      }
      setIsEditing(false);
      setCurrentBlog({ title: '', excerpt: '', content: '', imageUrl: '', author: 'Admin' });
      fetchBlogs();
    } catch (err: any) {
      toast.error('Lỗi khi lưu bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    await deleteDoc(doc(db, 'blogs', id));
    toast.success('Đã xóa bài viết');
    fetchBlogs();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif">Quản lý bài viết</h2>
          <p className="text-xs text-gray-500 mt-1">Xu hướng làm đẹp và tin tức.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-brand-500 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Viết bài mới</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-brand-50/50 p-8 rounded-[2.5rem] space-y-6 border border-brand-100">
           <div className="space-y-2">
             <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Tiêu đề</label>
             <input 
               required value={currentBlog.title}
               onChange={(e) => setCurrentBlog({...currentBlog, title: e.target.value})}
               className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
             />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Tóm tắt</label>
             <textarea 
               required value={currentBlog.excerpt}
               onChange={(e) => setCurrentBlog({...currentBlog, excerpt: e.target.value})}
               rows={2}
               className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200 resize-none"
             />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">URL Ảnh bìa</label>
                <input 
                  required value={currentBlog.imageUrl}
                  onChange={(e) => setCurrentBlog({...currentBlog, imageUrl: e.target.value})}
                  className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Tác giả</label>
                <input 
                  value={currentBlog.author}
                  onChange={(e) => setCurrentBlog({...currentBlog, author: e.target.value})}
                  className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200"
                />
              </div>
           </div>
           <div className="space-y-2">
             <label className="text-[10px] uppercase font-bold tracking-widest text-brand-500 ml-4">Nội dung (HTML)</label>
             <textarea 
               required value={currentBlog.content}
               onChange={(e) => setCurrentBlog({...currentBlog, content: e.target.value})}
               rows={10}
               placeholder="<p>Nội dung bài viết...</p>"
               className="w-full bg-white rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-brand-200 font-mono text-sm"
             />
           </div>
           <div className="flex justify-end space-x-4 pt-6">
             <button 
               type="button" onClick={() => { setIsEditing(false); setCurrentBlog({ title: '', excerpt: '', content: '', imageUrl: '', author: 'Admin' }); }}
               className="px-8 py-4 text-[10px] uppercase font-bold tracking-widest text-gray-500"
             >
               Hủy bỏ
             </button>
             <button 
               type="submit" disabled={loading}
               className="bg-brand-600 text-white px-10 py-4 rounded-2xl text-[10px] uppercase font-bold tracking-widest shadow-lg shadow-brand-100"
             >
               {loading ? 'Đang lưu...' : 'Lưu bài viết'}
             </button>
           </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-6">
           {blogs.map(blog => (
             <div key={blog.id} className="flex bg-white p-4 rounded-3xl border border-brand-50 hover:bg-brand-50/20 transition-all group">
                <img src={blog.imageUrl} className="w-24 h-24 object-cover rounded-2xl" />
                <div className="ml-6 flex-grow py-2">
                   <h3 className="font-bold text-gray-900 group-hover:text-brand-500 transition-colors">{blog.title}</h3>
                   <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">{blog.excerpt}</p>
                   <div className="flex items-center space-x-4 mt-3">
                      <button onClick={() => { setCurrentBlog(blog); setIsEditing(true); }} className="text-[10px] font-black uppercase tracking-widest text-brand-300 hover:text-brand-600">Sửa</button>
                      <button onClick={() => handleDelete(blog.id)} className="text-[10px] font-black uppercase tracking-widest text-red-200 hover:text-red-500">Xóa</button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
