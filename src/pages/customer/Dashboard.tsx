import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UserIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import CustomerProfile from '../../components/customer/CustomerProfile';
import CustomerProjects from '../../components/customer/CustomerProjects';
import CustomerQuotations from '../../components/customer/CustomerQuotations';
import CustomerEnquiries from '../../components/customer/CustomerEnquiries';

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/customer/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
    { id: 'profile', name: 'My Profile', icon: UserIcon },
    { id: 'projects', name: 'My Projects', icon: ClipboardDocumentListIcon },
    { id: 'quotations', name: 'Quotations', icon: DocumentTextIcon },
    { id: 'enquiries', name: 'My Enquiries', icon: ChatBubbleLeftIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Welcome back!</h2>
              <p className="mt-1 text-sm text-gray-600">Here's an overview of your projects and activities.</p>
            </div>
            <CustomerProjects />
          </div>
        );
      case 'profile':
        return <CustomerProfile />;
      case 'projects':
        return <CustomerProjects />;
      case 'quotations':
        return <CustomerQuotations />;
      case 'enquiries':
        return <CustomerEnquiries />;
      default:
        return null;
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
            <h1 className="ml-3 text-lg font-bold text-indigo-600">Customer Portal</h1>
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
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`absolute inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        <div
          className={`absolute inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl transform transition-transform ease-in-out duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col pt-16">
            <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-3 text-base font-medium rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-900 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <item.icon
                    className={`mr-4 h-6 w-6 flex-shrink-0 ${
                      activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'
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
              <h1 className="text-xl font-bold text-indigo-600">Customer Portal</h1>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 bg-white space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full ${
                      activeTab === item.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'
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
          <main className="flex-1 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
