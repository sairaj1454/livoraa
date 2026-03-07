import emailjs from '@emailjs/browser';
import { PaymentHistory } from '../types';

interface SendPaymentReceiptParams {
  to: string;
  toName: string;
  projectTitle: string;
  paymentDetails: PaymentHistory;
  totalAmount: number;
  remainingAmount: number;
}

export const usePaymentEmailJS = () => {
  const sendPaymentReceipt = async ({
    to,
    toName,
    projectTitle,
    paymentDetails,
    totalAmount,
    remainingAmount,
  }: SendPaymentReceiptParams) => {
    try {
      const currentDate = new Date().toLocaleDateString();
      const receiptNumber = `RCPT-${Date.now()}`;

      const templateParams = {
        to_email: to,
        to_name: toName,
        message: `
===========================================
            LIVORAA ATELIER
           Payment Receipt
===========================================

Receipt No: ${receiptNumber}
Date: ${currentDate}

Bill To:
${toName}
${to}

Project Details:
Project Name: ${projectTitle}

Payment Information:
-------------------------------------------
Amount Paid:          ₹${paymentDetails.amount.toLocaleString()}
Payment Date:         ${new Date(paymentDetails.date).toLocaleDateString()}
Payment Type:         ${paymentDetails.type.charAt(0).toUpperCase() + paymentDetails.type.slice(1)}
Payment Method:       ${paymentDetails.paymentMethod.toUpperCase()}
Payment Status:       Successful

Payment Summary:
-------------------------------------------
Total Project Value:  ₹${totalAmount.toLocaleString()}
Total Paid:          ₹${(totalAmount - remainingAmount).toLocaleString()}
Remaining Balance:    ₹${remainingAmount.toLocaleString()}

===========================================

Note: This is a computer-generated receipt.
No signature required.

For any queries, please contact:
LIVORAA ATELIER
Email: support@LIVORAA ATELIER.com
Phone: +91-XXXXXXXXXX

===========================================
        Thank you for your business!
===========================================`,
        subject: `Payment Receipt #${receiptNumber} - ${projectTitle}`
      };

      await emailjs.send(
        'service_z7kagc4',
        'template_38nrv0k',
        templateParams,
        'wGzsvi5X7v8prOba-'
      );

      return { success: true };
    } catch (error) {
      console.error('Error sending payment receipt:', error);
      return { success: false, error };
    }
  };

  return { sendPaymentReceipt };
};
