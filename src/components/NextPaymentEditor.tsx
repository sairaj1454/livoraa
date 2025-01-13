import React, { useState, useMemo } from 'react';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Project } from '../types';
import { toast } from 'react-toastify';

interface NextPaymentEditorProps {
  project: Project;
  onUpdate: () => void;
}

const NextPaymentEditor: React.FC<NextPaymentEditorProps> = ({ project, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nextPaymentDate, setNextPaymentDate] = useState(
    project.payments?.nextPaymentDate || ''
  );
  const [loading, setLoading] = useState(false);

  const remainingAmount = useMemo(() => {
    const totalAmount = project.payments?.totalAmount || 0;
    const advanceAmount = project.payments?.advanceAmount || 0;
    const paymentHistory = project.payments?.paymentHistory || [];
    const totalPaid = paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0) + advanceAmount;
    return totalAmount - totalPaid;
  }, [project.payments]);

  const paymentStatus = useMemo(() => {
    if (remainingAmount <= 0) {
      return {
        label: 'ALL PAYMENTS RECEIVED',
        color: 'bg-green-500 text-white',
        days: 0
      };
    }

    if (!project.payments?.nextPaymentDate) return null;

    const nextPayment = new Date(project.payments.nextPaymentDate);
    const today = new Date();
    const diffDays = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: 'OVERDUE',
        color: 'bg-red-500 text-white',
        days: Math.abs(diffDays)
      };
    } else if (diffDays === 0) {
      return {
        label: 'DUE TODAY',
        color: 'bg-yellow-500 text-white',
        days: 0
      };
    } else if (diffDays <= 7) {
      return {
        label: 'DUE SOON',
        color: 'bg-orange-500 text-white',
        days: diffDays
      };
    } else {
      return {
        label: 'UPCOMING',
        color: 'bg-green-500 text-white',
        days: diffDays
      };
    }
  }, [project.payments?.nextPaymentDate, remainingAmount]);

  const handleEdit = () => {
    if (remainingAmount <= 0) {
      toast.info('All payments have been received');
      return;
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        'payments.nextPaymentDate': nextPaymentDate
      });
      setIsEditing(false);
      onUpdate();
      toast.success('Next payment date updated successfully');
    } catch (error) {
      console.error('Error updating next payment date:', error);
      toast.error('Failed to update next payment date');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNextPaymentDate(project.payments?.nextPaymentDate || '');
    setIsEditing(false);
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 font-medium">Next Payment Date:</span>
        {!isEditing && paymentStatus && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentStatus.color}`}>
            {paymentStatus.label}
          </span>
        )}
      </div>
      
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={nextPaymentDate}
            onChange={(e) => setNextPaymentDate(e.target.value)}
            className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            min={new Date().toISOString().split('T')[0]}
          />
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="border border-gray-300 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-gray-800">
            {remainingAmount <= 0 ? 'Complete' : (project.payments?.nextPaymentDate || 'Not set')}
          </span>
          {remainingAmount > 0 && (
            <button
              onClick={handleEdit}
              className="text-blue-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NextPaymentEditor;
