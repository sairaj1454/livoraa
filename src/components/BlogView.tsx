import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendar, FaUser, FaClock, FaArrowLeft, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

interface BlogPost {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  authorName: string;
  readTime: string;
  imageData: string;
  galleryImages: string[];
  createdAt: any;
}

const BlogView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, 'blogs', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPost({
            title: data.title,
            excerpt: data.excerpt || '',
            content: data.content,
            category: data.category,
            authorName: data.authorName,
            readTime: data.readTime || '5 min read',
            imageData: data.imageData,
            galleryImages: data.galleryImages || [],
            createdAt: data.createdAt?.toDate(),
          });
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A2D1D]"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Blog post not found</h2>
          <button
            onClick={() => navigate('/blog')}
            className="text-[#4A2D1D] hover:underline"
          >
            Return to Blog
          </button>
        </div>
      </div>
    );
  }

  const allImages = [post.imageData, ...(post.galleryImages || [])];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Back Button */}
      <motion.button
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  onClick={() => navigate('/blog')}
  className="fixed top-24 left-8 z-10 flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full shadow-md hover:shadow-lg transition-shadow"
>
  <FaArrowLeft />
  <span>Back to Blog</span>
</motion.button>


      {/* Hero Section */}
      <div className="relative h-[40vh] w-full">
        <img
          src={post.imageData}
          alt={post.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-image.jpg';
            target.onerror = null;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Title and Meta */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-7xl mx-auto">
            <span className="inline-block px-4 py-1 rounded-full bg-[#4A2D1D] text-white text-sm font-medium mb-4">
              {post.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <span className="flex items-center">
                <FaUser className="mr-2" />
                {post.authorName}
              </span>
              <span className="flex items-center">
                <FaCalendar className="mr-2" />
                {post.createdAt?.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="flex items-center">
                <FaClock className="mr-2" />
                {post.readTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section with Improved Layout */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Table of Contents */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-24 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-[#4A2D1D]">Table of Contents</h3>
              <nav className="space-y-2">
                {post.content.split('\n\n').map((section, index) => (
                  <a
                    key={index}
                    href={`#section-${index}`}
                    className="block text-gray-600 hover:text-[#4A2D1D] transition-colors text-sm py-1"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(`section-${index}`)?.scrollIntoView({
                        behavior: 'smooth'
                      });
                    }}
                  >
                    {section.slice(0, 50)}...
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <p className="text-gray-600 leading-relaxed mb-8 text-lg font-medium italic border-l-4 border-[#4A2D1D] pl-4">
                {post.excerpt}
              </p>
              <div className="prose prose-lg max-w-none">
                {post.content.split('\n\n').map((section, index) => (
                  <motion.div
                    key={index}
                    id={`section-${index}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mb-6"
                  >
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {section}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Image Gallery */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-6 text-[#4A2D1D]">Project Gallery</h2>
                <div className="grid grid-cols-2 gap-3">
                  {allImages.map((image, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.jpg';
                          target.onerror = null;
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <FaTimes size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.jpg';
                target.onerror = null;
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogView;
