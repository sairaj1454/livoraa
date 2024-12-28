import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface SettingsData {
  companyInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      linkedin: string;
    };
  };
  emailSettings: {
    emailNotifications: boolean;
    notifyOnNewEnquiry: boolean;
    notifyOnProjectUpdate: boolean;
    adminEmails: string[];
  };
  siteSettings: {
    maintenanceMode: boolean;
    showPricing: boolean;
    enableBlog: boolean;
    enableTestimonials: boolean;
    projectsPerPage: number;
  };
}

const defaultSettings: SettingsData = {
  companyInfo: {
    name: 'Virtuous Interiors',
    email: '',
    phone: '',
    address: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      linkedin: ''
    }
  },
  emailSettings: {
    emailNotifications: true,
    notifyOnNewEnquiry: true,
    notifyOnProjectUpdate: true,
    adminEmails: []
  },
  siteSettings: {
    maintenanceMode: false,
    showPricing: true,
    enableBlog: true,
    enableTestimonials: true,
    projectsPerPage: 10
  }
};

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'email' | 'site'>('company');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as SettingsData);
        } else {
          // Initialize settings if they don't exist
          await updateDoc(doc(db, 'settings', 'general'), {
            companyInfo: defaultSettings.companyInfo,
            emailSettings: defaultSettings.emailSettings,
            siteSettings: defaultSettings.siteSettings,
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'general'), {
        companyInfo: settings.companyInfo,
        emailSettings: settings.emailSettings,
        siteSettings: settings.siteSettings,
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdminEmail = () => {
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (settings.emailSettings.adminEmails.includes(newAdminEmail)) {
      toast.error('This email is already added');
      return;
    }
    setSettings(prev => ({
      ...prev,
      emailSettings: {
        ...prev.emailSettings,
        adminEmails: [...prev.emailSettings.adminEmails, newAdminEmail]
      }
    }));
    setNewAdminEmail('');
  };

  const handleRemoveAdminEmail = (email: string) => {
    setSettings(prev => ({
      ...prev,
      emailSettings: {
        ...prev.emailSettings,
        adminEmails: prev.emailSettings.adminEmails.filter(e => e !== email)
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ToastContainer position="bottom-right" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your website settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'company', name: 'Company Info' },
            { id: 'email', name: 'Email Settings' },
            { id: 'site', name: 'Site Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Company Info Settings */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                value={settings.companyInfo.name}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  companyInfo: { ...prev.companyInfo, name: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={settings.companyInfo.email}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  companyInfo: { ...prev.companyInfo, email: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={settings.companyInfo.phone}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  companyInfo: { ...prev.companyInfo, phone: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                value={settings.companyInfo.address}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  companyInfo: { ...prev.companyInfo, address: e.target.value }
                }))}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Social Media Links</h3>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(settings.companyInfo.socialMedia).map(([platform, url]) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {platform}
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        companyInfo: {
                          ...prev.companyInfo,
                          socialMedia: {
                            ...prev.companyInfo.socialMedia,
                            [platform]: e.target.value
                          }
                        }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Configure how you receive email notifications</p>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailSettings.emailNotifications}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      emailSettings: {
                        ...prev.emailSettings,
                        emailNotifications: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <div className="ml-4 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.emailSettings.notifyOnNewEnquiry}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    emailSettings: {
                      ...prev.emailSettings,
                      notifyOnNewEnquiry: e.target.checked
                    }
                  }))}
                  disabled={!settings.emailSettings.emailNotifications}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Notify on new enquiry
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.emailSettings.notifyOnProjectUpdate}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    emailSettings: {
                      ...prev.emailSettings,
                      notifyOnProjectUpdate: e.target.checked
                    }
                  }))}
                  disabled={!settings.emailSettings.emailNotifications}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Notify on project updates
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Admin Emails</h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Add admin email"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button
                onClick={handleAddAdminEmail}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {settings.emailSettings.adminEmails.map((email) => (
                <div key={email} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <span className="text-sm text-gray-600">{email}</span>
                  <button
                    onClick={() => handleRemoveAdminEmail(email)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Site Settings */}
      {activeTab === 'site' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Maintenance Mode</h3>
                <p className="text-sm text-gray-500">
                  When enabled, the site will show a maintenance page to visitors
                </p>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.siteSettings.maintenanceMode}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      siteSettings: {
                        ...prev.siteSettings,
                        maintenanceMode: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Show Pricing</h3>
                <p className="text-sm text-gray-500">
                  Display pricing information on the website
                </p>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.siteSettings.showPricing}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      siteSettings: {
                        ...prev.siteSettings,
                        showPricing: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Enable Blog</h3>
                <p className="text-sm text-gray-500">
                  Show blog section on the website
                </p>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.siteSettings.enableBlog}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      siteSettings: {
                        ...prev.siteSettings,
                        enableBlog: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Enable Testimonials</h3>
                <p className="text-sm text-gray-500">
                  Show testimonials section on the website
                </p>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.siteSettings.enableTestimonials}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      siteSettings: {
                        ...prev.siteSettings,
                        enableTestimonials: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Projects Per Page
              </label>
              <select
                value={settings.siteSettings.projectsPerPage}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  siteSettings: {
                    ...prev.siteSettings,
                    projectsPerPage: Number(e.target.value)
                  }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {[5, 10, 15, 20, 25, 30].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
