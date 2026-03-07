import { db } from '../config/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export type NotificationType = 'enquiry_reply' | 'project_update' | 'new_quotation' | 'payment_update';

export const createNotification = async (
    userEmail: string,
    title: string,
    message: string,
    type: NotificationType,
    link?: string
) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            userEmail,
            title,
            message,
            type,
            link: link || '',
            read: false,
            timestamp: Timestamp.now()
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};
