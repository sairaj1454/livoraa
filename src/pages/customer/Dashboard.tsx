import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiLayout,
  FiUser,
  FiBriefcase,
  FiFileText,
  FiMessageSquare,
  FiLogOut,
  FiBell,
  FiSearch,
  FiFolder,
  FiClipboard,
  FiMenu,
  FiX
} from 'react-icons/fi';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import CustomerProfile from '../../components/customer/CustomerProfile';
import CustomerProjects from '../../components/customer/CustomerProjects';
import CustomerQuotations from '../../components/customer/CustomerQuotations';
import CustomerEnquiries from '../../components/customer/CustomerEnquiries';
import NotificationPanel from '../../components/customer/NotificationPanel';

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [stats, setStats] = useState({
    projects: 0,
    quotations: 0,
    enquiries: 0,
    notifications: 0
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Sync tab with URL
    const pathParts = location.pathname.split('/');
    const tabFromPath = pathParts[pathParts.length - 1];
    if (navigationItems.some(item => item.id === tabFromPath)) {
      setActiveTab(tabFromPath);
    } else if (tabFromPath === 'dashboard' || pathParts.length <= 3) {
      setActiveTab('dashboard');
    }

    fetchStats();

    // Real-time notifications listener
    const user = auth.currentUser;
    if (user) {
      const q = query(
        collection(db, 'notifications'),
        where('userEmail', '==', user.email),
        where('read', '==', false)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setStats(prev => ({ ...prev, notifications: snapshot.size }));
      });
      return () => unsubscribe();
    }
  }, [auth.currentUser]);

  const fetchStats = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Fetch projects count
      const projectsQuery = query(collection(db, 'projects'), where('clientEmail', '==', user.email));
      const projectsSnap = await getDocs(projectsQuery);

      // Fetch enquiries count
      const enquiriesQuery = query(collection(db, 'enquiries'), where('email', '==', user.email));
      const enquiriesSnap = await getDocs(enquiriesQuery);

      setStats(prev => ({
        ...prev,
        projects: projectsSnap.size,
        enquiries: enquiriesSnap.size,
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/customer/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: FiLayout },
    { id: 'profile', name: 'My Profile', icon: FiUser },
    { id: 'projects', name: 'My Projects', icon: FiBriefcase },
    { id: 'quotations', name: 'Quotations', icon: FiFileText },
    { id: 'enquiries', name: 'My Enquiries', icon: FiMessageSquare },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Welcome Hero Section */}
            <div className="relative overflow-hidden bg-[#A78B6A] rounded-3xl p-10 text-white shadow-xl shadow-[#A78B6A]/20 transition-all duration-300">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                  <img src="/images/logo.png" alt="Logo" className="w-14 h-14 brightness-0 invert opacity-90" />
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-4xl lg:text-5xl font-bold mb-2">Welcome back!</h2>
                  <p className="text-white/80 text-lg lg:text-xl font-light">Manage your interior design projects with ease.</p>
                </div>
              </div>
              {/* Decorative Background Circles */}
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-20%] left-[20%] w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Active Projects', value: stats.projects, icon: FiFolder, color: 'bg-blue-500', badge: 'Active', badgeColor: 'bg-blue-50 text-blue-600' },
                { label: 'Quotations', value: stats.quotations, icon: FiFileText, color: 'bg-green-500', badge: 'Total', badgeColor: 'bg-green-50 text-green-600' },
                { label: 'Enquiries', value: stats.enquiries, icon: FiMessageSquare, color: 'bg-amber-500', badge: 'Open', badgeColor: 'bg-amber-50 text-amber-600' },
                { label: 'Notifications', value: stats.notifications, icon: FiBell, color: 'bg-purple-500', badge: 'New', badgeColor: 'bg-purple-50 text-purple-600' },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${stat.badgeColor}`}>
                    {stat.badge}
                  </div>
                  <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-${stat.color.split('-')[1]}-100`}>
                    <stat.icon size={26} />
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-4xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
              <CustomerProjects />
            </div>
          </motion.div>
        );
      case 'profile':
        return <CustomerProfile />;
      case 'projects':
        return (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <CustomerProjects />
          </div>
        );
      case 'quotations':
        return <CustomerQuotations />;
      case 'enquiries':
        return <CustomerEnquiries />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFCFB] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="px-6 py-8 pb-4">
            <div className="flex items-center gap-4">
              <img src="/images/logo.png" alt="Livoraa Logo" className="w-10 h-10 object-contain flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <h1 className="text-xl font-bold text-gray-900 leading-tight tracking-tight whitespace-nowrap">
                  LIVORAA ATELIER
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#A78B6A] font-extrabold -mt-0.5">
                  Customer Portal
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-none">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  navigate(`/customer/dashboard/${item.id}`);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-medium transition-all duration-300
                  ${activeTab === item.id
                    ? 'bg-[#A78B6A] text-white shadow-xl shadow-[#A78B6A]/30 translate-x-1'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-gray-400'} />
                {item.name}
              </button>
            ))}
          </nav>

          {/* User Section & Logout */}
          <div className="p-6 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-300 group"
            >
              <FiLogOut size={20} className="group-hover:rotate-180 transition-transform duration-500" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 md:px-10 flex-shrink-0 z-40">
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 px-5 py-3 rounded-2xl w-96 hidden md:flex ring-0 focus-within:ring-2 focus-within:ring-[#A78B6A]/20 focus-within:border-[#A78B6A] transition-all">
            <FiSearch size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search projects, quotes..."
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`relative p-3 rounded-2xl transition-all ${isNotificationOpen ? 'text-[#A78B6A] bg-[#A78B6A]/5' : 'text-gray-400 hover:text-[#A78B6A] hover:bg-gray-50'
                  }`}
              >
                <FiBell size={22} />
                {stats.notifications > 0 && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
              <NotificationPanel
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
              />
            </div>
            <div className="h-10 w-[1px] bg-gray-200"></div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 group-hover:text-[#A78B6A] transition-colors">{auth.currentUser?.email?.split('@')[0]}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Project Owner</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#A78B6A] flex items-center justify-center text-white font-bold shadow-lg shadow-[#A78B6A]/30 group-hover:scale-105 transition-transform font-sans">
                {auth.currentUser?.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#FDFCFB] relative">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#A78B6A]/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none -z-10"></div>
      </div>

      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed bottom-8 right-8 w-16 h-16 bg-[#A78B6A] text-white rounded-2xl shadow-2xl flex items-center justify-center z-[60] hover:scale-110 active:scale-95 transition-all"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>
    </div>
  );
};

export default CustomerDashboard;
