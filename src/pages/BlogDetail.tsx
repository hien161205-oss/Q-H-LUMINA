import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author?: string;
  createdAt?: any;
}

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'blogs', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setBlog({ id: snap.id, ...snap.data() } as Blog);
          
          // Fetch related
          const q = query(collection(db, 'blogs'), limit(4));
          const relatedSnap = await getDocs(q);
          setRelatedBlogs(relatedSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Blog))
            .filter(d => d.id !== id)
            .slice(0, 3)
          );
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-pulse space-y-8">
      <div className="h-12 bg-brand-100 rounded-2xl w-3/4" />
      <div className="aspect-video bg-brand-100 rounded-[3rem]" />
      <div className="space-y-4">
        <div className="h-4 bg-brand-100 rounded w-full" />
        <div className="h-4 bg-brand-100 rounded w-full" />
        <div className="h-4 bg-brand-100 rounded w-5/6" />
      </div>
    </div>
  );

  if (!blog) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
      <p className="text-xl italic text-gray-400">Bài viết không tồn tại.</p>
      <button onClick={() => navigate('/blog')} className="text-brand-500 font-bold uppercase tracking-widest text-xs border border-brand-500 px-8 py-3 rounded-full hover:bg-brand-500 hover:text-white transition-all">
        Quay lại danh sách
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <button 
        onClick={() => navigate('/blog')}
        className="flex items-center space-x-2 text-gray-400 hover:text-brand-500 transition-colors mb-12 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs uppercase font-bold tracking-widest">Quay lại xu hướng</span>
      </button>

      <article className="space-y-12">
        <header className="space-y-6">
          <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-widest text-brand-500">
             <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{blog.createdAt?.toDate().toLocaleDateString('vi-VN') || 'Mới cập nhật'}</span>
             </div>
             <div className="w-1 h-1 bg-brand-200 rounded-full"></div>
             <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{blog.author || 'Admin'}</span>
             </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            {blog.title}
          </h1>
          <p className="text-xl text-gray-500 italic font-serif border-l-4 border-brand-500 pl-6">
            {blog.excerpt}
          </p>
        </header>

        <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl shadow-brand-100">
           <img src={blog.imageUrl} className="w-full h-full object-cover" alt={blog.title} />
        </div>

        <div className="prose prose-lg max-w-none prose-img:rounded-[2rem] prose-headings:font-serif prose-p:leading-relaxed prose-p:text-gray-600">
           <div dangerouslySetInnerHTML={{ __html: blog.content }} className="blog-content" />
        </div>

        <footer className="pt-12 border-t border-brand-100 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center space-x-4">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Chia sẻ:</span>
              <div className="flex space-x-3">
                 <button className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 hover:bg-brand-500 hover:text-white transition-all">
                    <Share2 className="w-4 h-4" />
                 </button>
              </div>
           </div>
           
           <div className="flex space-x-2">
              {['Làm đẹp', 'Xu hướng', 'Skin Lab'].map(tag => (
                <span key={tag} className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-tighter text-gray-500">
                  #{tag}
                </span>
              ))}
           </div>
        </footer>
      </article>

      {/* Related Section */}
      <section className="mt-32 pt-20 border-t border-brand-50 space-y-12">
         <h2 className="text-3xl font-bold text-gray-900 border-b border-brand-100 pb-6">Bài viết liên quan</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedBlogs.map(rb => (
              <div 
                key={rb.id} 
                className="group cursor-pointer space-y-4"
                onClick={() => navigate(`/blog/${rb.id}`)}
              >
                 <div className="aspect-video rounded-2xl overflow-hidden bg-brand-50">
                    <img src={rb.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={rb.title} />
                 </div>
                 <h4 className="font-bold text-gray-900 group-hover:text-brand-500 transition-colors line-clamp-2 leading-snug">{rb.title}</h4>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
}
