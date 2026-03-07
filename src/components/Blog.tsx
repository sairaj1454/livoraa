import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendar, FaUser, FaTags, FaClock, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { Image as IKImage } from '@imagekit/react';

// Define blog post type
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  galleryImages: string[];
}

const Blog: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const blogRef = collection(db, 'blogs');
        const q = query(blogRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const posts: BlogPost[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          posts.push({
            id: doc.id,
            title: data.title,
            excerpt: data.excerpt || '',
            content: data.content || '',
            category: data.category,
            author: data.authorName,
            date: data.createdAt?.toDate().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            readTime: data.readTime || '5 min read',
            image: data.imageData,
            galleryImages: data.galleryImages || [],
          });
        });

        setBlogPosts(posts);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A2D1D]"></div>
      </div>
    );
  }

  // Filter posts based on category and search query
  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full overflow-hidden" style={{ paddingTop: '80px' }}>
        {/* Background Image with Parallax Effect */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
        >
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1920&auto=format&fit=crop"
            alt="Interior Design Blog"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/60" />
        </motion.div>

        {/* Content */}
        <div className="relative min-h-[calc(120vh-80px)] flex items-center">
          <div className="max-w-[1440px] w-full mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block text-[#C4A484] text-lg font-medium tracking-wider mb-4"
              >
                DESIGN INSIGHTS & INSPIRATION
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-5xl lg:text-7xl font-bold mb-6 leading-tight text-white"
              >
                Explore Our
                <span className="block text-[#C4A484]">Design Journal</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-gray-100 mb-12 leading-relaxed"
              >
                Discover the latest trends, expert tips, and inspiring stories from the world of interior design. Join us on a journey of creativity and innovation.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="relative max-w-2xl mx-auto"
              >
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-8 py-5 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 text-white placeholder-gray-300 focus:outline-none focus:border-[#C4A484] focus:ring-2 focus:ring-[#C4A484] transition-all duration-300"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#4A2D1D] text-white p-4 rounded-full hover:bg-[#3A1D0D] focus:outline-none focus:ring-2 focus:ring-[#C4A484] focus:ring-offset-2 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex justify-center gap-8 mt-16"
              >
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#C4A484] mb-2">{blogPosts.length}</p>
                  <p className="text-gray-200">Articles</p>
                </div>

                <div className="text-center">
                  <p className="text-3xl font-bold text-[#C4A484] mb-2">{new Set(blogPosts.map(post => post.category)).size}</p>
                  <p className="text-gray-200">Categories</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid Section */}
      <section className="w-full bg-gray-50 py-20">
        <div className="max-w-[1440px] mx-auto px-4">
          {/* Category Filter */}
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-3">
              {['All', ...new Set(blogPosts.map(post => post.category))].map((category) => (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory === category
                    ? 'bg-[#4A2D1D] text-white shadow-lg scale-105'
                    : 'bg-white text-gray-600 hover:bg-[#C4A484]/20 hover:scale-105'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Blog Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            layout
          >
            <AnimatePresence>
              {filteredPosts.map((post) => (
                <motion.article
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="relative h-64">
                    <IKImage
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      transformation={[{ width: "600", height: "400" }]}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-4 left-4 px-4 py-1 rounded-full bg-[#4A2D1D] text-white text-sm font-medium">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 hover:text-[#4A2D1D] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center text-gray-500 text-sm">
                      <span className="flex items-center mr-4 hover:text-[#4A2D1D] transition-colors">
                        <FaUser className="mr-2" />
                        {post.author}
                      </span>
                      <span className="flex items-center mr-4 hover:text-[#4A2D1D] transition-colors">
                        <FaCalendar className="mr-2" />
                        {post.date}
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Blog Post Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pt-20 pb-8 px-4 overflow-y-auto"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden my-auto"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/90 text-gray-600 hover:text-gray-900 transition-colors z-10"
              >
                <FaTimes size={24} />
              </button>

              <div className="relative h-[40vh] md:h-[50vh]">
                <IKImage
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              <div className="p-8">
                <span className="inline-block px-4 py-1 rounded-full bg-[#4A2D1D] text-white text-sm font-medium mb-4">
                  {selectedPost.category}
                </span>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  {selectedPost.title}
                </h2>
                <div className="flex items-center text-gray-600 text-sm mb-6">
                  <span className="flex items-center mr-4 hover:text-[#4A2D1D] transition-colors">
                    <FaUser className="mr-2" />
                    {selectedPost.author}
                  </span>
                  <span className="flex items-center mr-4 hover:text-[#4A2D1D] transition-colors">
                    <FaCalendar className="mr-2" />
                    {selectedPost.date}
                  </span>
                  <span className="flex items-center hover:text-[#4A2D1D] transition-colors">
                    <FaClock className="mr-2" />
                    {selectedPost.readTime}
                  </span>
                </div>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {selectedPost.excerpt}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedPost(null);
                    navigate(`/blog/${selectedPost.id}`);
                  }}
                  className="w-full py-3 bg-[#4A2D1D] text-white rounded-lg font-medium hover:bg-[#3A1D0D] focus:outline-none focus:ring-2 focus:ring-[#4A2D1D] focus:ring-offset-2 transition-all"
                >
                  View Details
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Blog;
