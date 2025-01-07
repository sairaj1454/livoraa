import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Project, PaymentHistory, PaymentSchedule, ProjectWorker } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

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
    type: 'installment',
    notes: '',
    paymentMethod: 'cash',
    status: 'pending'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const projectsQuery = query(collection(db, 'projects'));
      const querySnapshot = await getDocs(projectsQuery);
      const projectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (projectId: string) => {
    if (!editingProject) return;
    
    try {
      // Ensure paymentHistory exists and is an array
      const currentPaymentHistory = Array.isArray(editingProject.payments.paymentHistory) 
        ? editingProject.payments.paymentHistory 
        : [];

      const updatedPaymentHistory: PaymentHistory[] = [
        ...currentPaymentHistory,
        { ...newPayment, status: 'success' as const }
      ];
      
      const newAdvanceAmount = editingProject.payments.advanceAmount + newPayment.amount;
      const newRemainingAmount = editingProject.payments.totalAmount - newAdvanceAmount;
      
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        'payments.paymentHistory': updatedPaymentHistory,
        'payments.advanceAmount': newAdvanceAmount,
        'payments.remainingAmount': newRemainingAmount
      });
      
      setEditingProject({
        ...editingProject,
        payments: {
          ...editingProject.payments,
          paymentHistory: updatedPaymentHistory,
          advanceAmount: newAdvanceAmount,
          remainingAmount: newRemainingAmount
        }
      });
      
      // Update projects list
      setProjects(projects.map(p => 
        p.id === projectId 
          ? {
              ...p,
              payments: {
                ...p.payments,
                paymentHistory: updatedPaymentHistory,
                advanceAmount: newAdvanceAmount,
                remainingAmount: newRemainingAmount
              }
            }
          : p
      ));
      
      toast.success('Payment added successfully');
      setShowPaymentForm(false);
      
      // Reset payment form
      setNewPayment({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        type: 'installment',
        notes: '',
        paymentMethod: 'cash',
        status: 'pending'
      });
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
    setEditingProjectData(project);
    setShowEditModal(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProjectData) return;

    try {
      const projectRef = doc(db, 'projects', editingProjectData.id);
      await updateDoc(projectRef, {
        title: editingProjectData.title,
        description: editingProjectData.description,
        client: editingProjectData.client,
        clientEmail: editingProjectData.clientEmail,
        clientPhone: editingProjectData.clientPhone,
        status: editingProjectData.status,
        location: editingProjectData.location,
        budget: editingProjectData.budget,
        address: editingProjectData.address,
        workers: editingProjectData.workers || []
      });

      setProjects(projects.map(p => 
        p.id === editingProjectData.id ? editingProjectData : p
      ));

      toast.success('Project updated successfully');
      setShowEditModal(false);
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
      position: editingProjectData.client,  // Using role as position
      department: '',         // Default empty department
      contactNumber: editingProjectData.clientPhone  // Using phone as contactNumber
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

  // Get unique values for filters
  const uniqueStatuses = [...new Set(projects.map(p => p.status))];
  const uniquePaymentStatuses = [...new Set(projects.map(p => p.payments.paymentStatus))];

  // Get search suggestions
  const getSearchSuggestions = (query: string) => {
    if (!query) return [];
    const suggestions = [];
    
    // Project titles
    suggestions.push(...projects
      .filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
      .map(p => ({ type: 'Project', value: p.title })));
    
    // Client names
    suggestions.push(...projects
      .filter(p => p.client.toLowerCase().includes(query.toLowerCase()))
      .map(p => ({ type: 'Client', value: p.client })));
    
    // Locations
    suggestions.push(...projects
      .filter(p => p.location.toLowerCase().includes(query.toLowerCase()))
      .map(p => ({ type: 'Location', value: p.location })));

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  };

  // Filter projects based on all criteria
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

  // Get current project
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  // Change page
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Edit Project Modal */}
      {showEditModal && editingProjectData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Edit Project Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                <input
                  type="text"
                  value={editingProjectData.title}
                  onChange={(e) => setEditingProjectData({
                    ...editingProjectData,
                    title: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input
                  type="text"
                  value={editingProjectData.client}
                  onChange={(e) => setEditingProjectData({
                    ...editingProjectData,
                    client: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                <input
                  type="email"
                  value={editingProjectData.clientEmail}
                  onChange={(e) => setEditingProjectData({
                    ...editingProjectData,
                    clientEmail: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Phone</label>
                <input
                  type="tel"
                  value={editingProjectData.clientPhone}
                  onChange={(e) => setEditingProjectData({
                    ...editingProjectData,
                    clientPhone: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editingProjectData.status}
                  onChange={(e) => setEditingProjectData({
                    ...editingProjectData,
                    status: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editingProjectData.location}
                  onChange={(e) => setEditingProjectData({
                    ...editingProjectData,
                    location: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  value={editingProjectData.budget}
                  onChange={(e) => setEditingProjectData({
                    ...editingProjectData,
                    budget: Number(e.target.value)
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingProjectData.description}
                  onChange={(e) => setEditingProjectData({
                    ...editingProjectData,
                    description: e.target.value
                  })}
                  rows={3}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="col-span-2">
                <h4 className="font-medium mb-2">Address</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                    <input
                      type="text"
                      value={editingProjectData.address.street}
                      onChange={(e) => setEditingProjectData({
                        ...editingProjectData,
                        address: {
                          ...editingProjectData.address,
                          street: e.target.value
                        }
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={editingProjectData.address.city}
                      onChange={(e) => setEditingProjectData({
                        ...editingProjectData,
                        address: {
                          ...editingProjectData.address,
                          city: e.target.value
                        }
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={editingProjectData.address.state}
                      onChange={(e) => setEditingProjectData({
                        ...editingProjectData,
                        address: {
                          ...editingProjectData.address,
                          state: e.target.value
                        }
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editingProjectData.address.pincode}
                      onChange={(e) => setEditingProjectData({
                        ...editingProjectData,
                        address: {
                          ...editingProjectData.address,
                          pincode: e.target.value
                        }
                      })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Workers Section */}
              <div className="col-span-2 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Project Workers</h4>
                  <button
                    onClick={handleAddWorker}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Add Worker
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(editingProjectData.workers || []).map((worker, index) => (
                    <div key={worker.id} className="bg-gray-50 p-4 rounded">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-medium">Worker #{index + 1}</h5>
                        <button
                          onClick={() => handleRemoveWorker(worker.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={worker.name}
                            onChange={(e) => handleWorkerChange(worker.id, 'name', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <input
                            type="text"
                            value={worker.role}
                            onChange={(e) => handleWorkerChange(worker.id, 'role', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={worker.email}
                            onChange={(e) => handleWorkerChange(worker.id, 'email', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={worker.phone}
                            onChange={(e) => handleWorkerChange(worker.id, 'phone', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={worker.status}
                            onChange={(e) => handleWorkerChange(worker.id, 'status', e.target.value)}
                            className="w-full p-2 border rounded"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Tasks</label>
                          <input
                            type="text"
                            value={worker.assignedTasks?.join(', ') || ''}
                            onChange={(e) => handleWorkerChange(
                              worker.id,
                              'assignedTasks',
                              e.target.value
                            )}
                            placeholder="Task1, Task2, Task3"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProject}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="mb-6 space-y-4">
        {/* Main Search with Suggestions */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by project title, client name, or location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchSuggestions(true);
                setCurrentPage(1);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="text-gray-400 hover:text-gray-600"
                title="Advanced Search"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Search Suggestions Dropdown */}
          {showSearchSuggestions && searchQuery && (
            <div 
              className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border"
              onMouseDown={(e) => e.preventDefault()}
            >
              {getSearchSuggestions(searchQuery).map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                  onClick={() => {
                    setSearchQuery(suggestion.value);
                    setShowSearchSuggestions(false);
                    setCurrentPage(1);
                  }}
                >
                  <span className="text-gray-500 text-sm">{suggestion.type}:</span>
                  <span>{suggestion.value}</span>
                </button>
              ))}
              {getSearchSuggestions(searchQuery).length === 0 && (
                <div className="px-4 py-2 text-gray-500">No suggestions found</div>
              )}
            </div>
          )}
        </div>

        {/* Advanced Search */}
        {showAdvancedSearch && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All Statuses</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All Payment Statuses</option>
                  {uniquePaymentStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Payment Due</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="all">All Time</option>
                  <option value="week">Within 1 Week</option>
                  <option value="month">Within 1 Month</option>
                  <option value="quarter">Within 3 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.budgetMin}
                    onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.budgetMax}
                    onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(filters.status || filters.paymentStatus || filters.dateRange !== 'all' || 
          filters.budgetMin || filters.budgetMax) && (
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Status: {filters.status}
                <button
                  onClick={() => setFilters({ ...filters, status: '' })}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.paymentStatus && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Payment: {filters.paymentStatus}
                <button
                  onClick={() => setFilters({ ...filters, paymentStatus: '' })}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.dateRange !== 'all' && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Due: {filters.dateRange}
                <button
                  onClick={() => setFilters({ ...filters, dateRange: 'all' })}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {(filters.budgetMin || filters.budgetMax) && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Budget: {filters.budgetMin || '0'} - {filters.budgetMax || '∞'}
                <button
                  onClick={() => setFilters({ ...filters, budgetMin: '', budgetMax: '' })}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Overall Payment Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Overall Payment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium mb-3">Total Statistics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Budget:</span>
                <span className="font-medium">₹{projects.reduce((sum, p) => sum + p.payments.totalAmount, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Collected:</span>
                <span className="font-medium text-green-600">₹{projects.reduce((sum, p) => sum + p.payments.advanceAmount, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Remaining:</span>
                <span className="font-medium text-red-600">₹{projects.reduce((sum, p) => sum + p.payments.remainingAmount, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Overall Payment Progress Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium mb-2">Overall Payment Progress</h4>
            <div style={{ height: '200px' }}>
              <Doughnut
                data={{
                  labels: ['Collected', 'Remaining'],
                  datasets: [{
                    data: [
                      projects.reduce((sum, p) => sum + p.payments.advanceAmount, 0),
                      projects.reduce((sum, p) => sum + p.payments.remainingAmount, 0)
                    ],
                    backgroundColor: [
                      'rgba(34, 197, 94, 0.6)',
                      'rgba(239, 68, 68, 0.6)'
                    ],
                    borderColor: [
                      'rgba(34, 197, 94, 1)',
                      'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Payment Methods Distribution Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium mb-2">Payment Methods Distribution</h4>
            <div style={{ height: '200px' }}>
              <Doughnut
                data={{
                  labels: ['Cash', 'Bank', 'UPI'],
                  datasets: [{
                    data: [
                      projects.reduce((sum, p) => sum + (
                        Array.isArray(p.payments.paymentHistory) 
                          ? p.payments.paymentHistory.filter(payment => payment.paymentMethod === 'cash')
                              .reduce((acc, payment) => acc + payment.amount, 0)
                          : 0
                      ), 0),
                      projects.reduce((sum, p) => sum + (
                        Array.isArray(p.payments.paymentHistory)
                          ? p.payments.paymentHistory.filter(payment => payment.paymentMethod === 'bank')
                              .reduce((acc, payment) => acc + payment.amount, 0)
                          : 0
                      ), 0),
                      projects.reduce((sum, p) => sum + (
                        Array.isArray(p.payments.paymentHistory)
                          ? p.payments.paymentHistory.filter(payment => payment.paymentMethod === 'upi')
                              .reduce((acc, payment) => acc + payment.amount, 0)
                          : 0
                      ), 0)
                    ],
                    backgroundColor: [
                      'rgba(234, 179, 8, 0.6)',
                      'rgba(59, 130, 246, 0.6)',
                      'rgba(147, 51, 234, 0.6)'
                    ],
                    borderColor: [
                      'rgba(234, 179, 8, 1)',
                      'rgba(59, 130, 246, 1)',
                      'rgba(147, 51, 234, 1)'
                    ],
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="grid gap-6">
        {currentProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold">{project.title}</h3>
                <p className="text-gray-600">Client: {project.client}</p>
              </div>
              <div className="space-x-2 mt-2 md:mt-0">
                <button
                  onClick={() => handleEditDetails(project)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => handleEditProject(project)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Payment
                </button>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Project
                </button>
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Project Budget</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-medium">₹{project.payments.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Initial Advance:</span>
                    <span className="font-medium text-blue-600">
                      ₹{project.payments.advanceAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid:</span>
                    <span className="font-medium text-green-600">
                      ₹{(project.payments.advanceAmount + 
                         (Array.isArray(project.payments.paymentHistory) 
                          ? project.payments.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
                          : 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="font-medium text-red-600">₹{project.payments.remainingAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Progress */}
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Payment Progress</h4>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        Progress
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {((project.payments.advanceAmount / project.payments.totalAmount) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div
                      style={{
                        width: `${(project.payments.advanceAmount / project.payments.totalAmount) * 100}%`
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    ></div>
                  </div>
                </div>
              </div>

              {/* Latest Payments */}
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Latest Payments</h4>
                <div className="space-y-2">
                  {Array.isArray(project.payments.paymentHistory) && project.payments.paymentHistory.length > 0 ? (
                    project.payments.paymentHistory.slice(-3).reverse().map((payment, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div>
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            payment.type === 'advance' ? 'bg-blue-500' :
                            payment.type === 'installment' ? 'bg-green-500' : 'bg-purple-500'
                          }`}></span>
                          <span>{new Date(payment.date).toLocaleDateString()}</span>
                        </div>
                        <span className="font-medium">₹{payment.amount.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No payment history</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment History Table */}
            {project.payments?.paymentHistory && project.payments.paymentHistory.length > 0 && (
              <div className="mt-4">
                <h4 className="text-lg font-medium mb-2">Payment History</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {project.payments.paymentHistory.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{payment.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.paymentMethod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.status === 'success' ? 'bg-green-100 text-green-800' :
                              payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {filteredProjects.length > 0 && (
        <div className="mt-6 flex justify-center items-center space-x-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => handlePageChange(number)}
                className={`w-8 h-8 rounded ${
                  currentPage === number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {number}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded ${
              currentPage === totalPages
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
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

      {/* Payment Form Modal */}
      {showPaymentForm && editingProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Add Payment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={newPayment.amount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setNewPayment({
                          ...newPayment,
                          amount: Number(value) || 0
                        });
                      }}
                      className="w-full p-2 pl-8 border rounded-md"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({
                      ...newPayment,
                      date: e.target.value
                    })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                  <select
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({
                      ...newPayment,
                      type: e.target.value as 'advance' | 'installment' | 'final'
                    })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="advance">Advance</option>
                    <option value="installment">Installment</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment({
                      ...newPayment,
                      paymentMethod: e.target.value as 'cash' | 'bank' | 'upi'
                    })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({
                      ...newPayment,
                      notes: e.target.value
                    })}
                    className="w-full p-2 border rounded-md"
                    placeholder="Add notes (optional)"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end space-x-2">
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddPayment(editingProject.id)}
                  disabled={!newPayment.amount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer />
    </div>
  );
};

export default ProjectOverview;