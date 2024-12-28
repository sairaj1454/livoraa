import React from 'react';
import { FaCalendarCheck, FaAward, FaFileInvoiceDollar, FaStar, FaUsers, FaHome, FaPaintBrush, FaChartLine, FaHandshake, FaClock } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Features = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      {/* Stats Section with animated particles */}
      <section className="relative bg-gradient-to-b from-[#4A2D1D] to-[#3A1D0D] py-12 overflow-hidden">
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
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10 z-0"></div>
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="container mx-auto px-4 relative z-10"
        >
          {/* Title with decorative elements */}
          <div className="text-center mb-10">
            <motion.div 
              className="inline-block"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <span className="text-white bg-[#3A1D0D] px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider">
                Why Choose Us
              </span>
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-2">
              Why Choose virtuous interiors in Hyderabad?
            </h2>
            <div className="w-20 h-1 bg-white mx-auto rounded-full"></div>
          </div>

          {/* Stats Grid with Enhanced Design */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: FaHome, number: "200+", label: "#DeliveredHomes", desc: "Projects" },
              { icon: FaUsers, number: "90+", label: "Expert Designers", desc: "Professionals" },
              { icon: FaClock, number: "6+", label: "Years of Excellence", desc: "Experience" },
              { icon: FaStar, number: "4.6+", label: "CSAT Score", desc: "Rating" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="relative group"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 h-full flex flex-col items-center justify-center transform transition-all duration-300 group-hover:shadow-lg">
                  <div className="bg-[#3A1D0D] p-3 rounded-full text-white w-12 h-12 flex items-center justify-center mb-3">
                    <stat.icon className="text-xl group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <motion.h3 
                    className="text-3xl font-bold text-white mb-1"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: 0.2 * index, type: "spring", stiffness: 200 }}
                  >
                    {stat.number}
                  </motion.h3>
                  <p className="text-sm font-semibold text-white mb-0.5">{stat.label}</p>
                  <p className="text-xs text-white/80">{stat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Benefits Section with Enhanced Design */}
      <section className="bg-gray-50 py-12 relative overflow-hidden z-0">
        <div className="absolute inset-0 bg-[url('/pattern-light.png')] opacity-5 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Title */}
          <div className="text-center mb-10">
            <motion.span 
              className="text-[#4A2D1D] bg-[#C4A484]/20 px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Our Promises
            </motion.span>
            <h2 className="text-3xl font-bold text-gray-800 mt-4 mb-2">
              What Sets Us Apart
            </h2>
            <div className="w-20 h-1 bg-[#4A2D1D] mx-auto rounded-full"></div>
          </div>

          {/* Benefits Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: FaCalendarCheck,
                title: "45 Days Move-in Guarantee²",
                description: "Get your dream home ready in just 45 days with our efficient process and dedicated team.",
                features: ["Quick turnaround time", "Professional execution", "Timely delivery"]
              },
              {
                icon: FaAward,
                title: "Flat 10-Year Warranty¹",
                description: "Quality assurance that lasts a decade, giving you peace of mind for years to come.",
                features: ["Comprehensive coverage", "Free maintenance", "Quality materials"]
              },
              {
                icon: FaFileInvoiceDollar,
                title: "No Hidden Costs",
                description: "Transparent pricing with no surprises. What you see is what you pay.",
                features: ["Clear pricing", "Detailed quotation", "No hidden charges"]
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="group relative h-full"
                variants={itemVariants}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                  {/* Icon Container */}
                  <div className="relative mb-6 flex-shrink-0">
                    <div className="absolute -top-2 -left-2 w-16 h-16 bg-[#C4A484]/20 rounded-2xl transform -rotate-6 group-hover:rotate-0 transition-transform duration-300"></div>
                    <div className="relative z-10 bg-gradient-to-r from-[#4A2D1D] to-[#3A1D0D] w-12 h-12 rounded-xl flex items-center justify-center text-white">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <benefit.icon className="text-2xl" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-[#4A2D1D] transition-colors duration-300">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 mb-4 flex-grow">
                      {benefit.description}
                    </p>
                    <ul className="space-y-2 mt-auto">
                      {benefit.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-600">
                          <span className="w-1.5 h-1.5 bg-[#4A2D1D] rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="bg-white py-12 relative z-0">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FaHandshake, label: "100% Satisfaction", value: "Guaranteed" },
              { icon: FaUsers, label: "Expert Team", value: "Professional Staff" },
              { icon: FaHome, label: "Premium Quality", value: "Materials" },
              { icon: FaStar, label: "5-Star Rated", value: "Service" }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center h-28 flex flex-col items-center justify-center p-4 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-[#4A2D1D] mb-2">
                  <item.icon className="text-3xl mx-auto" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800">{item.label}</h4>
                <p className="text-gray-600 text-sm">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
