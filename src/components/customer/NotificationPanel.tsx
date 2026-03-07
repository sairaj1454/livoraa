import React, { useEffect, useState } from 'react';
import { db, auth } from '../../config/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BellIcon,
    CheckCircleIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    CreditCardIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    timestamp: any;
    link?: string;
}

const NotificationPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('userEmail', '==', user.email),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: Notification[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Notification);
            });
            setNotifications(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth.currentUser]);

    const markAsRead = async (id: string, link?: string) => {
        try {
            await updateDoc(doc(db, 'notifications', id), { read: true });
            if (link) {
                navigate(link);
                onClose();
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.read);
        const batch = writeBatch(db);
        unread.forEach((n) => {
            batch.update(doc(db, 'notifications', n.id), { read: true });
        });
        try {
            await batch.commit();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'enquiry_reply':
                return <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500" />;
            case 'project_update':
                return <ClockIcon className="w-5 h-5 text-amber-500" />;
            case 'new_quotation':
                return <DocumentTextIcon className="w-5 h-5 text-purple-500" />;
            case 'payment_update':
                return <CreditCardIcon className="w-5 h-5 text-emerald-500" />;
            default:
                return <BellIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed md:absolute top-24 md:top-20 right-4 md:right-0 w-[calc(100vw-2rem)] md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[70vh] md:max-h-[500px]"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                                    <BellIcon className="w-6 h-6 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                                    <p className="text-xs text-gray-400 font-medium">You have {notifications.filter(n => !n.read).length} unread alerts</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-black uppercase tracking-widest text-[#A78B6A] hover:text-[#8D7458] transition-colors hidden sm:block"
                                >
                                    Mark all read
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors md:hidden"
                                >
                                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto scrollbar-none p-4 space-y-3">
                            {loading ? (
                                <div className="py-20 text-center">
                                    <div className="w-10 h-10 border-4 border-[#A78B6A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-sm text-gray-400">Loading alerts...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <BellIcon className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">All caught up!</p>
                                    <p className="text-xs text-gray-400 mt-1">No new notifications today.</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <motion.div
                                        key={notification.id}
                                        layout
                                        onClick={() => markAsRead(notification.id, notification.link)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer group ${notification.read
                                            ? 'bg-white border-gray-50 opacity-60'
                                            : 'bg-white border-[#A78B6A]/10 shadow-sm hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notification.read ? 'bg-gray-50' : 'bg-[#A78B6A]/5'
                                                    }`}>
                                                    {getIcon(notification.type)}
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm font-bold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 font-medium tracking-tight">
                                                        {notification.timestamp?.toDate() ? formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true }) : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                                    {notification.message}
                                                </p>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-[#A78B6A] rounded-full mt-2"></div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-50 bg-gray-50/30 text-center">
                            <button
                                onClick={onClose}
                                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Close Panel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationPanel;
