import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { FaChevronLeft, FaChevronRight, FaSearch } from 'react-icons/fa';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  dimensions: string;
  category: string;
  style: string;
  imageData: string;
  uploadedAt: Date;
}

const Gallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Bedrooms');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [galleryItems, setGalleryItems] = useState<{ [key: string]: GalleryItem[] }>({
    'Bedrooms': [],
    'Living Rooms': [],
    'Dining Rooms': [],
    'Kitchen': []
  });
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
        
        const items: { [key: string]: GalleryItem[] } = {
          'Bedrooms': [],
          'Living Rooms': [],
          'Dining Rooms': [],
          'Kitchen': []
        };

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const item: GalleryItem = {
            id: doc.id,
            title: data.title,
            description: data.description,
            dimensions: data.dimensions,
            category: data.category,
            style: data.style,
            imageData: data.imageData,
            uploadedAt: data.uploadedAt?.toDate() || new Date()
          };
          
          if (items[item.category]) {
            items[item.category].push(item);
          }
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

  const handlePrevImage = () => {
    setCurrentHeroImage((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const handleNextImage = () => {
    setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
  };

  const handlePrevGalleryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedImage) return;
    
    const currentCategory = selectedImage.category;
    const currentImages = galleryItems[currentCategory] || [];
    const currentIndex = currentImages.findIndex(item => item.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    setSelectedImage(currentImages[prevIndex]);
  };

  const handleNextGalleryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedImage) return;
    
    const currentCategory = selectedImage.category;
    const currentImages = galleryItems[currentCategory] || [];
    const currentIndex = currentImages.findIndex(item => item.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % currentImages.length;
    setSelectedImage(currentImages[nextIndex]);
  };

  const heroVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
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
              <div className="absolute inset-0 bg-black/50" /> {/* Darker overlay */}
              <img 
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
              {/* Title */}
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

              {/* Description */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl mx-auto px-4"
              >
                Discover our collection of meticulously crafted interior designs
              </motion.p>

              {/* Buttons */}
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
                  className="w-full sm:w-auto bg-white/90 hover:bg-white text-[#4A2D1D] px-8 py-3 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-xl"
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

      {/* Gallery Section */}
      <div id="gallery-section" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {Object.keys(galleryItems).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-[#4A2D1D] text-white shadow-lg shadow-[#4A2D1D]/30 transform -translate-y-0.5'
                    : 'bg-white text-gray-700 hover:bg-[#C4A484]/10 hover:shadow'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brown-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-red-500 text-center py-8">
              {error}
            </div>
          )}

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 p-4">
            {!loading && galleryItems[selectedCategory]?.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                className="relative bg-white rounded-xl shadow-md overflow-hidden h-[420px] sm:h-[480px]"
                onClick={() => setSelectedImage(item)}
              >
                {/* Image Container */}
                <div className="relative h-[65%] overflow-hidden bg-gray-100">
                  <img
                    src={item.imageData}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <button className="w-full bg-white/90 backdrop-blur-sm text-gray-900 py-2 rounded-lg font-medium text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-4 h-[35%] flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">
                      <span className="mr-1">📏</span>
                      {item.dimensions}
                    </div>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">
                      <span className="mr-1">🎨</span>
                      {item.style}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {!loading && galleryItems[selectedCategory]?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No images found in this category.
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-start justify-center px-4 pt-24 md:pt-32"
          >
            <div className="relative w-full h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] flex items-start justify-center overflow-y-auto">
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.5 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-3xl bg-white rounded-lg overflow-hidden shadow-xl mb-8"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Image Container */}
                <div className="relative bg-gray-100">
                  <img
                    src={selectedImage.imageData}
                    alt={selectedImage.title}
                    className="w-full h-[40vh] md:h-[50vh] object-contain"
                  />

                  {/* Navigation Buttons */}
                  <button
                    onClick={handlePrevGalleryImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={handleNextGalleryImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 bg-white">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{selectedImage.title}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{selectedImage.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>Dimensions: {selectedImage.dimensions}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4.586a1 1 0 01.707.293l7.414 7.414a1 1 0 01.293.707V17a4 4 0 01-4 4H7z" />
                      </svg>
                      <span>Style: {selectedImage.style}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
