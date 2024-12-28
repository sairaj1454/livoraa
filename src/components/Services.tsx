import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';

const services = [
  {
    title: 'Residential Interiors',
    description: 'Transform your home with our premium residential interior design services. We specialize in modern living spaces, bedrooms, kitchens, and more.',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80',
    category: 'home',
    items: ['Living Rooms', 'Bedrooms', 'Modular Kitchens', 'Bathrooms', 'Kids Rooms']
  },
  {
    title: 'Commercial Spaces',
    description: 'Create impressive commercial spaces that reflect your brand. From offices to retail stores, we design spaces that inspire productivity and engagement.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80',
    category: 'commercial',
    items: ['Offices', 'Retail Stores', 'Restaurants', 'Hotels', 'Conference Rooms']
  },
  {
    title: 'Modular Solutions',
    description: 'Custom modular solutions for both homes and offices. Efficient storage systems and premium finishes that maximize space utilization.',
    image: 'https://images.unsplash.com/photo-1574739782594-db4ead022697?auto=format&fit=crop&q=80',
    category: 'both',
    items: ['Wardrobes', 'Storage Units', 'TV Units', 'Work Stations', 'Display Units']
  },
  {
    title: 'Renovation Services',
    description: 'Complete renovation services for existing spaces. We handle everything from planning to execution, ensuring minimal disruption.',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80',
    category: 'both',
    items: ['Space Planning', 'Structural Changes', 'Flooring', 'Lighting', 'Paint Works']
  }
];

const Services: React.FC = () => {
  return (
    <section className="relative py-20 bg-gradient-to-b from-[#F5EEE6] to-white">
      <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-block bg-[#6B4423] text-white px-4 py-1 rounded-full text-sm font-medium mb-4"
          >
            Our Services
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-[#4A2D1D] mb-4"
          >
            Comprehensive Interior Solutions
          </motion.h2>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "100px" }}
            className="h-1 bg-[#B68D40] mx-auto mb-6"
          ></motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-[#6B4423]"
          >
            Transform your space with our expert design services
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <h3 className="absolute bottom-4 left-6 text-2xl font-bold text-white z-20">
                  {service.title}
                </h3>
              </div>
              
              <div className="p-6">
                <p className="text-[#6B4423] mb-6 line-clamp-2">
                  {service.description}
                </p>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-[#4A2D1D] flex items-center gap-2">
                    <span className="w-8 h-0.5 bg-[#B68D40]"></span>
                    Key Features
                  </h4>
                  <ul className="grid grid-cols-2 gap-3">
                    {service.items.map((item, idx) => (
                      <li 
                        key={idx} 
                        className="flex items-center text-[#6B4423] text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#B68D40] mr-2"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-6 pt-6 border-t border-[#E6D5B8] text-center">
                  <Link 
                    to="/contact-us"
                    className="inline-flex items-center text-[#4A2D1D] font-medium hover:text-[#B68D40] transition-colors group"
                  >
                    Get in Touch
                    <FaArrowRight className="ml-2 transform group-hover:translate-x-2 transition-transform" />
                  </Link>
                  <p className="mt-4 text-[#6B4423]">Let's discuss your dream space</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      
      </div>
    </section>
  );
};

export default Services;
