import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Project {
  id: string;
  title: string;
  client: string;
  budget: number;
  dueDate: string;
  progress: number;
  status: string;
  payments: {
    advanceAmount: number;
    totalAmount: number;
  };
}

interface DashboardData {
  totalProjects: number;
  teamMembers: number;
  totalBlogs: number;
  totalQueries: number;
  recentProjects: Project[];
  inProgressProjects: Project[];
  totalInProgressProjects: number;
}

const processProjectData = (doc: DocumentData): Project => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || '',
    client: data.client || '',
    budget: Number(data.budget) || 0,
    dueDate: data.dueDate || '',
    progress: Number(data.progress) || 0,
    status: data.status || 'Planning',
    payments: {
      advanceAmount: Number(data.payments?.advanceAmount) || 0,
      totalAmount: Number(data.payments?.totalAmount) || 0
    }
  };
};

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    totalProjects: 0,
    teamMembers: 0,
    totalBlogs: 0,
    totalQueries: 0,
    recentProjects: [],
    inProgressProjects: [],
    totalInProgressProjects: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all collections in parallel
        const [
          projectsSnapshot,
          blogsSnapshot,
          queriesSnapshot,
          employeesSnapshot
        ] = await Promise.all([
          getDocs(collection(db, 'projects')),
          getDocs(collection(db, 'blogs')),
          getDocs(collection(db, 'enquiries')),
          getDocs(collection(db, 'employees'))
        ]);

        if (!isMounted) return;

        // Get total counts
        const totalProjects = projectsSnapshot.size;
        const totalBlogs = blogsSnapshot.size;
        const totalQueries = queriesSnapshot.size;
        const teamMembers = employeesSnapshot.size;

        // Process all projects
        const allProjects = projectsSnapshot.docs.map(processProjectData);

        // Get recent projects (last 5)
        const recentProjects = allProjects
          .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
          .slice(0, 5);

        // Get in-progress projects
        const allInProgressProjects = allProjects.filter(project => project.status === 'In Progress');
        const inProgressProjects = allInProgressProjects
          .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
          .slice(0, 5);

        if (isMounted) {
          setData({
            totalProjects,
            teamMembers,
            totalBlogs,
            totalQueries,
            recentProjects,
            inProgressProjects,
            totalInProgressProjects: allInProgressProjects.length
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error };
};
