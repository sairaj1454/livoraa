import React, { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';

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
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No projects found</p>
        </div>
      ) : (
        projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{project.title}</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    View Details
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Payment Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-600">Initial Advance</p>
                    <p className="text-2xl font-bold text-blue-600">₹{project.payments.advanceAmount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      {getPercentage(project.payments.advanceAmount, project.payments.totalAmount)}% of total
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-gray-600">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">₹{calculateTotalPaid(project).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      {getPercentage(calculateTotalPaid(project), project.payments.totalAmount)}% of total
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-gray-600">Remaining Amount</p>
                    <p className="text-2xl font-bold text-red-600">₹{calculateRemainingAmount(project).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      {getPercentage(calculateRemainingAmount(project), project.payments.totalAmount)}% remaining
                    </p>
                  </div>
                </div>
              </div>

              {project.payments.nextPaymentDate && (
                <div className="mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600">Next Payment Date:</p>
                      <p className="text-lg font-semibold">{formatDate(project.payments.nextPaymentDate)}</p>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      DUE SOON
                    </span>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xl font-semibold mb-4">Payment History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {project.payments.paymentHistory.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{payment.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.paymentMethod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${payment.status === 'success' ? 'bg-green-100 text-green-800' : 
                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CustomerProjects;
