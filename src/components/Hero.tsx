import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Features from './Features';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const images = [
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace',
  'https://images.unsplash.com/photo-1600210492493-0946911123ea',
  'https://images.unsplash.com/photo-1616137466211-f939a420be84',
  'https://images.unsplash.com/photo-1615529182904-14819c35db37'
];

const Hero: React.FC = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });
  const { submitForm } = useFormSubmission();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const backgroundVariants = {
    initial: { scale: 1.1, opacity: 0 },
    animate: { 
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    },
    exit: { 
      scale: 1,
      opacity: 0,
      transition: {
        duration: 0.5,
        ease: "easeIn"
      }
    }
  };

  const overlayVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.2
      }
    }
  };

  return (
    <>
      <div className="relative min-h-screen pt-20">
        {/* Background Image Slider with enhanced animation */}
        <div className="absolute inset-0 pt-20 overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentImage}
              className="absolute inset-0"
              variants={backgroundVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <img
                src={images[currentImage]}
                alt="Interior design background"
                className="w-full h-full object-cover"
              />
              <motion.div 
                className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70"
                variants={overlayVariants}
                initial="initial"
                animate="animate"
              >
                <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10 mix-blend-overlay"></div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content Container */}
        <div className="relative container mx-auto px-4 min-h-[calc(100vh-5rem)] flex items-center z-20">
          <div className="w-full flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-12 py-20 lg:py-0">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-white max-w-xl w-full lg:w-1/2 space-y-6 relative z-10"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                Virtuous<span className="text-[#C4A484]">Interiors</span>
                <span className="block">Hyderabad</span>
              </h1>
              <p className="text-lg md:text-xl mb-6 text-gray-200">
                Transform your space with our affordable and high-quality interior solutions
              </p>
              <p className="text-2xl md:text-3xl font-semibold mb-8 text-[#C4A484]">
                Starting from just ₹1,49,999*
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => {
                    const form = document.querySelector('form');
                    if (form) {
                      form.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-[#4A2D1D] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#3A1D0D] transition-all hover:scale-105"
                >
                  Get Free Quote
                </button>
                <Link 
                  to="/gallery"
                  className="border-2 border-white bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-100 hover:text-gray-900 transition-all hover:scale-105"
                >
                  View Portfolio
                </Link>
              </div>
            </motion.div>

            {/* Right Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full lg:w-5/12 mx-4 lg:mx-0 relative z-30"
            >
              <h3 className="text-2xl font-bold text-[#4A2D1D] mb-6 flex items-center gap-2">
                <span className="text-3xl">🎨</span>
                FREE Design and Quote
                <div className="w-16 h-1 bg-[#4A2D1D] mt-2"></div>
              </h3>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const result = await submitForm({
                    ...formData,
                    email: '',
                    formType: 'hero',
                  });
                  if (result.success) {
                    toast.success('Thank you for your interest! We will contact you soon.');
                    setFormData({ name: '', phone: '', message: '' });
                  } else {
                    toast.error('Failed to submit form. Please try again.');
                  }
                } catch (error) {
                  toast.error('An error occurred. Please try again.');
                }
              }}>
                <div>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4A2D1D] transition-all bg-white text-gray-900"
                    required
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4A2D1D] transition-all bg-white text-gray-900"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#4A2D1D] text-white py-4 rounded-xl font-semibold hover:bg-[#3A1D0D] transition-all hover:scale-105"
                >
                  Get FREE Quote
                </button>
                <p className="text-sm text-gray-500 text-center">
                  By submitting this form, you agree to the{' '}
                  <a href="#" className="text-[#4A2D1D] hover:underline">privacy policy</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#4A2D1D] hover:underline">terms of use</a>
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
      <div className="relative z-10">
        <Features />
      </div>
    </>
  );
};

export default Hero;
