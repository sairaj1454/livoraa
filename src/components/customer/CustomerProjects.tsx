import React, { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';

interface Project {
  id: string;
  title: string;
  status: string;
  startDate: string;
  dueDate: string;
  description: string;
  advanceAmount: number;
  totalAmount: number;
  paymentStatus: string;
}

const CustomerProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const advanceAmount = data.advanceAmount || 0;
        const totalAmount = data.totalAmount || 0;
        
        // Calculate payment status
        let paymentStatus = "Pending";
        if (advanceAmount > 0) {
          if (advanceAmount >= totalAmount) {
            paymentStatus = "Paid";
          } else {
            paymentStatus = "Partially Paid";
          }
        }

        projectsList.push({
          id: doc.id,
          title: data.title,
          status: data.status,
          startDate: new Date(data.startDate).toLocaleDateString(),
          dueDate: new Date(data.dueDate).toLocaleDateString(),
          description: data.description,
          advanceAmount,
          totalAmount,
          paymentStatus,
        });
      });

      setProjects(projectsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially paid':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found</p>
        </div>
      ) : (
        projects.map((project) => (
          <div
            key={project.id}
            className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      project.paymentStatus
                    )}`}
                  >
                    {project.paymentStatus}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{project.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <p>Start Date: {project.startDate}</p>
                  <p>Due Date: {project.dueDate}</p>
                </div>
                <div>
                  <p>Total Amount: ₹{project.totalAmount.toLocaleString()}</p>
                  <p>Advance Paid: ₹{project.advanceAmount.toLocaleString()}</p>
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
