import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { FaChevronLeft, FaChevronRight, FaSearch } from 'react-icons/fa';
import { Image as IKImage } from '@imagekit/react';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  dimensions: string;
  category: string;
  style: string;
  imageData: string; // Keep for backward compatibility/thumbnail
  images?: string[]; // Add array for multiple images
  uploadedAt: Date;
}

const Gallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  const heroImages = [
    {
      url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace',
      title: 'Luxury Living Spaces',
      subtitle: 'Where Comfort Meets Style'
    },
    {
      url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea',
      title: 'Modern Aesthetics',
      subtitle: 'Contemporary Design Solutions'
    },
    {
      url: 'https://images.unsplash.com/photo-1616137466211-f939a420be84',
      title: 'Timeless Elegance',
      subtitle: 'Classic Interior Design'
    }
  ];

  const categories = ['All', 'Custom Made', 'Bedrooms', 'Kitchen', 'Living Rooms', 'Washroom'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchGalleryItems = async () => {
      try {
        setLoading(true);
        const galleryRef = collection(db, 'gallery');
        const q = query(galleryRef, orderBy('uploadedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const items: GalleryItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            dimensions: data.dimensions,
            category: data.category,
            style: data.style,
            imageData: data.imageData,
            images: data.images || [data.imageData], // Fallback to imageData if images array empty
            uploadedAt: data.uploadedAt?.toDate() || new Date()
          });
        });

        setGalleryItems(items);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching gallery items:', err);
        setError('Error loading gallery items');
        setLoading(false);
      }
    };

    fetchGalleryItems();
  }, []);

  const filteredItems = galleryItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.style.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleNextModalImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedImage || !selectedImage.images) return;
    setCurrentModalImageIndex((prev) => (prev + 1) % selectedImage.images!.length);
  };

  const handlePrevModalImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedImage || !selectedImage.images) return;
    setCurrentModalImageIndex((prev) => (prev - 1 + selectedImage.images!.length) % selectedImage.images!.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[90vh] overflow-hidden">
        {/* Hero Slider */}
        <AnimatePresence initial={false}>
          <motion.div
            key={currentHeroImage}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative h-full">
              <div className="absolute inset-0 bg-black/50" />
              <IKImage
                src={heroImages[currentHeroImage].url}
                alt="Interior Design Gallery"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentHeroImage((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition-all z-20"
        >
          <FaChevronLeft className="text-xl" />
        </button>
        <button
          onClick={() => setCurrentHeroImage((prev) => (prev + 1) % heroImages.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition-all z-20"
        >
          <FaChevronRight className="text-xl" />
        </button>

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                  {heroImages[currentHeroImage].title}
                </h1>
                <p className="text-2xl sm:text-3xl md:text-4xl text-[#C4A484] font-medium">
                  {heroImages[currentHeroImage].subtitle}
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl mx-auto px-4"
              >
                Discover our collection of meticulously crafted interior designs
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-8 px-4"
              >
                <button
                  onClick={() => {
                    const gallerySection = document.getElementById('gallery-section');
                    gallerySection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto bg-[#4A2D1D] hover:bg-[#3A1D0D] text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3"
                >
                  <FaSearch className="text-xl" />
                  Browse Gallery
                </button>
                <Link
                  to="/contact-us"
                  className="w-full sm:w-auto bg-white/90 hover:bg-white text-[#4A2D1D] px-8 py-3 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-xl text-center"
                >
                  Book Consultation
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white text-center"
          >
            <div className="h-12 sm:h-16 w-[2px] bg-white/50 mx-auto mb-2" />
            <span className="text-sm font-medium">Scroll to Explore</span>
          </motion.div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div id="gallery-section" className="sticky top-20 bg-white/80 backdrop-blur-md z-40 py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedCategory === category
                  ? 'bg-[#4A2D1D] text-white shadow-lg shadow-[#4A2D1D]/20'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#4A2D1D] hover:text-[#4A2D1D]'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="max-w-2xl mx-auto relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, description, or style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#4A2D1D]/5 focus:border-[#4A2D1D] transition-all outline-none text-gray-800 text-lg shadow-sm"
            />
          </div>

          <div className="text-center mt-6 text-gray-400 text-sm font-medium">
            Showing {filteredItems.length} results
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#4A2D1D]/20 border-t-[#4A2D1D] rounded-full animate-spin mb-4" />
            <p className="text-[#4A2D1D] font-medium">Curating your view...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">{error}</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No masterpieces found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-[#4A2D1D]/10 transition-all duration-500 border border-gray-50"
                onClick={() => {
                  setSelectedImage(item);
                  setCurrentModalImageIndex(0);
                }}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <IKImage
                    src={item.imageData}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    transformation={[{ width: "400", height: "500" }]}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-[#4A2D1D]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="bg-white text-[#4A2D1D] px-8 py-3 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      View Collection
                    </span>
                  </div>
                  {item.images && item.images.length > 1 && (
                    <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold leading-none">
                      +{item.images.length - 1} more
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-serif text-[#4A2D1D] mb-2 line-clamp-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">{item.description}</p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <span className="px-3 py-1 bg-[#F8F3EE] text-[#4A2D1D] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#4A2D1D]/5">
                      {item.dimensions}
                    </span>
                    <span className="px-3 py-1 bg-[#F8F3EE] text-[#4A2D1D] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#4A2D1D]/5">
                      {item.style}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Modal Lighbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#000]/70 backdrop-blur-md z-[10001] flex items-start justify-center p-4 md:p-8 overflow-y-auto"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl max-w-6xl w-full my-auto lg:my-auto min-h-[50vh] max-h-none lg:max-h-[85vh] overflow-hidden flex flex-col lg:flex-row relative mt-24 lg:mt-0"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-white/90 hover:bg-white text-[#4A2D1D] rounded-full shadow-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Main Image View */}
              <div className="relative flex-1 bg-gray-50 flex items-center justify-center group overflow-hidden min-h-[300px] lg:min-h-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentModalImageIndex}
                    className="w-full h-full p-4 lg:p-12"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                  >
                    <IKImage
                      src={selectedImage.images ? selectedImage.images[currentModalImageIndex] : selectedImage.imageData}
                      alt={selectedImage.title}
                      className="w-full h-full object-contain"
                    />
                  </motion.div>
                </AnimatePresence>

                {selectedImage.images && selectedImage.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevModalImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-md text-[#4A2D1D] rounded-full shadow-lg transition-all"
                    >
                      <FaChevronLeft className="text-xl" />
                    </button>
                    <button
                      onClick={handleNextModalImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur-md text-[#4A2D1D] rounded-full shadow-lg transition-all"
                    >
                      <FaChevronRight className="text-xl" />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
                      {currentModalImageIndex + 1} / {selectedImage.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Details & Thumbnails */}
              <div className="w-full lg:w-[400px] p-6 lg:p-10 flex flex-col h-full border-t lg:border-t-0 lg:border-l border-gray-100 bg-white overflow-y-auto">
                <div className="mb-6">
                  <h2 className="text-2xl lg:text-3xl font-serif text-[#4A2D1D] mb-3">{selectedImage.title}</h2>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">{selectedImage.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-[#F8F3EE] rounded-xl">
                      <span className="block text-[10px] font-bold text-[#4A2D1D]/40 uppercase mb-1">Dimensions</span>
                      <span className="text-[#4A2D1D] text-xs font-bold">{selectedImage.dimensions}</span>
                    </div>
                    <div className="p-3 bg-[#F8F3EE] rounded-xl">
                      <span className="block text-[10px] font-bold text-[#4A2D1D]/40 uppercase mb-1">Style</span>
                      <span className="text-[#4A2D1D] text-xs font-bold">{selectedImage.style}</span>
                    </div>
                  </div>
                </div>

                {selectedImage.images && selectedImage.images.length > 1 && (
                  <div className="mb-8">
                    <h4 className="text-[10px] font-bold text-[#4A2D1D]/40 uppercase mb-3 tracking-widest">Gallery Collection</h4>
                    <div className="grid grid-cols-4 lg:grid-cols-3 gap-2">
                      {selectedImage.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentModalImageIndex(idx)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${currentModalImageIndex === idx ? 'border-[#4A2D1D] scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                          <IKImage
                            src={img}
                            className="w-full h-full object-cover"
                            transformation={[{ width: "100", height: "100" }]}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-6">
                  <Link
                    to="/get-quote"
                    className="w-full bg-[#4A2D1D] text-white py-4 rounded-xl font-bold text-center block hover:bg-[#3d261a] transition-all shadow-lg active:scale-95"
                  >
                    I want something like this
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
