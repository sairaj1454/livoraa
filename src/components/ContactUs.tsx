import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaPencilAlt, FaMapMarkerAlt, FaClock, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { toast } from 'react-toastify';

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const { submitForm } = useFormSubmission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await submitForm({
        ...formData,
        formType: 'contact-us',
      });
      if (result.success) {
        toast.success('Thank you for your message! We will contact you soon.');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        toast.error('Failed to submit form. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <section className="w-full bg-gradient-to-br from-gray-50 to-gray-100 flex-grow">
      {/* Hero Section */}
      <div className="relative h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6"
            alt="Interior Design"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
        </div>

        {/* Content */}
        <div className="relative h-full flex items-center">
          <div className="max-w-[1440px] w-full mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="text-white"
              >
                <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                  Let's Create<br />
                  <span className="text-[#C4A484]">Something Beautiful</span>
                </h1>
                <p className="text-xl mb-8 text-gray-200">
                  Ready to transform your space? Get in touch with us and let's bring your vision to life with our expert design team.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#4A2D1D] text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-[#3A1D0D] transition-colors"
                >
                  Contact Us Now
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: FaMapMarkerAlt, title: 'Visit Us', content: 'Ramky One MarvelPrakasham Panthulu Nagar, Rodamestri Nagar, Hyderabad, Telangana 500055' },
            { icon: FaPhone, title: 'Call Us', content: '+91 8885500552' },
            { icon: FaClock, title: 'Business Hours', content: 'Mon - Fri: 9AM - 6PM' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-[#4A2D1D] p-3 rounded-lg">
                  <item.icon className="h-6 w-6 text-[#C4A484]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 mt-1">{item.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="h-full"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 h-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-[#4A2D1D] focus:border-transparent transition duration-200 hover:border-[#C4A484] bg-white text-gray-900"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-[#4A2D1D] focus:border-transparent transition duration-200 hover:border-[#C4A484] bg-white text-gray-900"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-[#4A2D1D] focus:border-transparent transition duration-200 hover:border-[#C4A484] bg-white text-gray-900"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FaPencilAlt className="h-4 w-4 text-gray-400" />
                    </div>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-[#4A2D1D] focus:border-transparent transition duration-200 hover:border-[#C4A484] bg-white text-gray-900"
                      placeholder="Enter your message"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#4A2D1D] to-[#3A1D0D] text-white py-3 px-6 rounded-lg font-medium hover:from-[#3A1D0D] hover:to-[#2A0D0D] transition duration-200 transform hover:scale-[1.02]"
                >
                  Send Message
                </button>
              </form>
            </div>
          </motion.div>

          {/* Map and Social Links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 h-full"
          >
            {/* Map */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[60%]">
              <iframe
                title="Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30437.241392445394!2d78.42340692965391!3d17.523966602026547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb8e28eeb3fbeb%3A0x5db5be64d76a7930!2sRamky%20One%20Marvel%2C%20Prakasham%20Panthulu%20Nagar%2C%20Rodamestri%20Nagar%2C%20Hyderabad%2C%20Telangana%20500055!5e0!3m2!1sen!2sin!4v1734765825722!5m2!1sen!2sin"
                className="w-full h-full"
                loading="lazy"
              ></iframe>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-2xl shadow-xl p-8 h-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Connect With Us</h3>
              <div className="flex items-center justify-center space-x-4">
                {[
                  { icon: FaFacebookF, link: '#' },
                  { icon: FaTwitter, link: '#' },
                  { icon: FaInstagram, link: '#' },
                  { icon: FaLinkedinIn, link: '#' }
                ].map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-[#4A2D1D] p-3 rounded-full text-[#C4A484] hover:bg-[#3A1D0D] transition-colors"
                  >
                    <social.icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
