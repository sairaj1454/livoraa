import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaAward, FaHandshake, FaLightbulb, FaChartLine, FaQuoteLeft, FaLeaf, FaPaintBrush, FaUsers } from 'react-icons/fa';

const About: React.FC = () => {
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
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const achievements = [
    { icon: FaAward, number: '200+', label: 'Projects Completed', color: '#B68D40' },
    { icon: FaUsers, number: '5+', label: 'Years Experience', color: '#C4A484' },
    { icon: FaPaintBrush, number: '90+', label: 'Professional Team', color: '#B68D40' },
    { icon: FaHandshake, number: '98%', label: 'Client Satisfaction', color: '#C4A484' }
  ];

  const values = [
    {
      icon: FaLightbulb,
      title: 'Innovation',
      description: 'Pushing boundaries with creative design solutions'
    },
    {
      icon: FaLeaf,
      title: 'Sustainability',
      description: 'Eco-friendly practices for a better tomorrow'
    },
    {
      icon: FaHandshake,
      title: 'Integrity',
      description: 'Honest and transparent client relationships'
    },
    {
      icon: FaChartLine,
      title: 'Excellence',
      description: 'Delivering superior quality in every project'
    }
  ];

  return (
    <div className="w-full overflow-hidden">
      {/* Hero Section with Parallax Effect */}
      <div className="relative min-h-screen">
        <div className="absolute inset-0">
          <motion.div
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            className="w-full h-full"
          >
            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6"
              alt="Interior Design"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
        </div>

        <div className="relative min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center text-white max-w-3xl mx-auto"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Transforming Spaces,
                <br />
                <span className="text-[#B68D40]">Enriching Lives</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8">
                Creating timeless interiors that inspire and elevate your everyday living
              </p>
              <div className="flex justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/gallery"
                    className="inline-block bg-[#4A2D1D] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#3A1D0D] transition-colors"
                  >
                    Our Portfolio
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/contact-us"
                    className="inline-block bg-white text-[#4A2D1D] px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Contact Us
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Vision Statement */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <FaQuoteLeft className="text-5xl text-[#B68D40] mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl font-bold text-[#4A2D1D] mb-6 leading-tight">
              "We believe in creating spaces that not only look beautiful but also enhance the way people live, work, and interact."
            </h2>
            <p className="text-xl text-gray-600 italic">
              - LIVORAA ATELIER Team
            </p>
          </motion.div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="bg-gradient-to-b from-[#4A2D1D] to-[#3A1D0D] py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {achievements.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center group hover:bg-white/20 transition-all duration-300"
              >
                <div className="mb-4">
                  <item.icon className="text-4xl text-[#B68D40] mx-auto" />
                </div>
                <h3 className="text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                  {item.number}
                </h3>
                <p className="text-gray-300">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Journey */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={itemVariants} className="space-y-6">
              <h2 className="text-4xl font-bold text-[#4A2D1D] mb-6">Our Journey</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                LIVORAA ATELIER was born from a passion to revolutionize interior design in Hyderabad. As a fresh, dynamic team, we bring innovative ideas and contemporary design solutions that reflect the evolving tastes of modern homeowners.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our strength lies in our agility, creativity, and unwavering commitment to excellence. We combine cutting-edge design trends with timeless aesthetics, ensuring every space we create is both current and enduring. Each project is an opportunity to push boundaries and exceed expectations.
              </p>
              <div className="pt-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/gallery"
                    className="inline-block bg-[#4A2D1D] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#3A1D0D] transition-colors"
                  >
                    View Our Projects
                  </Link>
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#B68D40] rounded-lg transform translate-x-4 translate-y-4" />
              <img
                src="https://images.unsplash.com/photo-1600210492493-0946911123ea"
                alt="Our workspace"
                className="relative z-10 rounded-lg shadow-xl w-full h-[500px] object-cover"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Meet Our Team */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#4A2D1D] mb-4 uppercase tracking-tight">MEET OUR TEAM</h2>
            <div className="w-24 h-1 bg-[#B68D40] mx-auto mb-8" />
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Behind every stunning space we design is a group of passionate minds and creative hearts. Our team is a blend of visionary designers, skilled craftsmen, and detail-driven planners, all dedicated to bringing your dream interiors to life.
            </p>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed mt-4">
              From the first sketch to the final flourish, we work together to ensure every project reflects your style, fits your lifestyle, and exceeds your expectations. With a shared love for aesthetics, functionality, and innovation, we turn empty rooms into living stories.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto"
          >
            {[
              { name: "L. Tharun" },
              { name: "Y. Chaitanya" }
            ].map((member, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="bg-[#3A2315] rounded-xl p-10 text-center shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{member.name}</h3>
                <div className="w-12 h-0.5 bg-[#B68D40] mx-auto relative z-10" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#4A2D1D] mb-4">Our Core Values</h2>
            <div className="w-24 h-1 bg-[#B68D40] mx-auto mb-6" />
            <p className="text-xl text-gray-600">The principles that guide our every decision</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group"
              >
                <div className="bg-gray-50 rounded-lg p-8 text-center h-full hover:bg-[#4A2D1D] transition-colors duration-300">
                  <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    <value.icon className="text-4xl text-[#B68D40] mx-auto group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#4A2D1D] mb-4 group-hover:text-white">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 group-hover:text-gray-200">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
