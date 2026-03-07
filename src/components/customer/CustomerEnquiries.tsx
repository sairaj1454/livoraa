import React, { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageSquare,
  FiSend,
  FiClock,
  FiCheckCircle,
  FiEye,
  FiPlus,
  FiX,
  FiInfo,
  FiUser,
  FiHash,
  FiCornerDownRight
} from 'react-icons/fi';

interface Enquiry {
  id: string;
  subject: string;
  message: string;
  status: string;
  date: string;
  response?: string;
  timestamp: any;
}

const CustomerEnquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEnquiryForm, setShowNewEnquiryForm] = useState(false);
  const [newEnquiry, setNewEnquiry] = useState({
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const enquiriesQuery = query(
        collection(db, 'client_enquiries'),
        where('email', '==', user.email)
      );

      const querySnapshot = await getDocs(enquiriesQuery);
      const enquiriesList: Enquiry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        enquiriesList.push({
          id: doc.id,
          subject: data.subject,
          message: data.message,
          status: data.status || 'pending',
          date: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString('en-IN') : 'Recently',
          response: data.response,
          timestamp: data.timestamp
        });
      });

      setEnquiries(enquiriesList.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return dateB - dateA;
      }));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      toast.error('Failed to load enquiries');
      setLoading(false);
    }
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnquiry.subject || !newEnquiry.message) return;

    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const enquiryData = {
        subject: newEnquiry.subject,
        message: newEnquiry.message,
        email: user.email,
        name: user.displayName || user.email?.split('@')[0],
        status: 'pending',
        timestamp: Timestamp.now(),
      };

      await addDoc(collection(db, 'client_enquiries'), enquiryData);

      toast.success('Your message has been sent to our design team');
      setNewEnquiry({ subject: '', message: '' });
      setShowNewEnquiryForm(false);
      fetchEnquiries();
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return { color: 'text-green-600', bg: 'bg-green-50', icon: FiCheckCircle, border: 'border-green-100' };
      case 'pending':
        return { color: 'text-amber-600', bg: 'bg-amber-50', icon: FiClock, border: 'border-amber-100' };
      case 'in progress':
        return { color: 'text-blue-600', bg: 'bg-blue-50', icon: FiEye, border: 'border-blue-100' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', icon: FiInfo, border: 'border-gray-100' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-[#A78B6A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Support & Enquiries</h2>
          <p className="text-gray-400 font-medium mt-1">Direct channel to our interior design specialists</p>
        </div>
        <button
          onClick={() => setShowNewEnquiryForm(true)}
          className="bg-[#A78B6A] text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#A78B6A]/20 hover:bg-[#8D7456] transition-all flex items-center gap-2"
        >
          <FiPlus size={18} /> New Message
        </button>
      </div>

      <AnimatePresence>
        {showNewEnquiryForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="bg-white rounded-[40px] border border-gray-100 shadow-2xl p-8 md:p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6">
              <button
                onClick={() => setShowNewEnquiryForm(false)}
                className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-[#A78B6A]/10 text-[#A78B6A] rounded-2xl flex items-center justify-center">
                <FiSend size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Message to Designer</h3>
            </div>

            <form onSubmit={handleSubmitEnquiry} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                <input
                  type="text"
                  value={newEnquiry.subject}
                  onChange={(e) => setNewEnquiry(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  placeholder="What is this regarding? (e.g., Kitchen Cabinets Material)"
                  className="w-full bg-gray-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#A78B6A]/20 focus:border-[#A78B6A] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                <textarea
                  value={newEnquiry.message}
                  onChange={(e) => setNewEnquiry(prev => ({ ...prev, message: e.target.value }))}
                  required
                  rows={5}
                  placeholder="Detail your requirements or suggestions here..."
                  className="w-full bg-gray-50 border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#A78B6A]/20 focus:border-[#A78B6A] transition-all resize-none"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-5 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-[#A78B6A] transition-all shadow-xl disabled:opacity-50 flex items-center gap-3"
                >
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FiSend size={16} />}
                  Send Enquiry Now
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {enquiries.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-gray-100 p-20 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FiMessageSquare size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Messages Found</h3>
            <p className="text-gray-400 max-w-sm mx-auto">Your conversation history with our design team will appear here.</p>
          </div>
        ) : (
          enquiries.map((enquiry, idx) => {
            const status = getStatusConfig(enquiry.status);
            return (
              <motion.div
                key={enquiry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all duration-500 overflow-hidden"
              >
                <div className="p-8 md:p-10">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.border} ${status.bg} ${status.color} flex items-center gap-2`}>
                          <status.icon size={12} />
                          {enquiry.status}
                        </span>
                        <span className="text-xs text-gray-300 font-bold uppercase tracking-wider">{enquiry.date}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{enquiry.subject}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-xl">
                      <FiHash size={14} />
                      REQ-{enquiry.id.substring(0, 6).toUpperCase()}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex gap-5">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <FiUser size={18} className="text-gray-400" />
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-[24px] p-6">
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">
                          {enquiry.message}
                        </p>
                      </div>
                    </div>

                    {enquiry.response && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-5 pl-8 md:pl-16"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#A78B6A] flex items-center justify-center shrink-0 shadow-lg shadow-[#A78B6A]/20">
                          <img src="/images/logo.png" className="w-6 h-6 object-contain brightness-0 invert" alt="LIVORAA" />
                        </div>
                        <div className="flex-1 bg-[#A78B6A]/5 border border-[#A78B6A]/10 rounded-[24px] p-8 relative">
                          <FiCornerDownRight className="absolute -left-6 top-4 text-[#A78B6A]" size={20} />
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-[#A78B6A] uppercase tracking-widest">Atelier Response</span>
                          </div>
                          <p className="text-sm text-gray-800 font-bold leading-relaxed italic">
                            "{enquiry.response}"
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
                {!enquiry.response && (
                  <div className="bg-amber-50 px-10 py-4 flex items-center gap-3">
                    <FiClock className="text-amber-500" size={16} />
                    <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Awaiting professional response from our team</p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CustomerEnquiries;
