import React, { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFileText,
  FiCalendar,
  FiMapPin,
  FiArrowRight,
  FiArrowLeft,
  FiDollarSign,
  FiPackage,
  FiHash,
  FiInfo,
  FiZap
} from 'react-icons/fi';

interface QuotationItem {
  id: string;
  room: string;
  item: string;
  d1: number;
  d2: number;
  type: string;
  area: number;
  price: number;
  isLumpsum?: boolean;
  customTypeName?: string;
  isCustomItem?: boolean;
  customItemLabel?: string;
}

interface Quotation {
  id: string;
  clientId: string;
  clientName: string;
  customerEmail: string;
  siteCode: string;
  siteAddress: string;
  version: string;
  date: string;
  items: QuotationItem[];
  falseCeiling: string;
  electrical: string;
  painting: string;
  falseCeilingDesc: string;
  electricalDesc: string;
  paintingDesc: string;
  terms: string[];
  total: number;
  timestamp: any;
}

const CustomerQuotations: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const quotationsRef = collection(db, 'quotations');
      const quotationsQuery = query(
        quotationsRef,
        where('customerEmail', '==', user.email),
        where('sentToClient', '==', true)
      );

      const quotationsSnapshot = await getDocs(quotationsQuery);
      const quotationsList: Quotation[] = [];

      quotationsSnapshot.forEach((doc) => {
        const data = doc.data();
        quotationsList.push({
          id: doc.id,
          clientId: data.clientId || '',
          clientName: data.clientName || '',
          customerEmail: data.customerEmail || '',
          siteCode: data.siteCode || '',
          siteAddress: data.siteAddress || '',
          version: data.version || '',
          date: data.date || '',
          items: data.items || [],
          falseCeiling: String(data.falseCeiling || '0'),
          electrical: String(data.electrical || '0'),
          painting: String(data.painting || '0'),
          falseCeilingDesc: data.falseCeilingDesc || '',
          electricalDesc: data.electricalDesc || '',
          paintingDesc: data.paintingDesc || '',
          terms: data.terms || [],
          total: data.total || 0,
          timestamp: data.timestamp
        });
      });

      setQuotations(quotationsList.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.date || 0);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.date || 0);
        return dateB.getTime() - dateA.getTime();
      }));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to load quotations');
      setLoading(false);
    }
  };

  const formatDate = (quotation: Quotation) => {
    if (quotation.timestamp?.toDate) {
      return quotation.timestamp.toDate().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    return quotation.date || 'No date';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-[#A78B6A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4">
      <AnimatePresence mode="wait">
        {!selectedQuotation ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 font-sans"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Quotations Archive</h2>
                <p className="text-gray-400 font-medium mt-1">Review and manage your project estimates</p>
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 bg-[#A78B6A]/10 text-[#A78B6A] rounded-xl flex items-center justify-center">
                  <FiFileText size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Quotations</p>
                  <p className="text-xl font-bold text-gray-900 leading-none">{quotations.length}</p>
                </div>
              </div>
            </div>

            {quotations.length === 0 ? (
              <div className="bg-white rounded-[32px] border border-dashed border-gray-200 p-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <FiFileText size={32} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Quotations Yet</h3>
                <p className="text-gray-400 max-w-sm mx-auto">Your design quotations will appear here once they are generated by our team.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {quotations.map((quotation, idx) => (
                  <motion.div
                    key={quotation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white rounded-[32px] border border-gray-100 hover:border-[#A78B6A]/30 hover:shadow-2xl hover:shadow-[#A78B6A]/10 transition-all duration-500 overflow-hidden flex flex-col"
                  >
                    <div className="p-8 flex-1">
                      <div className="flex items-center justify-between mb-6">
                        <div className="bg-[#A78B6A]/5 px-4 py-2 rounded-xl border border-[#A78B6A]/10">
                          <span className="text-xs font-black text-[#A78B6A] uppercase tracking-widest">{quotation.version}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                          <FiCalendar size={14} />
                          {formatDate(quotation)}
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#A78B6A] transition-colors">
                        {quotation.siteCode || 'Untitled Project'}
                      </h3>

                      <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3">
                          <FiMapPin className="text-gray-300 shrink-0 mt-1" size={16} />
                          <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed">
                            {quotation.siteAddress}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <FiPackage className="text-gray-300 shrink-0" size={16} />
                          <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">
                            {quotation.items.length} Items Configured
                          </p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Estimate</p>
                          <p className="text-2xl font-black text-gray-900 tracking-tight">
                            ₹{quotation.total.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedQuotation(quotation)}
                          className="w-12 h-12 bg-gray-50 text-gray-400 group-hover:bg-[#A78B6A] group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm"
                        >
                          <FiArrowRight size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 pb-32 font-sans"
          >
            {/* Details Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <button
                onClick={() => setSelectedQuotation(null)}
                className="flex items-center gap-3 text-gray-400 hover:text-gray-900 font-bold text-sm transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-all">
                  <FiArrowLeft size={18} />
                </div>
                Back to Archive
              </button>

              <div className="flex items-center gap-4">
                <div className="bg-[#A78B6A] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#A78B6A]/20">
                  {selectedQuotation.version}
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 text-sm font-bold text-gray-900 font-sans">
                  Ref: {selectedQuotation.id.substring(0, 8).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Main Info Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Client Info Banner */}
                <div className="bg-white rounded-[40px] border border-gray-100 p-8 md:p-10 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50/50 rounded-full blur-3xl -transtale-y-1/2 translate-x-1/2"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-[#A78B6A] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#A78B6A]/20">
                        {selectedQuotation.clientName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900 leading-tight">{selectedQuotation.clientName}</h3>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Design Project Owner</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Site Code</p>
                        <p className="text-lg font-bold text-gray-900">{selectedQuotation.siteCode}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Site Address</p>
                        <p className="text-base font-medium text-gray-600 leading-relaxed">{selectedQuotation.siteAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#A78B6A]/10 text-[#A78B6A] rounded-xl flex items-center justify-center">
                        <FiPackage size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Quotation Items</h3>
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {selectedQuotation.items.length} Total Elements
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Element</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Dimensions</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedQuotation.items.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-gray-900">
                                {item.item === '__custom_item__' ? (item.customItemLabel || 'Custom Item') : item.item}
                              </p>
                              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">{item.room}</p>
                            </td>
                            <td className="px-8 py-6">
                              {item.isLumpsum ? (
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#A78B6A] bg-[#A78B6A]/5 px-3 py-1.5 rounded-lg border border-[#A78B6A]/10">
                                  Lumpsum Item
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-gray-900">{item.d1} × {item.d2}</span>
                                  <span className="text-xs text-gray-400 font-medium">= {item.area} sft</span>
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A78B6A] bg-[#A78B6A]/10 px-3 py-1.5 rounded-lg border border-[#A78B6A]/10">
                                {item.type === '__custom__' ? (item.customTypeName || 'Custom') : item.type}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <p className="text-sm font-black text-gray-900">
                                ₹{(item.isLumpsum ? item.price : item.price * item.area).toLocaleString('en-IN')}
                              </p>
                              <p className="text-[10px] text-gray-400 font-medium tracking-wide mt-0.5">
                                {item.isLumpsum ? 'Fixed Rate' : `₹${item.price}/sft`}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Terms */}
                <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                      <FiInfo size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Terms & Conditions</h3>
                  </div>
                  <ul className="space-y-5">
                    {selectedQuotation.terms.map((term, i) => (
                      <li key={i} className="flex gap-4">
                        <div className="w-1.5 h-1.5 bg-[#A78B6A] rounded-full mt-2.5 shrink-0"></div>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{term}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-8 font-sans">
                {/* Summary Card */}
                <div className="bg-gray-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden sticky top-8">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -transtale-y-1/2 translate-x-1/2"></div>

                  <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                    <FiDollarSign className="text-[#A78B6A]" />
                    Amount Summary
                  </h3>

                  <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-xs font-bold uppercase tracking-widest">Items Subtotal</span>
                      <span className="text-sm font-bold text-white">
                        ₹{(selectedQuotation.items.reduce((acc, curr) => acc + (curr.isLumpsum ? curr.price : curr.price * curr.area), 0)).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Additional Services */}
                    {(parseInt(selectedQuotation.falseCeiling) > 0 ||
                      parseInt(selectedQuotation.electrical) > 0 ||
                      parseInt(selectedQuotation.painting) > 0) && (
                        <div className="pt-6 border-t border-white/10 space-y-4">
                          <p className="text-[10px] font-black text-[#A78B6A] uppercase tracking-widest">Additional Services</p>

                          {parseInt(selectedQuotation.falseCeiling) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400 font-medium">False Ceiling</span>
                              <span className="text-sm font-bold">₹{parseInt(selectedQuotation.falseCeiling).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {parseInt(selectedQuotation.electrical) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400 font-medium">Electrical</span>
                              <span className="text-sm font-bold">₹{parseInt(selectedQuotation.electrical).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {parseInt(selectedQuotation.painting) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400 font-medium">Painting</span>
                              <span className="text-sm font-bold">₹{parseInt(selectedQuotation.painting).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  <div className="pt-8 border-t border-white/10">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Grand Total</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-5xl font-black text-[#A78B6A] tracking-tighter">
                        ₹{selectedQuotation.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium mt-4 italic">
                      * Inclusive of all services and design elements mentioned above.
                    </p>
                  </div>

                  <button className="w-full mt-10 bg-white text-gray-900 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-[#A78B6A] hover:text-white transition-all shadow-xl flex items-center justify-center gap-3">
                    <FiFileText size={18} />
                    Download PDF Document
                  </button>
                </div>

                <div className="bg-[#A78B6A]/5 rounded-[32px] p-8 border border-[#A78B6A]/10 font-sans">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#A78B6A] flex items-center justify-center text-white">
                      <FiZap size={16} />
                    </div>
                    <h4 className="text-base font-bold text-gray-900">Need Changes?</h4>
                  </div>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
                    If you want to modify any items or discuss the budget, feel free to raise an enquiry or contact your designer.
                  </p>
                  <button className="text-xs font-black text-[#A78B6A] uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                    Contact Designer <FiArrowRight />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerQuotations;
