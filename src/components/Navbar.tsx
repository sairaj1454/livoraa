import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { HiHome, HiPhotograph, HiNewspaper, HiInformationCircle, HiMail, HiX } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import './Navbar.css';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { label: 'Home', path: '/', icon: HiHome },
    { label: 'Gallery', path: '/gallery', icon: HiPhotograph },
    { label: 'Blog', path: '/blog', icon: HiNewspaper },
    { label: 'About', path: '/about', icon: HiInformationCircle },
    { label: 'Contact Us', path: '/contact-us', icon: HiMail }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-[9999] bg-[#F8F3EE] transition-all duration-300 ${
          isScrolled ? 'shadow-lg shadow-[#C4A484]/20' : ''
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center"
            >
              <Link to="/" className="flex items-center gap-3">
                <img src="/images/portfolio/new.png" alt="Virtuous Interiors Logo" className="h-16 w-auto" />
                <div className="flex flex-col items-center relative">
                  <span className="text-2xl font-serif tracking-wider text-[#4A2D1D]">VIRTUOUS</span>
                  <span className="text-2xl font-serif tracking-wider text-[#C4A484]">INTERIORS</span>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-8">
              {menuItems.map((item, index) => (
                <motion.div key={item.path}>
                  <Link
                    to={item.path}
                    className={`text-base font-medium relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-0 after:transition-all after:duration-300 hover:after:w-full text-gray-700 hover:text-[#4A2D1D] after:bg-[#4A2D1D] ${
                      location.pathname === item.path ? 'after:w-full text-[#4A2D1D]' : ''
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 font-medium rounded-md bg-[#4A2D1D] text-white hover:bg-[#3A1D0D] shadow-lg hover:shadow-[#C4A484] transition-all duration-300 flex items-center gap-2"
                onClick={() => window.open(`https://wa.me/918885500552`, '_blank')}
              >
                <FaWhatsapp className="text-xl" />
                WhatsApp
              </motion.button>
            </div>

            {/* Mobile Menu Button - Only visible on mobile */}
            <div className="block lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`menu-button ${isMobileMenuOpen ? 'active' : ''}`}
                aria-label="Toggle menu"
              >
                <div className="menu-lines">
                  <span className="menu-line menu-line-1" />
                  <span className="menu-line menu-line-2" />
                  <span className="menu-line menu-line-3" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 100 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-[#F8F3EE] shadow-xl z-50"
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center p-6 border-b">
                  <span className="text-xl font-semibold text-gray-800">Menu</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-[#C4A484]/20 rounded-full transition-colors"
                  >
                    <HiX className="w-6 h-6 text-[#4A2D1D]" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-4">
                  <div className="flex flex-col px-4">
                    {menuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          location.pathname === item.path 
                            ? 'bg-[#C4A484]/20 text-[#4A2D1D]' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#4A2D1D]'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="p-6 border-t">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      // Add navigation to contact page if needed
                    }}
                    className="w-full py-3 px-4 bg-[#4A2D1D] text-white rounded-lg font-medium hover:bg-[#3A1D0D] transition-colors shadow-lg hover:shadow-[#C4A484]"
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
