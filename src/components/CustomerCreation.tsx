import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, getAuth, setPersistence, inMemoryPersistence, signOut } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { toast } from 'react-toastify';
import {
  UserPlusIcon, KeyIcon, PhoneIcon, EnvelopeIcon, HomeIcon, UserIcon,
  ClipboardDocumentIcon, TrashIcon, EyeIcon, EyeSlashIcon
} from '@heroicons/react/24/outline';
import emailjs from '@emailjs/browser';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

interface SavedCredential {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

const CustomerCreation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'credentials'>('create');
  const [sendEmail, setSendEmail] = useState(true);
  const [formData, setFormData] = useState<CustomerData & { password: string }>({
    name: '',
    email: '',
    phone: '',
    address: { street: '', city: '', state: '', pincode: '' },
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState<SavedCredential[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  const fetchSavedCredentials = async () => {
    setLoadingCredentials(true);
    try {
      const snapshot = await getDocs(collection(db, 'savedCredentials'));
      const creds: SavedCredential[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<SavedCredential, 'id'>)
      }));
      setSavedCredentials(creds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        toast.warning('Firestore rules not deployed yet. Please publish rules in Firebase Console.');
      } else {
        console.error('Error fetching credentials:', err);
      }
    } finally {
      setLoadingCredentials(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'credentials') {
      fetchSavedCredentials();
    }
  }, [activeTab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (['street', 'city', 'state', 'pincode'].includes(name)) {
      setFormData(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Declare outside try so finally can clean up
    let secondaryApp: any = null;

    try {
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      };

      const secondaryAppName = `cc-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      await setPersistence(secondaryAuth, inMemoryPersistence);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      await signOut(secondaryAuth);

      await setDoc(doc(db, 'customers', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.address.street,
          city: formData.address.city,
          state: formData.address.state,
          pincode: formData.address.pincode
        },
        createdAt: new Date().toISOString(),
        role: 'customer'
      });

      if (sendEmail) {
        // Send login credentials via EmailJS
        try {
          const emailResponse = await emailjs.send(
            'service_gb9ynff',
            'template_tdinqgr',
            {
              to_email: formData.email,
              name: formData.name,
              from_name: 'LIVORAA ATELIER',
              reply_to: 'livoraaatelier@gmail.com',
              message: `Dear ${formData.name},\n\nWelcome to LIVORAA ATELIER! Your account has been created successfully.\n\nHere are your login credentials:\n\nEmail: ${formData.email}\nPassword: ${formData.password}\nPhone: ${formData.phone}\n\nYou can login at: ${window.location.origin}/customer/login\n\nPlease keep these credentials safe and change your password after your first login.\n\nBest regards,\nTeam LIVORAA ATELIER`
            },
            'oOOOitjU95GaDU0hL'
          );
          if (emailResponse.status === 200) {
            toast.success('Login credentials sent to customer email');
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          toast.warning('Account created but failed to send credentials email');
        }
      } else {
        // Save credentials in Firestore for admin reference
        await addDoc(collection(db, 'savedCredentials'), {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          createdAt: new Date().toISOString(),
        });
        toast.info('Credentials saved in the Credentials tab (email not sent)');
      }

      toast.success('Customer account created successfully');
      setFormData({
        name: '', email: '', phone: '',
        address: { street: '', city: '', state: '', pincode: '' },
        password: ''
      });

    } catch (err: any) {
      toast.error(err.message || 'Failed to create customer account');
    } finally {
      setLoading(false);
      // Cleanup: delete the temporary secondary app exactly once
      try {
        if (secondaryApp) {
          await deleteApp(secondaryApp);
        }
      } catch (_) { /* already cleaned up, ignore */ }
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const deleteCredential = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'savedCredentials', id));
      setSavedCredentials(prev => prev.filter(c => c.id !== id));
      toast.success('Credential deleted');
    } catch (err) {
      toast.error('Failed to delete credential');
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-100 mb-4">
            <UserPlusIcon className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-500 mt-1">Create accounts and manage credentials</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'create'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Create Customer
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'credentials'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Saved Credentials {savedCredentials.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{savedCredentials.length}</span>
            )}
          </button>
        </div>

        {/* --- CREATE TAB --- */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Email Toggle Banner */}
            <div className={`px-6 py-4 flex items-center justify-between ${sendEmail ? 'bg-green-50 border-b border-green-100' : 'bg-amber-50 border-b border-amber-100'}`}>
              <div>
                <p className={`text-sm font-bold ${sendEmail ? 'text-green-800' : 'text-amber-800'}`}>
                  {sendEmail ? '📧 Send Credentials via Email' : '🔒 Save Credentials Locally (No Email)'}
                </p>
                <p className={`text-xs mt-0.5 ${sendEmail ? 'text-green-600' : 'text-amber-600'}`}>
                  {sendEmail
                    ? 'Customer will receive login details by email'
                    : 'Credentials will be saved in the Credentials tab'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSendEmail(!sendEmail)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${sendEmail ? 'bg-green-500' : 'bg-gray-300'
                  }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${sendEmail ? 'translate-x-6' : 'translate-x-1'
                  }`} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required
                    className="block w-full pl-10 pr-4 py-3 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 font-medium"
                    placeholder="Ravi Kumar" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required
                    className="block w-full pl-10 pr-4 py-3 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 font-medium"
                    placeholder="customer@example.com" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6}
                    className="block w-full pl-10 pr-4 py-3 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 font-medium"
                    placeholder="Min. 6 characters" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                    className="block w-full pl-10 pr-4 py-3 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 font-medium"
                    placeholder="+91 98765 43210" />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Address</label>
                <div className="space-y-3">
                  <div className="relative">
                    <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
                    <input type="text" name="street" value={formData.address.street} onChange={handleChange} required
                      className="block w-full pl-10 pr-4 py-3 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 font-medium"
                      placeholder="Street address" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" name="city" value={formData.address.city} onChange={handleChange} required
                      className="py-3 px-4 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 font-medium"
                      placeholder="City" />
                    <input type="text" name="state" value={formData.address.state} onChange={handleChange} required
                      className="py-3 px-4 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 font-medium"
                      placeholder="State" />
                    <input type="text" name="pincode" value={formData.address.pincode} onChange={handleChange} required pattern="[0-9]{6}"
                      className="py-3 px-4 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 font-medium"
                      placeholder="PIN Code" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-60 flex items-center justify-center gap-3 mt-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-5 h-5" />
                    Create Customer
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* --- CREDENTIALS TAB --- */}
        {activeTab === 'credentials' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/60 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-800">Saved Credentials</h2>
                <p className="text-xs text-gray-500 mt-0.5">Credentials saved when email was turned OFF</p>
              </div>
              <button onClick={fetchSavedCredentials}
                className="text-xs text-indigo-600 font-semibold hover:underline">
                Refresh
              </button>
            </div>

            {loadingCredentials ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : savedCredentials.length === 0 ? (
              <div className="text-center py-16 px-6">
                <KeyIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-semibold text-gray-400">No saved credentials</p>
                <p className="text-sm text-gray-300 mt-1">Credentials will appear here when email is turned off during creation</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {savedCredentials.map(cred => (
                  <div key={cred.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800">{cred.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(cred.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="mt-3 space-y-2">
                          {/* Email row */}
                          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            <EnvelopeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 font-medium truncate flex-1">{cred.email}</span>
                            <button onClick={() => copyToClipboard(cred.email, 'Email')}
                              className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                              <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                          {/* Password row */}
                          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            <KeyIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 font-medium flex-1 font-mono">
                              {visiblePasswords[cred.id] ? cred.password : '••••••••'}
                            </span>
                            <button onClick={() => togglePasswordVisibility(cred.id)}
                              className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                              {visiblePasswords[cred.id]
                                ? <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                                : <EyeIcon className="w-4 h-4 text-gray-500" />}
                            </button>
                            <button onClick={() => copyToClipboard(cred.password, 'Password')}
                              className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                              <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => deleteCredential(cred.id)}
                        className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors flex-shrink-0"
                        title="Delete">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerCreation;
