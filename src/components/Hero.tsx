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
  const [errors, setErrors] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitForm } = useFormSubmission();

  const validateHeroForm = () => {
    const newErrors = { name: '', phone: '' };
    let valid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      valid = false;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
      valid = false;
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

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
                LIVORAA <span className="text-[#C4A484]">ATELIER</span>
                <span className="block">Hyderabad</span>
              </h1>
              <p className="text-lg md:text-xl mb-6 text-gray-200">
                Crafting dream interiors that reflect your personality — from concept to completion, we bring your vision to life.
              </p>
              <p className="text-2xl md:text-3xl font-semibold mb-8 text-[#C4A484]">
                Starting from just ₹1,49,999*
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/get-quote"
                  className="bg-[#4a2e1f] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#3d261a] transition-all hover:scale-105 inline-block text-center"
                >
                  Get Free Quote
                </Link>
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
                if (!validateHeroForm()) return;
                setIsSubmitting(true);
                try {
                  const result = await submitForm({
                    ...formData,
                    email: '',
                    formType: 'hero',
                  });
                  if (result.success) {
                    toast.success('Thank you for your interest! We will contact you soon.');
                    setFormData({ name: '', phone: '', message: '' });
                    setErrors({ name: '', phone: '' });
                  } else {
                    toast.error('Failed to submit form. Please try again.');
                  }
                } catch (error) {
                  toast.error('An error occurred. Please try again.');
                } finally {
                  setIsSubmitting(false);
                }
              }}>
                <div>
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-[#4A2D1D]'} focus:outline-none focus:ring-2 transition-all bg-white text-gray-900`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
                </div>
                <div>
                  <div className={`flex rounded-xl border ${errors.phone ? 'border-red-400' : 'border-gray-200'} overflow-hidden focus-within:ring-2 ${errors.phone ? 'focus-within:ring-red-400' : 'focus-within:ring-[#4A2D1D]'} bg-white transition-all`}>
                    <span className="flex items-center px-3 bg-gray-100 text-gray-600 font-semibold text-sm border-r border-gray-200 select-none whitespace-nowrap">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      value={formData.phone}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, phone: val });
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className="flex-1 px-3 py-3 focus:outline-none bg-white text-gray-900"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#4a2e1f] text-white py-4 rounded-xl font-semibold hover:bg-[#3d261a] transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : 'Get FREE Quote'}
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
