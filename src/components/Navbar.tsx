import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { HiHome, HiPhotograph, HiNewspaper, HiInformationCircle, HiMail, HiX, HiUser } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import './Navbar.css';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { label: 'Home', path: '/', icon: HiHome },
    { label: 'Get Quote', path: '/get-quote', icon: HiMail },
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

  const handleNavClick = (path: string) => {
    if (path.startsWith('/#')) {
      const element = document.getElementById(path.substring(2));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-[9999] bg-[#F8F3EE] transition-all duration-300 ${isScrolled ? 'shadow-md border-b border-gray-200' : ''
          }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center"
            >
              <Link to="/" className="flex items-center">
                <img src="/images/logo.png" alt="LIVORAA ATELIER Logo" className="h-[75px] w-auto object-contain" />
              </Link>
            </motion.div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-12">
              <div className="flex items-center space-x-8">
                {menuItems.map((item) => (
                  <div key={item.label} className="relative">
                    {item.path.startsWith('/#') ? (
                      <button
                        onClick={() => handleNavClick(item.path)}
                        className="text-[15px] font-medium text-[#4A2D1D] hover:opacity-70 transition-opacity"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        to={item.path}
                        className={`text-[15px] font-medium text-[#4A2D1D] transition-all pb-1 ${location.pathname === item.path ? 'border-b-2 border-[#4A2D1D]' : 'hover:opacity-70'
                          }`}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 text-[14px] font-medium rounded-md bg-[#BC9B7A] text-white hover:bg-[#a88a6d] shadow-sm transition-all duration-300 flex items-center gap-2"
                  onClick={() => window.location.href = '/customer/login'}
                >
                  <HiUser className="text-base" />
                  Customer Login
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 text-[14px] font-medium rounded-md bg-[#4a2e1f] text-white hover:bg-[#3d261a] shadow-sm transition-all duration-300 flex items-center gap-2"
                  onClick={() => window.open(`https://wa.me/919000191496`, '_blank')}
                >
                  <FaWhatsapp className="text-base" />
                  WhatsApp
                </motion.button>
              </div>
            </div>

            {/* Mobile Menu Button */}
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 100 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-[#F8F3EE] shadow-2xl z-50"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex justify-between items-center p-8">
                  <img src="/images/logo.png" alt="LIVORAA ATELIER Logo" className="h-16 w-auto object-contain" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 border border-[#4A2D1D]/20 rounded-lg hover:bg-[#4A2D1D]/5 transition-colors"
                  >
                    <HiX className="w-6 h-6 text-[#4A2D1D]" />
                  </button>
                </div>

                {/* Mobile Links */}
                <div className="flex-1 overflow-y-auto px-6 py-2">
                  <div className="flex flex-col space-y-1">
                    {menuItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.path}
                        className={`flex items-center space-x-4 px-5 py-4 rounded-xl transition-all ${location.pathname === item.path
                          ? 'bg-[#BC9B7A]/15 text-[#4A2D1D]'
                          : 'text-[#4A2D1D]/70 hover:bg-[#4A2D1D]/5 hover:text-[#4A2D1D]'
                          }`}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleNavClick(item.path);
                        }}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium text-[16px]">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Mobile Bottom Actions */}
                <div className="p-8 space-y-4">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 bg-[#BC9B7A] text-white rounded-xl font-semibold shadow-sm flex items-center justify-center gap-3"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.location.href = '/customer/login';
                    }}
                  >
                    <HiUser className="text-xl" />
                    Customer Login
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 bg-[#4a2e1f] text-white rounded-xl font-semibold shadow-sm flex items-center justify-center gap-3"
                    onClick={() => window.open(`https://wa.me/919000191496`, '_blank')}
                  >
                    <FaWhatsapp className="text-xl" />
                    WhatsApp
                  </motion.button>
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
