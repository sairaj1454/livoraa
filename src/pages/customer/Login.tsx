import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'customers', userCredential.user.uid));

      if (!userDoc.exists() || userDoc.data().role !== 'customer') {
        await auth.signOut();
        setError('Access denied. This login is for customers only.');
        toast.error('Access denied. This login is for customers only.');
        return;
      }

      toast.success('Login successful!');
      navigate('/customer/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FDFCFB] font-['Outfit'] antialiased overflow-hidden">
      {/* ─── Left Panel: Visual Identity ─── */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        {/* Background Image with Parallax-like effect */}
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <img
            src="/images/login-bg.png"
            alt="Luxury Interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#2C1810]/80 via-[#2C1810]/40 to-transparent"></div>
        </motion.div>

        {/* Branding Content */}
        <div className="relative z-10 w-full max-w-2xl px-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col items-center text-center"
          >
            <img
              src="/images/logo.png"
              alt="Livoraa Logo"
              className="w-40 h-40 mb-10 brightness-0 invert opacity-95 drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
            />

            <div className="space-y-10">
              <h1 className="text-[84px] font-['Playfair_Display'] font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
                LIVORAA<br />ATELIER
              </h1>

              <div className="flex justify-center">
                <div className="h-1.5 w-24 bg-gradient-to-r from-transparent via-[#BC9B7A] to-transparent rounded-full shadow-lg"></div>
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl font-semibold text-white tracking-tight uppercase">
                  Customer Dashboard
                </h2>
                <div className="flex justify-center">
                  <p className="text-2xl text-white/70 font-light leading-relaxed italic antialiased max-w-md">
                    "Where every detail tells a story of elegance and sophistication."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute bottom-12 left-12 flex gap-4 text-white/40 text-sm font-medium tracking-widest border-l border-white/20 pl-6">
          <span>RESIDENTIAL</span>
          <span>•</span>
          <span>COMMERCIAL</span>
          <span>•</span>
          <span>HOSPITALITY</span>
        </div>
      </div>

      {/* ─── Right Panel: Authentication ─── */}
      <div className="w-full lg:w-[500px] xl:w-[600px] flex items-center justify-center p-8 lg:p-12 xl:p-24 bg-[#FDFCFB]">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          {/* Header */}
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-[48px] font-['Playfair_Display'] font-bold text-[#2C1810] leading-tight mb-3">
                Welcome Back
              </h2>
              <p className="text-gray-500 font-medium text-lg antialiased">
                Enter your credentials to access your dashboard.
              </p>
            </motion.div>
          </div>

          {/* Error Notice */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[14px] font-semibold flex items-center gap-3">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              {/* Email Address */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#BC9B7A] transition-colors">
                    <MailIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-7 py-5 bg-[#F8F7F5] border-2 border-transparent rounded-2xl focus:border-[#BC9B7A]/30 focus:bg-white transition-all outline-none font-semibold text-[#2C1810] placeholder:text-gray-300"
                    placeholder="name@example.com"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#BC9B7A] transition-colors">
                    <LockIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-7 py-5 bg-[#F8F7F5] border-2 border-transparent rounded-2xl focus:border-[#BC9B7A]/30 focus:bg-white transition-all outline-none font-semibold text-[#2C1810] placeholder:text-gray-300"
                    placeholder="••••••••••••"
                  />
                </div>
              </motion.div>
            </div>

            {/* Supplementary Actions */}
            <motion.div
              className="flex items-center justify-between px-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <label className="flex items-center group cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className={`w-5 h-5 border-2 rounded-lg transition-all flex items-center justify-center ${rememberMe ? 'bg-[#BC9B7A] border-[#BC9B7A]' : 'bg-white border-gray-200 group-hover:border-[#BC9B7A]'}`}>
                    {rememberMe && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <span className="ml-3 text-[14px] font-semibold text-gray-500 group-hover:text-[#2C1810] transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-[14px] font-bold text-[#BC9B7A] hover:text-[#2C1810] transition-colors tracking-tight">
                Forgot password?
              </a>
            </motion.div>

            {/* Login CTA */}
            <motion.button
              type="submit"
              disabled={loading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="group relative w-full overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#BC9B7A] to-[#A6886A] transition-all group-hover:opacity-90"></div>
              <div className="relative w-full py-5 text-white text-[16px] font-bold tracking-[0.1em] uppercase flex items-center justify-center gap-3">
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </motion.button>
          </form>

          {/* Help Center Link */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-gray-400 font-medium text-[14px]">
              Need assistance? <a href="#" className="text-[#BC9B7A] font-bold hover:underline underline-offset-4 decoration-2">Contact Admin</a>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Blur Background (Mobile) */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-[#BC9B7A]/5 rounded-full blur-[120px] pointer-events-none lg:hidden"></div>
    </div>
  );
};

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default CustomerLogin;
