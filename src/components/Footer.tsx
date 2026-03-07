import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    navigation: [
      { name: 'Home', href: '/' },
      { name: 'Gallery', href: '/gallery' },
      { name: 'Blog', href: '/blog' },
      { name: 'About', href: '/about' }
    ],
    services: [
      { name: 'Residential Interiors', href: '#' },
      { name: 'Commercial Spaces', href: '#' },
      { name: 'Modular Solutions', href: '#' },
      { name: 'Renovation Services', href: '#' },
      { name: 'Space Planning', href: '#' }
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <footer className="relative bg-[#3A1D0D] text-white overflow-hidden py-16">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 30%)',
            'radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 30%)',
            'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 30%)',
            'radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 30%)',
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-12"
        >
          {/* Logo and Description */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6 bg-[#4A2D1D]/30 p-8 rounded-2xl border border-white/10 group">
              <img
                src="/images/logo.png"
                alt="LIVORAA ATELIER"
                className="h-24 object-contain brightness-0 invert transition-transform duration-300 group-hover:scale-110"
              />
            </Link>
            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
              Transform your space into something extraordinary with our expert interior design services.
            </p>
            <div className="flex space-x-4">
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                href="https://instagram.com/livoraa_atelier"
                className="text-gray-300 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram className="w-6 h-6" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                href="https://wa.me/919000191496"
                className="text-gray-300 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp className="w-6 h-6" />
              </motion.a>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-6 text-white">Navigation</h3>
            <ul className="space-y-4">
              {footerLinks.navigation.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-6 text-white">Our Services</h3>
            <ul className="space-y-4">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants}>
            <h3 className="text-xl font-bold mb-6 text-white">Contact Us</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://wa.me/919000191496"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-300 hover:text-white transition-colors text-sm"
                >
                  <FaWhatsapp className="w-5 h-5 mr-3" />
                  WhatsApp
                </a>
              </li>
              <li className="text-gray-300 text-sm leading-relaxed">
                Kukatpally,<br />
                Hyderabad,<br />
                Telangana, India
              </li>
              <li>
                <a href="mailto:livoraaatelier@gmail.com" className="text-gray-300 hover:text-white transition-colors text-sm">
                  livoraaatelier@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+919000191496" className="text-gray-300 hover:text-white transition-colors text-sm">
                  +91 9000191496
                </a>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Copyright */}
        <div className="text-center mt-16 pt-8 border-t border-white/10">
          <p className="text-gray-400 text-xs">
            © {currentYear} LIVORAA ATELIER. All rights reserved.
          </p>
          <p className="text-gray-500 text-[10px] mt-2">
            Made with ❤️ by <a href="#" className="hover:text-white transition-colors">ecnodev</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
