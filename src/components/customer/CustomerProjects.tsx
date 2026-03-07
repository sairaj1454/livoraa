import React, { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

interface PaymentHistory {
  amount: number;
  date: string;
  notes?: string;
  paymentMethod: 'cash' | 'bank' | 'upi';
  type: 'advance' | 'installment' | 'final';
  status: 'success' | 'pending' | 'failed';
}

interface Project {
  id: string;
  title: string;
  clientName: string;
  status: string;
  startDate: string;
  dueDate: string;
  description: string;
  payments: {
    advanceAmount: number;
    totalAmount: number;
    nextPaymentDate?: string;
    paymentHistory: PaymentHistory[];
  };
}

const CustomerProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const projectsQuery = query(
        collection(db, 'projects'),
        where('clientEmail', '==', user.email)
      );

      const querySnapshot = await getDocs(projectsQuery);
      const projectsList: Project[] = [];

      for (const docRef of querySnapshot.docs) {
        const data = docRef.data();
        const projectRef = doc(db, 'projects', docRef.id);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          projectsList.push({
            id: docRef.id,
            title: data.title || 'Untitled Project',
            clientName: data.clientName || user.displayName || '',
            status: data.status || 'pending',
            startDate: data.startDate ? new Date(data.startDate).toLocaleDateString() : 'Not set',
            dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'Not set',
            description: data.description || '',
            payments: {
              advanceAmount: projectData.payments?.advanceAmount || 0,
              totalAmount: projectData.payments?.totalAmount || 0,
              nextPaymentDate: projectData.payments?.nextPaymentDate,
              paymentHistory: projectData.payments?.paymentHistory || []
            }
          });
        }
      }

      setProjects(projectsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      setLoading(false);
    }
  };

  const calculateTotalPaid = (project: Project) => {
    const historyTotal = project.payments.paymentHistory.reduce(
      (sum, payment) => sum + (payment.status === 'success' ? payment.amount : 0),
      0
    );
    return historyTotal + project.payments.advanceAmount;
  };

  const calculateRemainingAmount = (project: Project) => {
    return project.payments.totalAmount - calculateTotalPaid(project);
  };

  const getPercentage = (amount: number, total: number) => {
    return ((amount / total) * 100).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="space-y-12 p-2">
      {projects.map((project, idx) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white rounded-[32px] overflow-hidden"
        >
          {/* Project Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 border-b border-gray-50">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h2>
              <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Ongoing Project</p>
            </div>
            <button className="mt-4 md:mt-0 px-8 py-3 bg-[#A78B6A] text-white rounded-2xl font-bold shadow-lg shadow-[#A78B6A]/20 hover:bg-[#8d7456] transition-all flex items-center gap-2">
              View Details
            </button>
          </div>

          <div className="p-8 space-y-10">
            {/* Payment Overview */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-[0.2em] mb-6">Payment Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Advance Card */}
                <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-blue-600/70 text-xs font-bold uppercase tracking-wider mb-1">Initial Advance</p>
                    <p className="text-3xl font-bold text-blue-600 tracking-tight">₹{project.payments.advanceAmount.toLocaleString()}</p>
                  </div>
                  <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wide relative z-10">
                    {getPercentage(project.payments.advanceAmount, project.payments.totalAmount)}% of total
                  </p>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-100/30 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                </div>

                {/* Paid Card */}
                <div className="bg-green-50/50 p-6 rounded-[24px] border border-green-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-green-600/70 text-xs font-bold uppercase tracking-wider mb-1">Total Paid</p>
                    <p className="text-3xl font-bold text-green-600 tracking-tight">₹{calculateTotalPaid(project).toLocaleString()}</p>
                  </div>
                  <p className="text-[11px] font-bold text-green-400 uppercase tracking-wide relative z-10">
                    {getPercentage(calculateTotalPaid(project), project.payments.totalAmount)}% of total
                  </p>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-green-100/30 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                </div>

                {/* Remaining Card */}
                <div className="bg-red-50/50 p-6 rounded-[24px] border border-red-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-red-600/70 text-xs font-bold uppercase tracking-wider mb-1">Remaining Amount</p>
                    <p className="text-3xl font-bold text-red-600 tracking-tight">₹{calculateRemainingAmount(project).toLocaleString()}</p>
                  </div>
                  <p className="text-[11px] font-bold text-red-400 uppercase tracking-wide relative z-10">
                    {getPercentage(calculateRemainingAmount(project), project.payments.totalAmount)}% remaining
                  </p>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-red-100/30 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                </div>
              </div>
            </div>

            {/* Next Payment Info */}
            {project.payments.nextPaymentDate && (
              <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Next Payment Date</p>
                  <h4 className="text-xl font-bold text-gray-900">{formatDate(project.payments.nextPaymentDate)}</h4>
                </div>
                <span className="px-4 py-2 bg-[#A78B6A]/10 text-[#A78B6A] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#A78B6A]/20">
                  Due Soon
                </span>
              </div>
            )}

            {/* Payment History */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-[0.2em] mb-6">Payment History</h3>
              <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {['Date', 'Amount', 'Type', 'Method', 'Status'].map(head => (
                        <th key={head} className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {project.payments.paymentHistory.length > 0 ? (
                      project.payments.paymentHistory.map((payment, pIdx) => (
                        <tr key={pIdx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-5 text-sm font-bold text-gray-900">{formatDate(payment.date)}</td>
                          <td className="px-6 py-5 text-sm font-black text-gray-900">₹{payment.amount.toLocaleString()}</td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              {payment.type}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A78B6A]">
                              {payment.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`
                              px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                              ${payment.status === 'success' ? 'bg-green-100 text-green-600' :
                                payment.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                  'bg-red-100 text-red-600'}
                            `}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400 font-medium italic">
                          No payment records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CustomerProjects;
