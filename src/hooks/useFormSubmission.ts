import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useEmailNotification } from './useEmailNotification';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  formType: string;
}

export const useFormSubmission = () => {
  const { sendEmail } = useEmailNotification();

  const submitForm = async (data: FormData) => {
    try {
      // Save to Firebase
      const enquiriesRef = collection(db, 'enquiries');
      await addDoc(enquiriesRef, {
        ...data,
        timestamp: serverTimestamp(),
      });

      // Send email notification
      await sendEmail(data);

      return { success: true };
    } catch (error) {
      console.error('Error submitting form:', error);
      return { success: false, error };
    }
  };

  return { submitForm };
};
