import { useState } from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import GalleryUpload from '../../components/GalleryUpload';
import GalleryManager from '../../components/GalleryManager';
import EnquiriesManager from '../../components/EnquiriesManager';
import BlogUpload from '../../components/BlogUpload';
import BlogManager from '../../components/BlogManager';
import TestimonialManager from '../../components/TestimonialManager';
import ProjectUpload from '../../components/ProjectUpload';
import CustomerCreation from '../../components/CustomerCreation';
import CustomerDatabase from '../../components/CustomerDatabase';
import EmailCampaign from '../../components/EmailCampaign';
import ProjectOverview from '../../components/ProjectOverview';
import EmployeeManager from '../../components/EmployeeManager';
import Settings from '../../components/Settings';
import QuotationGenerator from '../../components/QuotationGenerator';
import ReceiptGenerator from '../../components/ReceiptGenerator';
import PersonalizedRequestsManager from '../../components/PersonalizedRequestsManager';
import ClientEnquiriesManager from '../../components/ClientEnquiriesManager';
import { useDashboardData } from '../../hooks/useDashboardData';
import {
  HomeIcon,
  PhotoIcon,
  UserGroupIcon,
  NewspaperIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  UsersIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ReceiptRefundIcon,
  UserPlusIcon,
  ChatBubbleLeftIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { data, loading, error } = useDashboardData();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
    { id: 'projects', name: 'Upload Project', icon: BriefcaseIcon },
    { id: 'project-overview', name: 'Project Overview', icon: ChartBarIcon },
    { id: 'gallery', name: 'Gallery', icon: PhotoIcon },
    { id: 'enquiries', name: 'Enquiries', icon: EnvelopeIcon },
    { id: 'personalized-requests', name: 'Personalized Requests', icon: SparklesIcon },
    { id: 'client-enquiries', name: 'Client Enquiries', icon: ChatBubbleLeftRightIcon },
    { id: 'create-customer', name: 'Create Customer', icon: UserPlusIcon },
    { id: 'customers', name: 'Customer Database', icon: UserGroupIcon },
    { id: 'employees', name: 'Employees', icon: UsersIcon },
    { id: 'blog', name: 'Blog', icon: NewspaperIcon },
    { id: 'testimonials', name: 'Testimonials', icon: ChatBubbleLeftIcon },
    { id: 'quotation', name: 'Generate Quotation', icon: DocumentTextIcon },

    { id: 'receipt', name: 'Generate Receipt', icon: ReceiptRefundIcon },
    { id: 'customer-login-link', name: 'Customer Login', icon: UsersIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'customer-login-link') {
      window.open('/customer/login', '_blank');
      return;
    }
    setActiveTab(id);
  };

  const stats = [
    { name: 'Total Projects', value: data.totalProjects.toString(), icon: BriefcaseIcon },
    { name: 'Active Projects', value: data.totalInProgressProjects.toString(), icon: ChartBarIcon },
    { name: 'Team Members', value: data.teamMembers.toString(), icon: UserGroupIcon },
    { name: 'Blog Posts', value: data.totalBlogs.toString(), icon: NewspaperIcon },
  ];

  const formatDate = (date: string) => {
    if (!date) return 'No date set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const recentProjects = data.recentProjects.map(project => ({
    name: project.title,
    status: project.status,
    date: formatDate(project.dueDate)
  }));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-4 md:p-8 space-y-8">
            {/* Gradient Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-gradient-to-r from-[#4E67E8] via-[#8B5CF6] to-[#D946EF] rounded-3xl p-8 md:p-12 shadow-2xl"
            >
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="text-white">
                  <h2 className="text-4xl md:text-5xl font-bold mb-2">Welcome back, Admin</h2>
                  <p className="text-indigo-100 text-lg opacity-90">Here's your LIVORAA ATELIER dashboard overview</p>
                </div>
                <div className="bg-white/20 p-5 rounded-3xl backdrop-blur-md">
                  <HomeIcon className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="absolute top-0 right-0 -transtale-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'TOTAL PROJECTS', value: data.totalProjects, icon: BriefcaseIcon, color: 'border-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
                { name: 'ACTIVE PROJECTS', value: data.totalInProgressProjects, icon: ChartBarIcon, color: 'border-purple-500', iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
                { name: 'TEAM MEMBERS', value: data.teamMembers, icon: UsersIcon, color: 'border-green-500', iconBg: 'bg-green-50', iconColor: 'text-green-500' },
                { name: 'BLOG POSTS', value: data.totalBlogs, icon: NewspaperIcon, color: 'border-orange-500', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-2xl p-6 shadow-sm border-t-4 ${stat.color} flex items-center justify-between hover:shadow-md transition-all`}
                >
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.iconBg} p-4 rounded-2xl`}>
                    <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Projects Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl">
                  <BriefcaseIcon className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Recent Projects</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {data.recentProjects.slice(0, 5).map((project, index) => (
                  <div key={index} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
                        {project.title.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">{project.title}</h4>
                        <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <DocumentTextIcon className="w-4 h-4" />
                          Due {formatDate(project.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="bg-green-100 text-green-600 px-4 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2 border border-green-200">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        );
      case 'projects':
        return <ProjectUpload />;
      case 'project-overview':
        return <ProjectOverview />;
      case 'gallery':
        return (
          <>
            <GalleryUpload />
            <GalleryManager />
          </>
        );
      case 'enquiries':
        return <EnquiriesManager />;
      case 'personalized-requests':
        return <PersonalizedRequestsManager />;
      case 'client-enquiries':
        return <ClientEnquiriesManager />;
      case 'create-customer':
        return <CustomerCreation />;
      case 'customers':
        return <CustomerDatabase />;
      case 'employees':
        return <EmployeeManager />;
      case 'blog':
        return (
          <>
            <BlogUpload />
            <BlogManager />
          </>
        );
      case 'testimonials':
        return <TestimonialManager />;
      case 'quotation':
        return <QuotationGenerator />;

      case 'receipt':
        return <ReceiptGenerator />;
      case 'settings':
        return <Settings />;
      default:
        return <div>Invalid tab</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button and header */}
      <div className="lg:hidden fixed top-0 left-0 z-40 w-full bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
            <h1 className="ml-3 text-lg font-bold text-indigo-600">LIVORAA ATELIER</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-red-600 hover:text-red-700 focus:outline-none"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`absolute inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl transform transition-transform ease-in-out duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {/* Close button */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="h-full flex flex-col">
            {/* Mobile menu header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h1 className="text-lg font-bold text-indigo-600">LIVORAA ATELIER</h1>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto mt-14">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleNavClick(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-3 text-base font-medium rounded-lg transition-colors ${activeTab === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-900 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                >
                  <item.icon
                    className={`mr-4 h-6 w-6 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'
                      }`}
                  />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-gray-200">
              <h1 className="text-xl font-bold text-indigo-600">LIVORAA ATELIER</h1>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 bg-white space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${activeTab === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'
                        }`}
                    />
                    {item.name}
                  </button>
                ))}
              </nav>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <button
                  onClick={handleSignOut}
                  className="flex-shrink-0 w-full group block"
                >
                  <div className="flex items-center">
                    <ArrowLeftOnRectangleIcon className="inline-block h-6 w-6 text-red-400 group-hover:text-red-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-600 group-hover:text-red-700">
                        Sign Out
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="py-6 px-4 sm:px-6 lg:px-8 mt-16 lg:mt-0">
          <main className="flex-1 overflow-y-auto">{renderContent()}</main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
