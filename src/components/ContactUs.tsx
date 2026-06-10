import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaPencilAlt, FaMapMarkerAlt, FaClock, FaInstagram } from 'react-icons/fa';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { toast } from 'react-toastify';

interface FormErrors {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { submitForm } = useFormSubmission();

  const validate = (): boolean => {
    const newErrors: FormErrors = { name: '', email: '', phone: '', message: '' };
    let valid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
      valid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
      valid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
      valid = false;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      valid = false;
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
      valid = false;
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
      valid = false;
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const result = await submitForm({
        ...formData,
        formType: 'contact-us',
      });
      if (result.success) {
        toast.success('Thank you for your message! We will contact you soon.');
        setFormData({ name: '', email: '', phone: '', message: '' });
        setErrors({ name: '', email: '', phone: '', message: '' });
      } else {
        toast.error('Failed to submit form. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full bg-[#fdfbf9] flex-grow">
      {/* Hero Section */}
      <div className="relative h-[55vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6"
            alt="Interior Design"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight"
          >
            Contact <span className="text-[#BC9B7A]">Us</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-200 max-w-2xl"
          >
            We're here to help you transform your space into a masterpiece.
          </motion.p>
        </div>
      </div>

      {/* Overlapping Info Cards Container */}
      <div className="relative z-30 -mt-20 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: FaMapMarkerAlt, title: 'Visit Us', content: 'Kukatpally, Hyderabad, Telangana' },
            { icon: FaPhone, title: 'Call Us', content: '+91 9000191496 / +91 90596 96057' },
            { icon: FaClock, title: 'Business Hours', content: 'Mon - Fri: 9AM - 6PM' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-8 flex items-start space-x-6 border border-gray-100 hover:shadow-2xl transition-all group"
            >
              <div className="bg-[#4A2D1D] p-4 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#4A2D1D] mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.content}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Column: Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-50"
          >
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-8">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 ml-1">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border ${errors.name ? 'border-red-400 focus:ring-red-300' : 'border-transparent focus:ring-[#4A2D1D]/20'} focus:ring-2 transition-all text-gray-800 placeholder:text-gray-400`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs ml-1">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 ml-1">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border ${errors.email ? 'border-red-400 focus:ring-red-300' : 'border-transparent focus:ring-[#4A2D1D]/20'} focus:ring-2 transition-all text-gray-800 placeholder:text-gray-400`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 ml-1">Phone Number</label>
                <div className={`flex rounded-xl bg-gray-50 border ${errors.phone ? 'border-red-400' : 'border-transparent'} overflow-hidden focus-within:ring-2 ${errors.phone ? 'focus-within:ring-red-300' : 'focus-within:ring-[#4A2D1D]/20'} transition-all`}>
                  <span className="flex items-center px-3 bg-gray-200 text-gray-600 font-semibold text-sm border-r border-gray-300 select-none whitespace-nowrap">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    maxLength={10}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, phone: val });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    className="flex-1 px-3 py-4 bg-transparent focus:outline-none text-gray-800 placeholder:text-gray-400"
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs ml-1">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 ml-1">Your Message</label>
                <div className="relative">
                  <FaPencilAlt className="absolute left-4 top-5 text-gray-400" />
                  <textarea
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (errors.message) setErrors({ ...errors, message: '' });
                    }}
                    rows={5}
                    className={`w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border ${errors.message ? 'border-red-400 focus:ring-red-300' : 'border-transparent focus:ring-[#4A2D1D]/20'} focus:ring-2 transition-all text-gray-800 placeholder:text-gray-400 resize-none`}
                    placeholder="Enter your message"
                  />
                </div>
                {errors.message && <p className="text-red-500 text-xs ml-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#3D2316] text-white py-5 rounded-xl font-bold text-lg hover:bg-[#2D1910] transition-all transform active:scale-[0.98] shadow-lg shadow-[#4A2D1D]/20 mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : 'Send Message'}
              </button>
            </form>
          </motion.div>

          {/* Right Column: Info */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-50"
            >
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-8">Get in Touch</h2>

              <div className="space-y-10">
                <div className="flex items-start space-x-6">
                  <div className="bg-[#4A2D1D] p-4 rounded-xl shrink-0 mt-1">
                    <FaClock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Business Hours</h4>
                    <p className="text-gray-500 leading-relaxed">
                      Monday - Friday: 9:00 AM - 6:00 PM<br />
                      Saturday: 10:00 AM - 4:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-6">
                  <div className="bg-[#4A2D1D] p-4 rounded-xl shrink-0 mt-1">
                    <FaEnvelope className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Email Us</h4>
                    <a href="mailto:livoraaatelier@gmail.com" className="text-[#BC9B7A] font-bold hover:underline transition-all">
                      livoraaatelier@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-6">
                  <div className="bg-[#4A2D1D] p-4 rounded-xl shrink-0 mt-1">
                    <FaPhone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Call Us</h4>
                    <div className="flex flex-col space-y-1">
                      <a href="tel:+919000191496" className="text-[#BC9B7A] font-bold hover:underline transition-all">+91 9000191496</a>
                      <a href="tel:+919059696057" className="text-[#BC9B7A] font-bold hover:underline transition-all">+91 90596 96057</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-10 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Connect With Us</h4>
                <div className="flex space-x-4">
                  <motion.a
                    whileHover={{ y: -5 }}
                    href="https://instagram.com"
                    target="_blank"
                    className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-[#4A2D1D] hover:bg-[#4A2D1D] hover:text-white transition-all shadow-sm"
                  >
                    <FaInstagram className="text-xl" />
                  </motion.a>
                  <motion.a
                    whileHover={{ y: -5 }}
                    href="https://wa.me/919000191496"
                    target="_blank"
                    className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-[#4A2D1D] hover:bg-[#4A2D1D] hover:text-white transition-all shadow-sm"
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 448 512">
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.7 17.8 69.7 27.2 106.2 27.2 122.4 0 222-99.6 222-222 0-59.3-23-115.1-65-157.1zM223.9 445.3c-33.2 0-65.7-8.9-93.9-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.5-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 54 81.2 54 130.4 0 101.7-82.8 184.5-184.5 184.5zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.4-27.4-16.3-14.6-27.4-32.7-30.6-38.1-3.2-5.5-.3-8.4 2.4-11.2 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.8-5.7 5.7-9.4 1.9-3.7 1-7-0.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-0.2-6.9-0.2-10.6-0.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.7 23.5 9.2 31.6 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                    </svg>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
