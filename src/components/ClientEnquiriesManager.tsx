import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
    TrashIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
    ExclamationCircleIcon,
    ArrowRightIcon,
    XMarkIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { createNotification } from '../utils/notifications';

interface ClientEnquiry {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    response?: string;
    timestamp: Timestamp;
}

const ClientEnquiriesManager = () => {
    const [enquiries, setEnquiries] = useState<ClientEnquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [replyingTo, setReplyingTo] = useState<ClientEnquiry | null>(null);
    const [responseText, setResponseText] = useState('');
    const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

    useEffect(() => {
        const enquiriesRef = collection(db, 'client_enquiries');
        const q = query(enquiriesRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: ClientEnquiry[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as ClientEnquiry);
            });
            setEnquiries(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching client enquiries:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this enquiry?')) {
            try {
                await deleteDoc(doc(db, 'client_enquiries', id));
                toast.success('Enquiry deleted');
            } catch (error) {
                console.error("Error deleting enquiry:", error);
                toast.error('Failed to delete');
            }
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'client_enquiries', id), {
                status: newStatus
            });

            const enquiry = enquiries.find(e => e.id === id);
            if (enquiry) {
                await createNotification(
                    enquiry.email,
                    'Enquiry Status Updated',
                    `Your enquiry "${enquiry.subject}" status is now ${newStatus}.`,
                    'project_update',
                    '/customer/dashboard/enquiries'
                );
            }

            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error('Failed to update status');
        }
    };

    const handleSendResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyingTo || !responseText.trim()) return;

        setIsSubmittingResponse(true);
        try {
            await updateDoc(doc(db, 'client_enquiries', replyingTo.id), {
                response: responseText,
                status: 'resolved'
            });

            await createNotification(
                replyingTo.email,
                'New Response Received',
                `Atelier responded to your enquiry: "${replyingTo.subject}"`,
                'enquiry_reply',
                '/customer/dashboard/enquiries'
            );

            toast.success('Response sent successfully');
            setReplyingTo(null);
            setResponseText('');
        } catch (error) {
            console.error("Error sending response:", error);
            toast.error('Failed to send response');
        } finally {
            setIsSubmittingResponse(false);
        }
    };

    const filteredEnquiries = enquiries.filter(enq => {
        const matchesSearch =
            enq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enq.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enq.message.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || enq.status.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: enquiries.length,
        resolved: enquiries.filter(e => e.status === 'resolved').length,
        pending: enquiries.filter(e => e.status === 'pending').length,
        inProgress: enquiries.filter(e => e.status === 'in progress').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC9B7A]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans">
            {/* Premium Header Banner */}
            <div className="bg-[#A78B6A] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-[#A78B6A]/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -transtale-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                            <ChatBubbleLeftRightIcon className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Client Enquiries</h2>
                            <p className="text-white/80 font-medium">Manage enquiries submitted by customers through their portal</p>
                        </div>
                    </div>
                    <div className="bg-black/10 backdrop-blur-md px-8 py-4 rounded-[24px] border border-white/10 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Total Enquiries</p>
                        <p className="text-3xl font-bold leading-none">{stats.total}</p>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search client enquiries..."
                        className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A78B6A]/20 focus:border-[#A78B6A] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A78B6A]/20 focus:border-[#A78B6A] transition-all appearance-none text-gray-600 font-bold"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="in progress">In Progress</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending</p>
                        <p className="text-xl font-bold text-amber-600 leading-none">{stats.pending}</p>
                    </div>
                    <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resolved</p>
                        <p className="text-xl font-bold text-green-600 leading-none">{stats.resolved}</p>
                    </div>
                </div>
            </div>

            {/* Enquiries List */}
            <div className="space-y-6">
                {filteredEnquiries.length === 0 ? (
                    <div className="bg-white rounded-[40px] border border-gray-100 p-20 text-center shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Client Enquiries</h3>
                        <p className="text-gray-400 max-w-sm mx-auto">No enquiries have been submitted by customers yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredEnquiries.map((enq, idx) => (
                            <motion.div
                                key={enq.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#A78B6A]/5 transition-all duration-500 overflow-hidden"
                            >
                                <div className="p-8">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-4">
                                                <div className="relative group/status">
                                                    <select
                                                        value={enq.status}
                                                        onChange={(e) => handleStatusUpdate(enq.id, e.target.value)}
                                                        className={`appearance-none pl-10 pr-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer outline-none ${enq.status === 'resolved' ? 'bg-green-50 border-green-100 text-green-600' :
                                                            enq.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                                                'bg-blue-50 border-blue-100 text-blue-600'
                                                            }`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="in progress">In Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                    </select>
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        {enq.status === 'resolved' ? <CheckCircleIcon className="w-3.5 h-3.5 text-green-600" /> :
                                                            enq.status === 'pending' ? <ClockIcon className="w-3.5 h-3.5 text-amber-600" /> :
                                                                <ExclamationCircleIcon className="w-3.5 h-3.5 text-blue-600" />}
                                                    </div>
                                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none group-hover/status:text-gray-600 transition-colors" />
                                                </div>
                                                <span className="text-xs text-gray-400 font-bold tracking-widest uppercase">
                                                    {enq.timestamp?.toDate().toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900 mb-1">{enq.subject}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                                    <span className="text-[#A78B6A] font-bold">{enq.name}</span>
                                                    <span>•</span>
                                                    <span>{enq.email}</span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-2xl p-6">
                                                <p className="text-gray-600 leading-relaxed font-medium">
                                                    "{enq.message}"
                                                </p>
                                            </div>

                                            {enq.response && (
                                                <div className="bg-[#A78B6A]/5 border border-[#A78B6A]/10 rounded-2xl p-6 ml-6 relative">
                                                    <div className="absolute left-[-12px] top-6 w-3 h-3 bg-[#A78B6A]/10 border-l border-t border-[#A78B6A]/20 rotate-[-45deg]"></div>
                                                    <p className="text-[10px] font-black text-[#A78B6A] uppercase tracking-widest mb-2">Our Response</p>
                                                    <p className="text-gray-800 font-bold italic leading-relaxed">
                                                        "{enq.response}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex md:flex-col gap-3 shrink-0">
                                            <button
                                                onClick={() => {
                                                    setReplyingTo(enq);
                                                    setResponseText(enq.response || '');
                                                }}
                                                className="flex-1 md:w-16 h-16 bg-gray-50 text-gray-400 hover:bg-[#A78B6A] hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 group"
                                                title="Reply"
                                            >
                                                <ChatBubbleLeftRightIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(enq.id)}
                                                className="flex-1 md:w-16 h-16 bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 group"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reply Modal */}
            <AnimatePresence>
                {replyingTo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setReplyingTo(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl p-8 overflow-hidden"
                        >
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Reply to Enquiry</h3>
                                <p className="text-gray-400 text-sm font-medium">Re: {replyingTo.subject}</p>
                            </div>

                            <form onSubmit={handleSendResponse} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Professional Response</label>
                                    <textarea
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        rows={6}
                                        placeholder="Type your response here..."
                                        className="w-full bg-gray-50 border-none rounded-3xl p-6 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#A78B6A]/20 transition-all resize-none"
                                        required
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setReplyingTo(null)}
                                        className="flex-1 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingResponse}
                                        className="flex-[2] py-5 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-[#A78B6A] transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isSubmittingResponse ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Send Response
                                                <ArrowRightIcon className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClientEnquiriesManager;
