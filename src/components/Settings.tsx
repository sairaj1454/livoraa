import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as updateAuthPassword
} from 'firebase/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  LockClosedIcon,
  BuildingOfficeIcon,
  InformationCircleIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  gstNumber: string;
  address: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    linkedin: string;
  };
}

interface EmailSettings {
  emailNotifications: boolean;
  notifyOnNewEnquiry: boolean;
  notifyOnProjectUpdate: boolean;
  adminEmails: string[];
}

interface SiteSettings {
  maintenanceMode: boolean;
  showPricing: boolean;
  enableBlog: boolean;
  enableTestimonials: boolean;
  projectsPerPage: number;
}

interface SettingsData {
  companyInfo: CompanyInfo;
  emailSettings: EmailSettings;
  siteSettings: SiteSettings;
  quotationTerms: string[];
}

const defaultSettings: SettingsData = {
  companyInfo: {
    name: 'LIVORAA ATELIER',
    email: 'livoraaatelier@gmail.com',
    phone: '+91-9000191496',
    gstNumber: '36AAMFL7643J1ZS',
    address: 'Kukatpally, Hyderabad, India',
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
    adminEmails: ['livoraaatelier@gmail.com']
  },
  siteSettings: {
    maintenanceMode: false,
    showPricing: true,
    enableBlog: true,
    enableTestimonials: true,
    projectsPerPage: 10
  },
  quotationTerms: [
    'Applicable taxes will be extra.',
    'Work will resume after advance payment.',
    'This quotation is an initial estimate and is valid till 60 days.',
    'The exact price of your project will depend on measurements, scope of work and change in designs/ material / finishes. Based on these revisions, you can expect the quote to raise or drop approximately 10-15%. To move forward with the project, you will have to pay 60% of the charges + 60% working charges, you will have to pay (60% + 50%) + 10% of this estimate as a non-refundable advance.',
    '60% of the interior work amount to be paid at the time of the Order Raising.',
    '95% of the interior work amount to be paid before material delivery at site.',
    '100% of the interior work amount to be paid before handles, mirrors and profiles shutters dispatch to site.',
    'Once carpentry boxing work and false ceiling work completed without any complete final finishing, any changes in works (extra charges).',
    'For any enquiry, reach out via email livoraaatelier@gmail.com, call on +91 90001 91496',
  ]
};

// ─── Component ────────────────────────────────────────────────────────────────

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings({
            companyInfo: { ...defaultSettings.companyInfo, ...data.companyInfo },
            emailSettings: { ...defaultSettings.emailSettings, ...data.emailSettings },
            siteSettings: { ...defaultSettings.siteSettings, ...data.siteSettings },
            quotationTerms: data.quotationTerms || defaultSettings.quotationTerms,
          });
        } else {
          await setDoc(doc(db, 'settings', 'general'), defaultSettings);
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

  const handleSave = async (section: keyof SettingsData) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'general'), {
        [section]: settings[section],
      });
      toast.success(`${section.replace(/([A-Z])/g, ' $1').trim()} updated successfully`);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error('User not authenticated');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updateAuthPassword(user, newPassword);

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password update error:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect current password');
      } else {
        toast.error('Failed to update password. Please try again.');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const addAdminEmail = () => {
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      toast.warning('Enter a valid email');
      return;
    }
    if (settings.emailSettings.adminEmails.includes(newAdminEmail)) {
      toast.info('Email already added');
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

  const removeAdminEmail = (email: string) => {
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const inputCls = "w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-gray-700 placeholder:text-gray-300";
  const labelCls = "block text-xs font-black text-gray-400 uppercase tracking-[0.15em] mb-2 px-1";
  const cardCls = "bg-white rounded-[2.5rem] shadow-2xl shadow-gray-100 overflow-hidden border border-gray-50";

  return (
    <div className="pb-20 max-w-4xl mx-auto space-y-12">
      <ToastContainer position="bottom-right" />

      {/* ─── Update Password Card ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
        <div className="bg-gradient-to-r from-pink-600 to-rose-500 p-10 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <LockClosedIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Security Settings</h2>
              <p className="text-pink-100 font-medium opacity-80">Update your account password and security preferences</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="p-10 space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <div>
              <label className={labelCls}>Current Password</label>
              <input type="password" className={inputCls} placeholder="Enter your current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={labelCls}>New Password</label>
                <input type="password" className={inputCls} placeholder="Minimum 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <input type="password" className={inputCls} placeholder="Confirm your new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 mt-0.5" />
            <p className="text-xs font-bold text-amber-700 leading-relaxed italic">
              Note: You will be required to log in again with your new password for all active sessions.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isUpdatingPassword} className="bg-rose-500 hover:bg-rose-600 text-white px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-rose-100 transition-all flex items-center gap-3 disabled:opacity-50">
              {isUpdatingPassword ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <CheckIcon className="w-5 h-5" />}
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* ─── Company Settings Card ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cardCls}>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-10 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <BuildingOfficeIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Company Branding</h2>
              <p className="text-indigo-100 font-medium opacity-80">This information will appear on all generated quotations and receipts</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 gap-8">
            <div>
              <label className={labelCls}>Organization Name *</label>
              <input type="text" className={inputCls} value={settings.companyInfo.name} onChange={(e) => setSettings(p => ({ ...p, companyInfo: { ...p.companyInfo, name: e.target.value } }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={labelCls}>Public Email *</label>
                <input type="email" className={inputCls} value={settings.companyInfo.email} onChange={(e) => setSettings(p => ({ ...p, companyInfo: { ...p.companyInfo, email: e.target.value } }))} />
              </div>
              <div>
                <label className={labelCls}>Business Phone *</label>
                <input type="tel" className={inputCls} value={settings.companyInfo.phone} onChange={(e) => setSettings(p => ({ ...p, companyInfo: { ...p.companyInfo, phone: e.target.value } }))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Government GST Number</label>
              <input type="text" className={inputCls} value={settings.companyInfo.gstNumber} onChange={(e) => setSettings(p => ({ ...p, companyInfo: { ...p.companyInfo, gstNumber: e.target.value } }))} />
            </div>
            <div>
              <label className={labelCls}>Registered Address *</label>
              <textarea className={`${inputCls} min-h-[100px] resize-none`} value={settings.companyInfo.address} onChange={(e) => setSettings(p => ({ ...p, companyInfo: { ...p.companyInfo, address: e.target.value } }))} />
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => handleSave('companyInfo')} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center gap-3">
              {saving ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <CheckIcon className="w-5 h-5" />}
              Save Branding
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Email Notifications Card ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cardCls}>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-10 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <EnvelopeIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Email System</h2>
              <p className="text-emerald-100 font-medium opacity-80">Configure how and where you receive automated notifications</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-10">
          <div className="space-y-6 bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-gray-700 uppercase text-xs tracking-wider">Main Notifications</h4>
                <p className="text-sm text-gray-400 font-medium">Enable or disable all outgoing system emails</p>
              </div>
              <button onClick={() => setSettings(p => ({ ...p, emailSettings: { ...p.emailSettings, emailNotifications: !p.emailSettings.emailNotifications } }))}
                className={`w-14 h-8 rounded-full transition-all relative ${settings.emailSettings.emailNotifications ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.emailSettings.emailNotifications ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={settings.emailSettings.notifyOnNewEnquiry} onChange={e => setSettings(p => ({ ...p, emailSettings: { ...p.emailSettings, notifyOnNewEnquiry: e.target.checked } }))} className="w-5 h-5 rounded-lg border-gray-200 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm font-bold text-gray-600">Notify on New Enquiry</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={settings.emailSettings.notifyOnProjectUpdate} onChange={e => setSettings(p => ({ ...p, emailSettings: { ...p.emailSettings, notifyOnProjectUpdate: e.target.checked } }))} className="w-5 h-5 rounded-lg border-gray-200 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm font-bold text-gray-600">Notify on Project Update</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className={labelCls}>Recipient Admin Emails</label>
            <div className="flex gap-4">
              <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder="Add another admin email..." className={inputCls} />
              <button onClick={addAdminEmail} className="bg-gray-900 hover:bg-black text-white px-8 rounded-2xl font-black transition-all active:scale-95"><PlusIcon className="w-6 h-6" /></button>
            </div>
            <div className="flex flex-wrap gap-3">
              {settings.emailSettings.adminEmails.map(email => (
                <div key={email} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-gray-600 font-bold text-sm">
                  {email}
                  <button onClick={() => removeAdminEmail(email)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={() => handleSave('emailSettings')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all flex items-center gap-3">
              {saving ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <CheckIcon className="w-5 h-5" />}
              Save Email Config
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Site Management Card ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={cardCls}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-10 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <GlobeAltIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Platform Control</h2>
              <p className="text-amber-100 font-medium opacity-80">Toggle website features and visibility across the platform</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: 'Maintenance Mode', key: 'maintenanceMode', desc: 'Lock the site for public users' },
              { label: 'Display Catalog Pricing', key: 'showPricing', desc: 'Show prices in project gallery' },
              { label: 'Enable Blog Engine', key: 'enableBlog', desc: 'Show testimonials and blog posts' },
              { label: 'Public Reviews', key: 'enableTestimonials', desc: 'Allow clients to see testimonials' }
            ].map(item => (
              <div key={item.key} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-gray-700 text-[10px] uppercase tracking-wider">{item.label}</h4>
                  <p className="text-xs text-gray-400 mt-1 font-medium">{item.desc}</p>
                </div>
                <button onClick={() => setSettings(p => ({ ...p, siteSettings: { ...p.siteSettings, [item.key]: !(p.siteSettings as any)[item.key] } }))}
                  className={`w-12 h-7 rounded-full transition-all relative ${(settings.siteSettings as any)[item.key] ? 'bg-amber-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${(settings.siteSettings as any)[item.key] ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-8 bg-amber-50/50 rounded-3xl border border-amber-100/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg text-white"><InformationCircleIcon className="w-5 h-5" /></div>
              <span className="text-sm font-black text-amber-900 uppercase tracking-widest">Projects Per Page</span>
            </div>
            <select value={settings.siteSettings.projectsPerPage} onChange={e => setSettings(p => ({ ...p, siteSettings: { ...p.siteSettings, projectsPerPage: Number(e.target.value) } }))}
              className="bg-white border-2 border-amber-200 rounded-xl px-4 py-2 font-bold text-amber-900 focus:ring-4 focus:ring-amber-500/10 outline-none">
              {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} Projects</option>)}
            </select>
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={() => handleSave('siteSettings')} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-amber-100 transition-all flex items-center gap-3">
              {saving ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <CheckIcon className="w-5 h-5" />}
              Save Site Config
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Quotation Terms Card ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={cardCls}>
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-10 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <DocumentTextIcon className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Master Terms & Conditions</h2>
              <p className="text-gray-400 font-medium opacity-80">Default T&C that populate every new quotation automatically</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="space-y-4">
            {settings.quotationTerms.map((term, index) => (
              <div key={index} className="flex gap-4 group">
                <div className="flex-1">
                  <textarea
                    className={`${inputCls} min-h-[60px] py-3 text-sm resize-none`}
                    value={term}
                    onChange={(e) => {
                      const newTerms = [...settings.quotationTerms];
                      newTerms[index] = e.target.value;
                      setSettings(p => ({ ...p, quotationTerms: newTerms }));
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const newTerms = settings.quotationTerms.filter((_, i) => i !== index);
                      setSettings(p => ({ ...p, quotationTerms: newTerms }));
                    }}
                    className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 items-center pt-4 border-t border-gray-50">
            <button
              onClick={() => setSettings(p => ({ ...p, quotationTerms: [...p.quotationTerms, ''] }))}
              className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-indigo-800 transition-all"
            >
              <PlusIcon className="w-5 h-5" /> Add New Term
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => handleSave('quotationTerms')}
              disabled={saving}
              className="bg-gray-900 hover:bg-black text-white px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-gray-100 transition-all flex items-center gap-3"
            >
              {saving ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <CheckIcon className="w-5 h-5" />}
              Save Master Terms
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
