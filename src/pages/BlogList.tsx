import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author?: string;
  createdAt?: any;
}

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setBlogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog)));
      } catch (err) {
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 uppercase tracking-tight">Xu hướng làm đẹp</h1>
        <p className="text-gray-500 max-w-2xl mx-auto italic">Khám phá những bí quyết, phong cách và xu hướng làm đẹp mới nhất từ các chuyên gia.</p>
        <div className="w-24 h-1 bg-brand-500 mx-auto mt-8 rounded-full"></div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-4 animate-pulse">
              <div className="aspect-[16/9] bg-brand-100 rounded-3xl" />
              <div className="h-6 bg-brand-100 w-3/4 rounded-xl" />
              <div className="h-4 bg-brand-100 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-20 bg-brand-50 rounded-[3rem] border border-brand-100">
          <p className="text-lg text-gray-400 italic">Đang cập nhật các bài viết xu hướng mới nhất...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {blogs.map((blog, idx) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group cursor-pointer flex flex-col h-full bg-white rounded-[2.5rem] overflow-hidden border border-brand-50 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
              onClick={() => navigate(`/blog/${blog.id}`)}
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img 
                  src={blog.imageUrl} 
                  alt={blog.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              </div>
              <div className="p-8 flex flex-col flex-grow space-y-4">
                <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-brand-500">
                  <span>Beauty Trend</span>
                  <div className="w-1 h-1 bg-brand-200 rounded-full"></div>
                  <span>{blog.author || 'Q&H Lumina'}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-500 transition-colors leading-tight line-clamp-2">
                  {blog.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-grow">
                  {blog.excerpt}
                </p>
                <div className="pt-4 flex items-center text-xs font-bold uppercase tracking-widest text-brand-600 group-hover:translate-x-2 transition-transform">
                  <span>Đọc tiếp</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
