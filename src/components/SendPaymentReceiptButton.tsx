import React from 'react';
import { toast } from 'react-toastify';
import { usePaymentEmailJS } from '../hooks/usePaymentEmailJS';
import { PaymentHistory, Project } from '../types';

interface SendPaymentReceiptButtonProps {
  project: Project;
  payment: PaymentHistory;
  totalPaid: number;
  remainingAmount: number;
}

const SendPaymentReceiptButton: React.FC<SendPaymentReceiptButtonProps> = ({
  project,
  payment,
  totalPaid,
  remainingAmount,
}) => {
  const { sendPaymentReceipt } = usePaymentEmailJS();

  const handleSendReceipt = async () => {
    try {
      const result = await sendPaymentReceipt({
        to: project.clientEmail,
        toName: project.client,
        projectTitle: project.title,
        paymentDetails: payment,
        totalAmount: totalPaid,
        remainingAmount: remainingAmount,
      });

      if (result.success) {
        toast.success('Payment receipt sent successfully!');
      } else {
        toast.error('Failed to send payment receipt');
      }
    } catch (error) {
      console.error('Error sending receipt:', error);
      toast.error('Failed to send payment receipt');
    }
  };

  return (
    <button
      onClick={handleSendReceipt}
      className="text-blue-600 hover:text-blue-800"
      title="Send Receipt"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    </button>
  );
};

export default SendPaymentReceiptButton;
