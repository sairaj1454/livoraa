import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/admin/dashboard');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Admin login successful');
      navigate('/admin/dashboard');
    } catch (error) {
      setError('Invalid admin credentials');
      toast.error('Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FDFCFB]">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 border-4 border-[#BC9B7A]/20 border-t-[#BC9B7A] rounded-full animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#FDFCFB] font-['Outfit'] antialiased overflow-hidden">
      {/* ─── Left Panel: Admin Identity ─── */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <img
            src="/images/admin-login-bg.png"
            alt="Professional Interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A]/90 via-[#1A1A1A]/60 to-transparent"></div>
        </motion.div>

        <div className="relative z-10 w-full max-w-2xl px-12 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="flex flex-col items-center gap-6 mb-12">
              <img
                src="/images/logo.png"
                alt="Livoraa Logo"
                className="w-32 h-32 brightness-0 invert opacity-95 drop-shadow-2xl"
              />
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-12 bg-white/20"></div>
                <span className="text-white/60 font-medium tracking-[0.4em] text-xs uppercase">Administration</span>
                <div className="h-[1px] w-12 bg-white/20"></div>
              </div>
            </div>

            <div className="space-y-10">
              <h1 className="text-[72px] font-['Playfair_Display'] font-black text-white leading-[0.9] tracking-tighter uppercase">
                MANAGEMENT<br />PORTAL
              </h1>

              <div className="flex justify-center">
                <div className="h-1.5 w-24 bg-[#BC9B7A] rounded-full shadow-lg"></div>
              </div>

              <p className="text-xl text-white/50 font-light leading-relaxed max-w-md mx-auto italic">
                Secure access for authorized personnel only. Please verify your credentials to continue.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Right Panel: Login Form ─── */}
      <div className="w-full lg:w-[500px] xl:w-[600px] flex items-center justify-center p-8 lg:p-12 xl:p-24">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-[400px]"
        >
          <div className="mb-12 text-center lg:text-left">
            <h2 className="text-[40px] font-['Playfair_Display'] font-bold text-[#1A1A1A] leading-tight mb-3">
              Admin Sign In
            </h2>
            <p className="text-gray-500 font-medium">Access your administrative command center.</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[14px] font-semibold flex items-center gap-3"
              >
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-5 bg-[#F8F7F5] border-2 border-transparent rounded-2xl focus:border-[#BC9B7A]/30 focus:bg-white transition-all outline-none font-semibold text-[#1A1A1A]"
                  placeholder="admin@livoraa.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Access Key
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-5 bg-[#F8F7F5] border-2 border-transparent rounded-2xl focus:border-[#BC9B7A]/30 focus:bg-white transition-all outline-none font-semibold text-[#1A1A1A]"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#1A1A1A] hover:bg-[#2C1810] text-white py-5 rounded-2xl text-[15px] font-bold tracking-widest uppercase shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loginLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                'Initialize Session'
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-gray-400 text-sm font-medium">
            Authorized Personnel Only • IP Logged
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
