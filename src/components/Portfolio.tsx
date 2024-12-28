import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../config/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { FaChevronLeft, FaChevronRight, FaExpand, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface GalleryImage {
  id: string;
  title: string;
  imageData: string;
  description: string;
}

const Portfolio: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const galleryRef = collection(db, 'gallery');
        const q = query(galleryRef, orderBy('uploadedAt', 'desc'), limit(6));
        const querySnapshot = await getDocs(q);
        
        const fetchedImages: GalleryImage[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedImages.push({
            id: doc.id,
            title: data.title,
            imageData: data.imageData,
            description: data.description
          });
        });
        
        setImages(fetchedImages);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching gallery images:', error);
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const openModal = (image: GalleryImage) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[600px] bg-[#F8F3EE]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-[#C4A484] rounded-full animate-ripple"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-[#4A2D1D] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative w-full bg-[#F8F3EE] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-block bg-[#6B4423] text-white px-4 py-1 rounded-full text-sm font-medium mb-4"
          >
            Our Portfolio
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl lg:text-5xl font-bold text-[#4A2D1D] mb-4"
          >
            Featured Projects
          </motion.h2>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "100px" }}
            className="h-1 bg-[#C4A484] mx-auto mb-6"
          ></motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-[#6B4423] max-w-2xl mx-auto"
          >
            Explore our collection of meticulously crafted interior spaces that reflect our commitment to excellence
          </motion.p>
        </div>
        
        {/* Main Slider */}
        <div className="relative h-[70vh] w-full overflow-hidden rounded-3xl shadow-2xl mb-12">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentIndex}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={images[currentIndex]?.imageData}
                alt={images[currentIndex]?.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              
              {/* Image Details */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 p-8 lg:p-12"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-white text-3xl font-bold mb-3">{images[currentIndex]?.title}</h3>
                <p className="text-white/90 text-lg max-w-3xl">{images[currentIndex]?.description}</p>
              </motion.div>

              {/* Expand Button */}
              <button
                onClick={() => openModal(images[currentIndex])}
                className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300"
              >
                <FaExpand className="w-5 h-5" />
              </button>
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation Buttons */}
          <div className="absolute bottom-6 right-6 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevSlide}
              className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition-all duration-300"
            >
              <FaChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextSlide}
              className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-sm transition-all duration-300"
            >
              <FaChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {images.map((image, index) => (
            <motion.button
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setCurrentIndex(index)}
              className={`relative group overflow-hidden rounded-2xl ${
                index === currentIndex 
                  ? 'ring-4 ring-[#C4A484] shadow-xl' 
                  : 'hover:ring-2 hover:ring-[#C4A484]/50'
              }`}
            >
              <div className="aspect-square">
                <img
                  src={image.imageData}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300"></div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* View More Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mt-16"
        >
          <button
            onClick={() => navigate('/gallery')}
            className="bg-[#4A2D1D] hover:bg-[#3A1D0D] text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
          >
            View Full Gallery
          </button>
        </motion.div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isModalOpen && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-7xl w-full max-h-[90vh] rounded-3xl overflow-hidden"
            >
              <img
                src={selectedImage.imageData}
                alt={selectedImage.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300"
              >
                <FaTimes className="w-5 h-5" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 to-transparent">
                <h3 className="text-white text-2xl font-bold mb-2">{selectedImage.title}</h3>
                <p className="text-white/90">{selectedImage.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Portfolio;
