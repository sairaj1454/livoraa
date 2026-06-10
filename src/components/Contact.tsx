import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaPencilAlt } from 'react-icons/fa';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { toast } from 'react-toastify';

interface FormErrors {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
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
        formType: 'contact',
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
    <section id="contact" className="w-full bg-[#F8F3EE] flex-grow">
      {/* Section Heading */}
      <div className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-[#4A2D1D] mb-4">Get in Touch</h2>
            <div className="w-20 h-1 bg-[#C4A484] mx-auto mb-6"></div>
            <p className="text-lg text-[#6B4423] mb-8">Transform your space into a masterpiece. Let's discuss your vision and make it reality.</p>
          </motion.div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="w-full pb-16 lg:pb-20">
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-8">
          {/* Left side - Image and Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2"
          >
            <div className="relative h-full bg-white rounded-3xl shadow-2xl overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80"
                alt="Interior design consultation"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80 backdrop-blur-[2px]">
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h2 className="text-3xl font-light mb-2 text-white">Want a personalized</h2>
                  <h1 className="text-4xl font-bold mb-4 text-white">Home decor consultation?</h1>
                  <p className="text-lg opacity-90 text-white">
                    Share your info, and we'll call you to book your preferred slot.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2"
          >
            <form className="h-full bg-white p-8 rounded-3xl shadow-2xl" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-[#4A2D1D] mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-[#C4A484]" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${errors.name ? 'border-red-400 focus:ring-red-300' : 'border-[#F8F3EE] focus:ring-[#C4A484]'} focus:ring-2 focus:border-transparent transition duration-200 bg-white text-[#4A2D1D]`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#4A2D1D] mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-[#C4A484]" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${errors.email ? 'border-red-400 focus:ring-red-300' : 'border-[#F8F3EE] focus:ring-[#C4A484]'} focus:ring-2 focus:border-transparent transition duration-200 bg-white text-[#4A2D1D]`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-[#4A2D1D] mb-2">Phone Number</label>
                  <div className={`flex rounded-xl border-2 ${errors.phone ? 'border-red-400' : 'border-[#F8F3EE]'} overflow-hidden focus-within:ring-2 ${errors.phone ? 'focus-within:ring-red-300' : 'focus-within:ring-[#C4A484]'} focus-within:border-transparent transition duration-200 bg-white`}>
                    <span className="flex items-center px-3 bg-[#F8F3EE] text-[#4A2D1D] font-semibold text-sm border-r border-[#e8e0d8] select-none whitespace-nowrap">
                      +91
                    </span>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, phone: val });
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className="flex-1 px-3 py-3 focus:outline-none bg-white text-[#4A2D1D]"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-[#4A2D1D] mb-2">Message</label>
                  <div className="relative">
                    <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none">
                      <FaPencilAlt className="h-5 w-5 text-[#C4A484]" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (errors.message) setErrors({ ...errors, message: '' });
                      }}
                      rows={4}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${errors.message ? 'border-red-400 focus:ring-red-300' : 'border-[#F8F3EE] focus:ring-[#C4A484]'} focus:ring-2 focus:border-transparent transition duration-200 bg-white text-[#4A2D1D]`}
                      placeholder="Tell us about your project"
                    ></textarea>
                  </div>
                  {errors.message && <p className="text-red-500 text-xs mt-1 ml-1">{errors.message}</p>}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#4A2D1D] text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-[#3A1D0D] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
