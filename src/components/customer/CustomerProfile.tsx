import React, { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLock,
  FiEdit3,
  FiCheckCircle,
  FiInfo,
  FiZap
} from 'react-icons/fi';

type FirestoreData = {
  [key: string]: any;
};

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const CustomerProfile: React.FC = () => {
  const [profile, setProfile] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Password state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'customers', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        let formattedAddress = '';

        // Handle address object from Firestore
        if (data.address && typeof data.address === 'object') {
          const { street, city, state, pincode } = data.address;
          formattedAddress = [street, city, state, pincode].filter(Boolean).join(', ');
        } else {
          formattedAddress = data.address || '';
        }

        setProfile({
          name: data.name || user.displayName || user.email?.split('@')[0] || 'Customer',
          email: data.email || user.email || '',
          phone: data.phone || '',
          address: formattedAddress
        });
      } else {
        setProfile({
          name: user.displayName || user.email?.split('@')[0] || 'Customer',
          email: user.email || '',
          phone: '',
          address: ''
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'customers', user.uid);
      await updateDoc(docRef, profile as FirestoreData);

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error("New passwords don't match");
    }
    if (passwords.new.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setPasswordLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) return;

      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.new);

      toast.success('Password updated successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-[#A78B6A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#A78B6A] rounded-[32px] p-8 md:p-12 text-white shadow-xl shadow-[#A78B6A]/20"
      >
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
          <div className="relative">
            <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-4xl font-bold border border-white/20">
              {profile.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#22C55E] rounded-full border-4 border-[#A78B6A] flex items-center justify-center">
              <FiCheckCircle size={14} className="text-white" />
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <h2 className="text-4xl font-bold">{profile.name}</h2>
              <FiZap className="text-yellow-300 fill-yellow-300" size={24} />
            </div>
            <p className="text-white/70 font-medium mb-4">Customer Portal</p>
            <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold border border-white/20 uppercase tracking-widest">
              Premium Member
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="w-full bg-white text-[#A78B6A] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-lg"
        >
          <FiEdit3 size={18} />
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="p-8 border-b border-gray-50 bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#A78B6A]/10 text-[#A78B6A] rounded-xl flex items-center justify-center">
                <FiUser size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                <p className="text-xs text-gray-400 font-medium">Update your personal details and information</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <FiUser size={12} className="text-[#A78B6A]" /> Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#A78B6A]/20 focus:border-[#A78B6A] transition-all disabled:opacity-60"
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <FiMail size={12} className="text-[#A78B6A]" /> Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-gray-50 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium disabled:opacity-60 pr-12"
                  />
                  <FiCheckCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">* Email address is verified and cannot be modified</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <FiPhone size={12} className="text-[#A78B6A]" /> Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full bg-gray-50 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#A78B6A]/20 focus:border-[#A78B6A] transition-all disabled:opacity-60"
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <FiMapPin size={12} className="text-[#A78B6A]" /> Address
              </label>
              <textarea
                name="address"
                value={profile.address}
                onChange={handleChange}
                disabled={!isEditing}
                rows={3}
                className="w-full bg-gray-50 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#A78B6A]/20 focus:border-[#A78B6A] transition-all disabled:opacity-60 resize-none"
                placeholder="Enter your full address"
              />
            </div>

            {isEditing && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                type="submit"
                className="w-full bg-[#A78B6A] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#A78B6A]/30 hover:bg-[#8D7456] transition-all"
              >
                Save Profile Changes
              </motion.button>
            )}
          </form>
        </motion.div>

        {/* Update Password */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="p-8 border-b border-gray-50 bg-[#A78B6A] text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <FiLock size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Update Password</h3>
                <p className="text-xs text-white/70 font-medium">Change your account password for enhanced security</p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePasswordUpdate} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <FiLock size={12} className="text-[#A78B6A]" /> Current Password *
              </label>
              <input
                type="password"
                name="current"
                value={passwords.current}
                onChange={handlePasswordChange}
                required
                className="w-full bg-gray-50 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#A78B6A]/20 focus:border-[#A78B6A] transition-all"
                placeholder="Enter current password"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <FiLock size={12} className="text-[#A78B6A]" /> New Password *
                </label>
                <input
                  type="password"
                  name="new"
                  value={passwords.new}
                  onChange={handlePasswordChange}
                  required
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#A78B6A]/20 focus:border-[#A78B6A] transition-all"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <FiLock size={12} className="text-[#A78B6A]" /> Confirm New Password *
                </label>
                <input
                  type="password"
                  name="confirm"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  required
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-[#A78B6A]/20 focus:border-[#A78B6A] transition-all"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 flex gap-3">
              <FiInfo size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                Password must be at least 6 characters long. Make sure to use a strong password with a mix of letters, numbers, and symbols.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-10 bg-[#A78B6A] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#A78B6A]/30 hover:bg-[#8D7456] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {passwordLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : <FiLock size={18} />}
                Update Password
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerProfile;
