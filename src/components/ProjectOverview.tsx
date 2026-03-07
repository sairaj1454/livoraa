import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BriefcaseIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  MapPinIcon,
  InformationCircleIcon,
  CalendarIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { createNotification } from '../utils/notifications';
import { Project, PaymentHistory, PaymentSchedule, ProjectWorker } from '../types';
import NextPaymentEditor from './NextPaymentEditor';
import SendPaymentReceiptButton from './SendPaymentReceiptButton';

ChartJS.register(ArcElement, Tooltip, Legend);

type PaymentType = 'advance' | 'installment' | 'final';
type PaymentMethod = 'cash' | 'bank' | 'upi';

const ProjectOverview: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProjectData, setEditingProjectData] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    budgetMin: '',
    budgetMax: '',
    dateRange: 'all',
    paymentStatus: ''
  });
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const projectsPerPage = 1;

  // Add new payment state
  const [newPayment, setNewPayment] = useState<PaymentHistory>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    type: 'installment' as PaymentType,
    notes: '',
    paymentMethod: 'cash' as PaymentMethod,
    status: 'success'
  });
  const [nextPaymentDate, setNextPaymentDate] = useState<string>('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const projectsQuery = query(collection(db, 'projects'));
      const querySnapshot = await getDocs(projectsQuery);
      const projectsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      }) as Project[];
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (projectId: string) => {
    try {
      if (!newPayment.amount || newPayment.amount <= 0) {
        toast.error('Please enter a valid payment amount');
        return;
      }

      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        toast.error('Project not found');
        return;
      }

      const projectData = projectDoc.data() as Project;
      const currentPayments = projectData.payments || {};
      const paymentHistory = currentPayments.paymentHistory || [];
      const totalPaid = paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0) + (currentPayments.advanceAmount || 0);
      const remainingAfterPayment = (currentPayments.totalAmount || 0) - (totalPaid + newPayment.amount);
      const isFinalPayment = remainingAfterPayment <= 0;

      if (!isFinalPayment && !nextPaymentDate) {
        toast.error('Please set the next payment date');
        return;
      }

      await updateDoc(projectRef, {
        'payments.paymentHistory': arrayUnion({
          ...newPayment,
          date: new Date().toISOString().split('T')[0],
          status: 'success'
        }),
        'payments.nextPaymentDate': isFinalPayment ? null : nextPaymentDate
      });

      await createNotification(
        projectData.clientEmail,
        'Payment Received',
        `A payment of ₹${newPayment.amount.toLocaleString()} for project "${projectData.title}" has been confirmed.`,
        'payment_update',
        '/customer/dashboard/projects'
      );

      setNewPayment({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        type: 'installment' as PaymentType,
        notes: '',
        paymentMethod: 'cash' as PaymentMethod,
        status: 'success'
      });
      setNextPaymentDate('');
      setShowPaymentForm(false);
      fetchProjects();
      toast.success('Payment added successfully');
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to add payment');
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject({
      ...project,
      payments: {
        ...project.payments,
        paymentHistory: Array.isArray(project.payments.paymentHistory) ? project.payments.paymentHistory : []
      }
    });
    setShowPaymentForm(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        const projectRef = doc(db, 'projects', projectId);
        await deleteDoc(projectRef);
        setProjects(projects.filter(p => p.id !== projectId));
        toast.success('Project deleted successfully');
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      }
    }
  };

  const handleEditDetails = (project: Project) => {
    setEditingProject(project);
    setEditingProjectData({
      ...project,
      id: project.id,
      workers: project.workers || [],
      address: project.address || {
        street: '',
        city: '',
        state: '',
        pincode: ''
      }
    });
    setShowEditModal(true);
  };

  const handleUpdateProject = async () => {
    try {
      if (!editingProjectData?.id) {
        toast.error('Project ID is missing');
        return;
      }

      const projectRef = doc(db, 'projects', editingProjectData.id);

      const updateData = {
        title: editingProjectData.title,
        client: editingProjectData.client,
        clientEmail: editingProjectData.clientEmail,
        clientPhone: editingProjectData.clientPhone,
        status: editingProjectData.status,
        location: editingProjectData.location,
        description: editingProjectData.description,
        address: {
          street: editingProjectData.address?.street || '',
          city: editingProjectData.address?.city || '',
          state: editingProjectData.address?.state || '',
          pincode: editingProjectData.address?.pincode || ''
        },
        budget: Number(editingProjectData.budget) || 0,
        'payments.totalAmount': Number(editingProjectData.payments?.totalAmount) || Number(editingProjectData.budget) || 0
      };

      const oldStatus = projects.find(p => p.id === editingProjectData.id)?.status;
      await updateDoc(projectRef, updateData);

      if (oldStatus !== editingProjectData.status) {
        await createNotification(
          editingProjectData.clientEmail,
          'Project Status Updated',
          `Your project "${editingProjectData.title}" status has changed to ${editingProjectData.status}.`,
          'project_update',
          '/customer/dashboard/projects'
        );
      } else {
        await createNotification(
          editingProjectData.clientEmail,
          'Project Details Updated',
          `The details for your project "${editingProjectData.title}" have been updated.`,
          'project_update',
          '/customer/dashboard/projects'
        );
      }

      await fetchProjects();

      setShowEditModal(false);
      setEditingProject(null);
      setEditingProjectData(null);

      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleAddWorker = () => {
    if (!editingProjectData) return;

    const newWorker: ProjectWorker = {
      id: editingProjectData.id,
      name: editingProjectData.client,
      role: editingProjectData.client,
      email: editingProjectData.clientEmail,
      phone: editingProjectData.clientPhone,
      status: 'active',
      assignedTasks: [],
      position: editingProjectData.client,
      department: '',
      contactNumber: editingProjectData.clientPhone
    };

    setEditingProjectData({
      ...editingProjectData,
      workers: [...(editingProjectData.workers || []), newWorker]
    });
  };

  const handleRemoveWorker = (workerId: string) => {
    if (!editingProjectData) return;

    setEditingProjectData({
      ...editingProjectData,
      workers: (editingProjectData.workers || []).filter(w => w.id !== workerId)
    });
  };

  const handleWorkerChange = (workerId: string, field: keyof ProjectWorker, value: any) => {
    if (!editingProjectData) return;

    setEditingProjectData({
      ...editingProjectData,
      workers: (editingProjectData.workers || []).map(worker =>
        worker.id === workerId
          ? { ...worker, [field]: field === 'assignedTasks' ? value.split(',').map((task: string) => task.trim()) : value }
          : worker
      )
    });
  };

  const uniqueStatuses = [...new Set(projects.map(p => p.status))];
  const uniquePaymentStatuses = [...new Set(projects.map(p => p.payments.paymentStatus))];

  const getSearchSuggestions = (query: string) => {
    if (!query) return [];
    const suggestions = [];

    suggestions.push(...projects
      .filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
      .map(p => ({ type: 'Project', value: p.title })));

    suggestions.push(...projects
      .filter(p => p.client.toLowerCase().includes(query.toLowerCase()))
      .map(p => ({ type: 'Client', value: p.client })));

    suggestions.push(...projects
      .filter(p => p.location.toLowerCase().includes(query.toLowerCase()))
      .map(p => ({ type: 'Location', value: p.location })));

    return suggestions.slice(0, 5);
  };

  const filteredProjects = projects.filter(project => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      project.title.toLowerCase().includes(searchLower) ||
      project.client.toLowerCase().includes(searchLower) ||
      project.location.toLowerCase().includes(searchLower);

    const matchesStatus = !filters.status || project.status === filters.status;
    const matchesPaymentStatus = !filters.paymentStatus ||
      project.payments.paymentStatus === filters.paymentStatus;

    const matchesBudget =
      (!filters.budgetMin || project.budget >= Number(filters.budgetMin)) &&
      (!filters.budgetMax || project.budget <= Number(filters.budgetMax));

    let matchesDateRange = true;
    if (filters.dateRange !== 'all') {
      const today = new Date();
      const projectDate = new Date(project.payments.nextPaymentDate);
      const diffDays = Math.ceil((projectDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      switch (filters.dateRange) {
        case 'week':
          matchesDateRange = diffDays <= 7;
          break;
        case 'month':
          matchesDateRange = diffDays <= 30;
          break;
        case 'quarter':
          matchesDateRange = diffDays <= 90;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesPaymentStatus &&
      matchesBudget && matchesDateRange;
  });

  const resetFilters = () => {
    setFilters({
      status: '',
      budgetMin: '',
      budgetMax: '',
      dateRange: 'all',
      paymentStatus: ''
    });
    setCurrentPage(1);
  };

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const renderPaymentOverview = (project: Project) => {
    const totalAmount = project.payments?.totalAmount || 0;
    const advanceAmount = project.payments?.advanceAmount || 0;
    const paymentHistory = project.payments?.paymentHistory || [];

    const totalPaid = paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0) + advanceAmount;

    const remainingAmount = totalAmount - totalPaid;

    const advancePercentage = totalAmount > 0 ? ((advanceAmount / totalAmount) * 100).toFixed(2) : "0";
    const totalPaidPercentage = totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(2) : "0";
    const remainingPercentage = totalAmount > 0 ? ((remainingAmount / totalAmount) * 100).toFixed(2) : "0";

    const isOverdue = project.payments?.nextPaymentDate && new Date(project.payments.nextPaymentDate) < new Date();

    return (
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-8">
        <h2 className="text-xl font-black text-gray-800 mb-8 tracking-tight">Project Payment Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#E6F0FF] p-6 rounded-[1.5rem] border border-blue-100">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Initial Advance</h3>
            <div className="text-3xl font-black text-[#1E40AF]">₹{advanceAmount.toLocaleString()}</div>
            <div className="text-xs font-bold text-blue-500 mt-2">{advancePercentage}% of total</div>
          </div>
          <div className="bg-[#E6FBF2] p-6 rounded-[1.5rem] border border-emerald-100">
            <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Total Paid</h3>
            <div className="text-3xl font-black text-[#065F46]">₹{totalPaid.toLocaleString()}</div>
            <div className="text-xs font-bold text-emerald-500 mt-2">{totalPaidPercentage}% of total</div>
          </div>
          <div className="bg-[#FFF1F2] p-6 rounded-[1.5rem] border border-rose-100">
            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-3">Remaining Amount</h3>
            <div className="text-3xl font-black text-[#9F1239]">₹{remainingAmount.toLocaleString()}</div>
            <div className="text-xs font-bold text-rose-500 mt-2">{remainingPercentage}% remaining</div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-bold text-gray-400">Next Payment Date:</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg font-bold text-gray-700">{project.payments?.nextPaymentDate || 'Not Scheduled'}</p>
                <NextPaymentEditor project={project} onUpdate={fetchProjects} />
              </div>
            </div>
          </div>
          {isOverdue && (
            <div className="px-4 py-1.5 bg-rose-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest animate-pulse">
              Overdue
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!showEditModal || !editingProjectData) return null;

    return (
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center gap-3 mb-8">
            <PencilSquareIcon className="w-8 h-8 text-indigo-600" />
            <h3 className="text-3xl font-black text-gray-800">Edit Project Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Project Title</label>
              <input
                type="text"
                value={editingProjectData.title}
                onChange={(e) => setEditingProjectData({ ...editingProjectData, title: e.target.value })}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Status</label>
              <select
                value={editingProjectData.status}
                onChange={(e) => setEditingProjectData({ ...editingProjectData, status: e.target.value })}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
              >
                <option value="planning">Planning</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on hold">On Hold</option>
              </select>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Project Value (Budget)</label>
              <div className="relative">
                <input
                  type="number"
                  value={editingProjectData.payments?.totalAmount || editingProjectData.budget || 0}
                  onChange={(e) => setEditingProjectData({
                    ...editingProjectData,
                    budget: parseFloat(e.target.value) || 0,
                    payments: { ...editingProjectData.payments, totalAmount: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full pl-10 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                  placeholder="Enter total project value"
                />
                <CurrencyRupeeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-black text-gray-600 uppercase tracking-widest">Client Information</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Client Name"
                  value={editingProjectData.client}
                  onChange={(e) => setEditingProjectData({ ...editingProjectData, client: e.target.value })}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                />
                <input
                  type="email"
                  placeholder="Client Email"
                  value={editingProjectData.clientEmail}
                  onChange={(e) => setEditingProjectData({ ...editingProjectData, clientEmail: e.target.value })}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                />
              </div>
            </div>

            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-black text-gray-600 uppercase tracking-widest">Site Address</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Street Address"
                  value={editingProjectData.address?.street || ''}
                  onChange={(e) => setEditingProjectData({
                    ...editingProjectData,
                    address: { ...editingProjectData.address, street: e.target.value }
                  })}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={editingProjectData.address?.city || ''}
                    onChange={(e) => setEditingProjectData({
                      ...editingProjectData,
                      address: { ...editingProjectData.address, city: e.target.value }
                    })}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                  />
                  <input
                    type="text"
                    placeholder="PIN Code"
                    value={editingProjectData.address?.pincode || ''}
                    onChange={(e) => setEditingProjectData({
                      ...editingProjectData,
                      address: { ...editingProjectData.address, pincode: e.target.value }
                    })}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 flex gap-4 pt-6 mt-6 border-t border-gray-100">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProject}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderOverallStatistics = () => {
    const totalStatistics = projects.reduce((stats, project) => {
      const totalAmount = project.payments?.totalAmount || 0;
      const advanceAmount = project.payments?.advanceAmount || 0;
      const paymentHistory = project.payments?.paymentHistory || [];
      const totalPaid = paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0) + advanceAmount;
      const remainingAmount = totalAmount - totalPaid;

      const cashPayments = paymentHistory.reduce((sum, payment) =>
        payment.paymentMethod === 'cash' ? sum + (payment.amount || 0) : sum, 0);
      const bankPayments = paymentHistory.reduce((sum, payment) =>
        payment.paymentMethod === 'bank' ? sum + (payment.amount || 0) : sum, 0);
      const upiPayments = paymentHistory.reduce((sum, payment) =>
        payment.paymentMethod === 'upi' ? sum + (payment.amount || 0) : sum, 0);

      const isActive = project.status.toLowerCase() === 'in progress' || project.status.toLowerCase() === 'planning';
      const isDone = project.status.toLowerCase() === 'completed';

      return {
        totalProjects: stats.totalProjects + 1,
        totalAmount: stats.totalAmount + totalAmount,
        totalAdvance: stats.totalAdvance + advanceAmount,
        totalPaid: stats.totalPaid + totalPaid,
        totalRemaining: stats.totalRemaining + remainingAmount,
        completedProjects: stats.completedProjects + (isDone ? 1 : 0),
        activeProjects: stats.activeProjects + (isActive ? 1 : 0),
        cashPayments: stats.cashPayments + cashPayments,
        bankPayments: stats.bankPayments + bankPayments,
        upiPayments: stats.upiPayments + upiPayments
      };
    }, {
      totalProjects: 0,
      totalAmount: 0,
      totalAdvance: 0,
      totalPaid: 0,
      totalRemaining: 0,
      completedProjects: 0,
      activeProjects: 0,
      cashPayments: 0,
      bankPayments: 0,
      upiPayments: 0
    });

    const collectionPercentage = totalStatistics.totalAmount >
      0
      ? ((totalStatistics.totalPaid / totalStatistics.totalAmount) * 100).toFixed(1)
      : "0";
    const remainingPercentage = totalStatistics.totalAmount > 0
      ? ((totalStatistics.totalRemaining / totalStatistics.totalAmount) * 100).toFixed(1)
      : "0";
    const projectCompletionRate = totalStatistics.totalProjects > 0
      ? ((totalStatistics.completedProjects / totalStatistics.totalProjects) * 100).toFixed(1)
      : "0";

    return (
      <div className="space-y-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-[#4E67E8] to-[#D946EF] bg-clip-text text-transparent">
              Payment Dashboard
            </h2>
            <p className="text-gray-500 font-medium mt-1">Real-time project and payment analytics</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-indigo-600 rounded-full"
            />
            Live
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#4176FF] rounded-3xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden"
          >
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Total Projects</p>
                <h3 className="text-4xl font-bold">{totalStatistics.totalProjects}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-xl">
                <BriefcaseIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-8 flex items-center gap-4 relative z-10">
              <div>
                <p className="text-[10px] font-bold opacity-80 uppercase">Complete</p>
                <p className="text-sm font-bold">{projectCompletionRate}%</p>
              </div>
              <div className="flex gap-2">
                <div className="px-2 py-1 bg-white/20 rounded-lg text-[10px] font-bold">
                  {totalStatistics.completedProjects} Done
                </div>
                <div className="px-2 py-1 bg-white/20 rounded-lg text-[10px] font-bold">
                  {totalStatistics.activeProjects} Active
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          </motion.div>

          {/* Contract Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#9B4DFF] rounded-3xl p-6 text-white shadow-xl shadow-purple-100 relative overflow-hidden"
          >
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Contract Value</p>
                <h3 className="text-3xl font-bold">₹{totalStatistics.totalAmount.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-xl">
                <CurrencyRupeeIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-8 relative z-10">
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Total Portfolio</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          </motion.div>

          {/* Collections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#10B981] rounded-3xl p-6 text-white shadow-xl shadow-emerald-100 relative overflow-hidden"
          >
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Collections</p>
                <h3 className="text-3xl font-bold">₹{totalStatistics.totalPaid.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-xl">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-8 relative z-10">
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{collectionPercentage}% Received</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          </motion.div>

          {/* Outstanding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#F43F5E] rounded-3xl p-6 text-white shadow-xl shadow-rose-100 relative overflow-hidden"
          >
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Outstanding</p>
                <h3 className="text-3xl font-bold">₹{totalStatistics.totalRemaining.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-xl">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-8 relative z-10">
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{remainingPercentage}% Pending</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          </motion.div>
        </div>

        {/* Doughnut Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Payment Progress",
              labels: ['Collected', 'Remaining'],
              data: [totalStatistics.totalPaid, totalStatistics.totalRemaining],
              colors: ['#34D399', '#F87171'],
              accent: "bg-emerald-500"
            },
            {
              title: "Payment Methods",
              labels: ['Cash', 'Bank', 'UPI'],
              data: [totalStatistics.cashPayments, totalStatistics.bankPayments, totalStatistics.upiPayments],
              colors: ['#FBBF24', '#60A5FA', '#A78BFA'],
              accent: "bg-blue-500"
            },
            {
              title: "Project Status",
              labels: ['Completed', 'In Progress'],
              data: [totalStatistics.completedProjects, totalStatistics.activeProjects],
              colors: ['#10B981', '#4F46E5'],
              accent: "bg-indigo-500"
            }
          ].map((chart, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-1 h-4 ${chart.accent} rounded-full`} />
                <h4 className="font-bold text-gray-800">{chart.title}</h4>
              </div>
              <div className="h-48 relative">
                <Doughnut
                  data={{
                    labels: chart.labels,
                    datasets: [{
                      data: chart.data,
                      backgroundColor: chart.colors,
                      borderWidth: 0,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                      legend: { display: false }
                    }
                  }}
                />
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                {chart.labels.map((label, lidx) => (
                  <div key={lidx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chart.colors[lidx] }} />
                    <span className="text-xs font-bold text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Overall Collection Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-end mb-4">
            <div>
              <h4 className="font-bold text-xl text-gray-800">Collection Progress</h4>
              <p className="text-sm text-gray-400 font-medium">Overall payment collection status</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-emerald-500 tracking-tighter">{collectionPercentage}%</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collected</p>
            </div>
          </div>
          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${collectionPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
            />
          </div>
          <div className="flex justify-between mt-3 px-1">
            <span className="text-xs font-bold text-emerald-600">₹{totalStatistics.totalPaid.toLocaleString()} Collected</span>
            <span className="text-xs font-bold text-rose-500">₹{totalStatistics.totalRemaining.toLocaleString()} Remaining</span>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderPaymentForm = (projectId: string) => {
    const calculateRemainingAmount = () => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return 0;

      const totalAmount = project.payments?.totalAmount || 0;
      const advanceAmount = project.payments?.advanceAmount || 0;
      const paymentHistory = project.payments?.paymentHistory || [];
      const totalPaid = paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0) + advanceAmount;
      return totalAmount - totalPaid;
    };

    const remainingAmount = calculateRemainingAmount();
    const willBeFinalPayment = remainingAmount > 0 && newPayment.amount >= remainingAmount;

    return (
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <PlusIcon className="w-6 h-6 text-indigo-600" />
            <h3 className="text-2xl font-black text-gray-800">Add New Payment</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                  placeholder="Enter amount"
                />
                <CurrencyRupeeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <div className="mt-2 text-xs font-bold text-rose-500 px-1">Remaining: ₹{remainingAmount.toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Type</label>
                <select
                  value={newPayment.type}
                  onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as PaymentType })}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                >
                  <option value="installment">Installment</option>
                  <option value="final">Final Payment</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Method</label>
                <select
                  value={newPayment.paymentMethod}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
            </div>

            {!willBeFinalPayment && (
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Next Payment Date</label>
                <input
                  type="date"
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Notes</label>
              <textarea
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800 min-h-[100px]"
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddPayment(projectId)}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-colors"
              >
                Add Payment
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Loading dashboard insights...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-gray-50 min-h-screen">
      {renderOverallStatistics()}

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 mb-12"
      >
        <div className="flex items-center gap-3 mb-6">
          <MagnifyingGlassIcon className="w-6 h-6 text-indigo-600" />
          <h4 className="font-bold text-xl text-gray-800">Search & Filter Projects</h4>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects, clients, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 placeholder:text-gray-400 shadow-inner"
          />
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <AdjustmentsHorizontalIcon
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 cursor-pointer hover:text-indigo-600 transition-colors"
          />
        </div>

        <AnimatePresence>
          {showAdvancedSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-100">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                  >
                    <option value="">All Statuses</option>
                    {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Timeline</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Coming Week</option>
                    <option value="month">Coming Month</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Project Listings */}
      <div className="space-y-12">
        {currentProjects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {renderPaymentOverview(project)}

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="p-8 md:p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">{project.title}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider">
                      {project.status}
                    </span>
                    <span className="text-2xl font-black text-gray-400 mx-1">·</span>
                    <span className="text-xl font-black text-gray-800">₹{(project.payments?.totalAmount || project.budget || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => handleEditDetails(project)} className="p-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all">
                    <PencilSquareIcon className="w-6 h-6" />
                  </button>
                  <button onClick={() => handleEditProject(project)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                    <PlusIcon className="w-5 h-5" />
                    Add Payment
                  </button>
                  <button onClick={() => handleDeleteProject(project.id)} className="px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all">
                    Delete Project
                  </button>
                </div>
              </div>

              {/* Customer Information Grid */}
              <div className="bg-[#F8FAFC] p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <UserIcon className="w-6 h-6 text-gray-400" />
                  <h4 className="font-black text-xl text-gray-800">Customer Information</h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Client Details */}
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                      <h5 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Client Details</h5>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Name:</p>
                        <p className="text-lg font-black text-gray-800">{project.client}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Email:</p>
                        <p className="text-sm font-bold text-indigo-600 break-all">{project.clientEmail}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Phone:</p>
                        <p className="text-lg font-black text-gray-800">{project.clientPhone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Site Address */}
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                      <h5 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Site Address</h5>
                    </div>
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-gray-700 leading-relaxed">
                        {project.address?.street}<br />
                        {project.address?.city}, {project.address?.state}<br />
                        PIN: {project.address?.pincode}
                      </p>
                      <div className="pt-4 border-t border-gray-50">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Location:</p>
                        <p className="text-sm font-bold text-gray-600">{project.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-4 bg-purple-500 rounded-full" />
                      <h5 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Project Info</h5>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Budget:</p>
                        <p className="text-lg font-black text-gray-800">₹{(project.payments?.totalAmount || project.budget || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Status:</p>
                        <p className="text-lg font-black text-gray-800">{project.status}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Description:</p>
                        <p className="text-sm text-gray-500 font-medium line-clamp-4">{project.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Payments Section */}
              <div className="p-8 md:p-10 border-t border-gray-50 bg-[#F8FAFC]/50">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-black text-xl text-gray-800">Recent Payments</h4>
                </div>
                <div className="space-y-4">
                  {project.payments?.paymentHistory && project.payments.paymentHistory.length > 0 ? (
                    project.payments.paymentHistory.slice().reverse().slice(0, 2).map((payment, pidx) => (
                      <div key={pidx} className="flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                          <p className="text-base font-black text-gray-800">{new Date(payment.date).toLocaleDateString('en-GB')}</p>
                        </div>
                        <p className="text-xl font-black text-gray-900 leading-none">₹{payment.amount.toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                      <p className="text-gray-400 font-bold italic">No payments recorded yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Complete Payment History Section */}
              <div className="p-8 md:p-10 border-t border-gray-50">
                <h4 className="font-black text-xl text-gray-800 mb-8">Complete Payment History</h4>
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F1F5F9]/50 border-b border-gray-50">
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {project.payments?.paymentHistory && project.payments.paymentHistory.length > 0 ? (
                          project.payments.paymentHistory.slice().reverse().map((payment, pidx) => (
                            <tr key={pidx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-5 font-black text-gray-800 text-sm">
                                {new Date(payment.date).toLocaleDateString('en-GB')}
                              </td>
                              <td className="px-6 py-5 font-black text-gray-900 text-base">
                                ₹{payment.amount.toLocaleString()}
                              </td>
                              <td className="px-6 py-5 text-xs font-bold text-gray-500 italic">
                                {payment.type}
                              </td>
                              <td className="px-6 py-5 text-sm font-bold text-gray-700">
                                {payment.paymentMethod}
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                    {payment.status}
                                  </span>
                                  {payment.status === 'success' && project.clientEmail && (
                                    <div className="transform scale-90">
                                      <SendPaymentReceiptButton
                                        project={project}
                                        payment={payment}
                                        totalPaid={project.payments?.totalAmount || 0}
                                        remainingAmount={project.payments?.totalAmount -
                                          ((project.payments?.advanceAmount || 0) +
                                            (project.payments?.paymentHistory || []).reduce((sum, p) => sum + (p.amount || 0), 0))}
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold italic">
                              No complete history available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProjects.length > 0 && (
        <div className="mt-12 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex justify-center items-center gap-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#E2E8F0] text-gray-600 hover:bg-gray-200'
              }`}
          >
            Previous
          </button>

          <div className="flex items-center gap-3">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => handlePageChange(number)}
                className={`w-12 h-12 rounded-xl font-black text-sm transition-all ${currentPage === number
                  ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-100'
                  : 'bg-[#E2E8F0] text-gray-500 hover:bg-gray-200'
                  }`}
              >
                {number}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#2563EB] text-white shadow-lg shadow-blue-100 hover:bg-blue-700'
              }`}
          >
            Next
          </button>
        </div>
      )}

      {filteredProjects.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No projects found matching your search criteria.</p>
        </div>
      )}

      {showPaymentForm && editingProject && (
        renderPaymentForm(editingProject.id)
      )}

      {renderEditModal()}

      <ToastContainer />
    </div>
  );
};

export default ProjectOverview;