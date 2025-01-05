import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PaymentHistory {
  amount: number;
  date: string;
  type: string;
  notes?: string;
}

interface PaymentSchedule {
  dueDate: string;
  expectedAmount: number;
  status: 'pending' | 'paid' | 'overdue';
}

interface Project {
  id: string;
  title: string;
  client: string;
  clientEmail: string;
  clientPhone: string;
  status: string;
  description: string;
  location: string;
  budget: number;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  payments: {
    totalAmount: number;
    advanceAmount: number;
    remainingAmount: number;
    paymentStatus: string;
    nextPaymentDate: string;
    paymentHistory: PaymentHistory[];
    paymentSchedule: PaymentSchedule[];
  };
}

const ProjectOverview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const projectsQuery = query(collection(db, 'projects'));
      const querySnapshot = await getDocs(projectsQuery);
      const projectsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          payments: {
            ...data.payments,
            paymentHistory: data.payments?.paymentHistory || [],
            paymentSchedule: data.payments?.paymentSchedule || []
          }
        };
      }) as Project[];
      setProjects(projectsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error loading projects');
      setLoading(false);
    }
  };

  const handleEditProject = async () => {
    if (!editingProject) return;

    try {
      const projectRef = doc(db, 'projects', editingProject.id);
      await updateDoc(projectRef, {
        title: editingProject.title,
        client: editingProject.client,
        clientEmail: editingProject.clientEmail,
        clientPhone: editingProject.clientPhone,
        status: editingProject.status,
        description: editingProject.description,
        location: editingProject.location,
        budget: editingProject.budget,
        address: editingProject.address,
        payments: {
          ...editingProject.payments,
          paymentHistory: editingProject.payments.paymentHistory || [],
          paymentSchedule: editingProject.payments.paymentSchedule || []
        },
      });
      await fetchProjects();
      setEditingProject(null);
      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Error updating project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!projectId) return;

    // Show confirmation dialog
    const isConfirmed = window.confirm('Are you sure you want to delete this project? This action cannot be undone.');
    
    if (!isConfirmed) {
      return; // User cancelled the deletion
    }

    try {
      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);
      await fetchProjects();
      setEditingProject(null);
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error deleting project');
    }
  };

  const getPaymentStats = () => {
    const completedProjects = projects.filter(p => p.status === 'Completed');
    const ongoingProjects = projects.filter(p => p.status !== 'Completed');

    const completedStats = {
      totalAmount: completedProjects.reduce((sum, p) => sum + p.payments.totalAmount, 0),
      paidAmount: completedProjects.reduce((sum, p) => sum + p.payments.advanceAmount, 0)
    };

    const ongoingStats = {
      totalAmount: ongoingProjects.reduce((sum, p) => sum + p.payments.totalAmount, 0),
      paidAmount: ongoingProjects.reduce((sum, p) => sum + p.payments.advanceAmount, 0)
    };

    return { completedStats, ongoingStats };
  };

  const filteredProjects = selectedStatus === 'all' 
    ? projects 
    : projects.filter(p => p.status === selectedStatus);

  const { completedStats, ongoingStats } = getPaymentStats();

  const completedChartData = {
    labels: ['Received', 'Pending'],
    datasets: [{
      data: [completedStats.paidAmount, completedStats.totalAmount - completedStats.paidAmount],
      backgroundColor: ['#4CAF50', '#ff9800'],
      borderColor: ['#43A047', '#FB8C00'],
      borderWidth: 1
    }]
  };

  const ongoingChartData = {
    labels: ['Received', 'Pending'],
    datasets: [{
      data: [ongoingStats.paidAmount, ongoingStats.totalAmount - ongoingStats.paidAmount],
      backgroundColor: ['#2196F3', '#f44336'],
      borderColor: ['#1E88E5', '#E53935'],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  return (
    <div className="p-6">
      <ToastContainer position="bottom-right" />
      
      {/* Statistics Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Payment Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Completed Projects</h3>
            <div className="h-64">
              <Doughnut data={completedChartData} options={chartOptions} />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-700 font-medium">
                Total Amount: <span className="text-blue-600">₹{completedStats.totalAmount.toLocaleString()}</span>
              </p>
              <p className="text-sm text-gray-700 font-medium">
                Received: <span className="text-green-600">₹{completedStats.paidAmount.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Ongoing Projects</h3>
            <div className="h-64">
              <Doughnut data={ongoingChartData} options={chartOptions} />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-700 font-medium">
                Total Amount: <span className="text-blue-600">₹{ongoingStats.totalAmount.toLocaleString()}</span>
              </p>
              <p className="text-sm text-gray-700 font-medium">
                Received: <span className="text-green-600">₹{ongoingStats.paidAmount.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Projects Overview</h2>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2 border rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Projects</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredProjects.map(project => (
              <div key={project.id} className="bg-white p-6 rounded-lg shadow-md">
                {editingProject?.id === project.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Project Title
                        </label>
                        <input
                          type="text"
                          value={editingProject.title}
                          onChange={(e) => setEditingProject({
                            ...editingProject,
                            title: e.target.value
                          })}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={editingProject.status}
                          onChange={(e) => setEditingProject({
                            ...editingProject,
                            status: e.target.value
                          })}
                          className="w-full p-2 border rounded-md text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Planning">Planning</option>
                          <option value="In Progress">In Progress</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="text"
                            value={editingProject.payments.totalAmount}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              setEditingProject({
                                ...editingProject,
                                payments: {
                                  ...editingProject.payments,
                                  totalAmount: Number(value) || 0,
                                  remainingAmount: Number(value) - editingProject.payments.advanceAmount
                                }
                              });
                            }}
                            className="w-full p-2 pl-8 border rounded-md"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Advance Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="text"
                            value={editingProject.payments.advanceAmount}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              const numValue = Number(value) || 0;
                              if (numValue <= editingProject.payments.totalAmount) {
                                setEditingProject({
                                  ...editingProject,
                                  payments: {
                                    ...editingProject.payments,
                                    advanceAmount: numValue,
                                    remainingAmount: editingProject.payments.totalAmount - numValue
                                  }
                                });
                              }
                            }}
                            className="w-full p-2 pl-8 border rounded-md"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Next Payment Date
                        </label>
                        <input
                          type="date"
                          value={editingProject.payments.nextPaymentDate}
                          onChange={(e) => setEditingProject({
                            ...editingProject,
                            payments: {
                              ...editingProject.payments,
                              nextPaymentDate: e.target.value
                            }
                          })}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment History
                        </label>
                        <div className="space-y-2">
                          {editingProject.payments.paymentHistory.map((payment, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <p className="text-sm text-gray-700">{payment.date}</p>
                              <p className="text-sm text-gray-700">₹{payment.amount}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Schedule
                        </label>
                        <div className="space-y-2">
                          {editingProject.payments.paymentSchedule.map((schedule, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <p className="text-sm text-gray-700">{schedule.dueDate}</p>
                              <p className="text-sm text-gray-700">₹{schedule.expectedAmount}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => setEditingProject(null)}
                        className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditProject}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.title}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'Planning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="mt-4 md:mt-0 space-x-2">
                        <button
                          onClick={() => setEditingProject(project)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Email: {project.clientEmail}</p>
                        <p className="text-sm text-gray-600">Phone: {project.clientPhone}</p>
                        <p className="text-sm text-gray-600">Location: {project.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-medium">
                          Total Amount: <span className="text-blue-600">₹{project.payments.totalAmount.toLocaleString()}</span>
                        </p>
                        <p className="text-sm text-gray-700 font-medium">
                          Advance Paid: <span className="text-green-600">₹{project.payments.advanceAmount.toLocaleString()}</span>
                        </p>
                        <p className="text-sm text-gray-700 font-medium">
                          Remaining: <span className="text-red-600">₹{project.payments.remainingAmount.toLocaleString()}</span>
                        </p>
                        
                        {/* Payment Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-700">Payment Progress</span>
                            <span className="text-sm text-gray-700">{Math.round((project.payments.advanceAmount / project.payments.totalAmount) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(project.payments.advanceAmount / project.payments.totalAmount) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Payment Status */}
                        {project.payments.remainingAmount === 0 ? (
                          <p className="text-sm font-medium mt-2">
                            Payment Status: <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full">Completed</span>
                          </p>
                        ) : project.payments.nextPaymentDate && (
                          <p className="text-sm text-gray-700 font-medium mt-2">
                            Next Payment Due: <span className="text-orange-600">
                              {new Date(project.payments.nextPaymentDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            {new Date(project.payments.nextPaymentDate) < new Date() && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Overdue</span>
                            )}
                          </p>
                        )}

                        {/* Payment Schedule */}
                        {project.payments?.paymentSchedule?.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Schedule</h4>
                            <div className="space-y-2">
                              {project.payments.paymentSchedule.map((schedule, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <div>
                                    <span className="text-gray-600">
                                      {new Date(schedule.dueDate).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short'
                                      })}
                                    </span>
                                    <span className="ml-2">₹{schedule.expectedAmount.toLocaleString()}</span>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    schedule.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    schedule.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Address:</p>
                      <p>{project.address.street}, {project.address.city}</p>
                      <p>{project.address.state} - {project.address.pincode}</p>
                    </div>
                    {/* Only show payment history section if there is data */}
                    {project.payments?.paymentHistory?.length > 0 && (
                      <div className="mt-4 text-sm text-gray-600">
                        <p className="font-medium">Payment History:</p>
                        <div className="space-y-2">
                          {project.payments.paymentHistory.map((payment, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <p className="text-sm text-gray-700">{payment.date}</p>
                              <p className="text-sm text-gray-700">₹{payment.amount}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Only show payment schedule section if there is data */}
                    {project.payments?.paymentSchedule?.length > 0 && (
                      <div className="mt-4 text-sm text-gray-600">
                        <p className="font-medium">Payment Schedule:</p>
                        <div className="space-y-2">
                          {project.payments.paymentSchedule.map((schedule, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <p className="text-sm text-gray-700">{schedule.dueDate}</p>
                              <p className="text-sm text-gray-700">₹{schedule.expectedAmount}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectOverview;