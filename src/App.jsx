import React, { useState, useEffect } from 'react';
import { api } from './lib/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';

// Components & Pages
import { Navbar } from './components/navbar/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { ProjectFormModal } from './components/projects/ProjectFormModal';
import { ProjectDetailModal } from './components/projects/ProjectDetailModal';
import { ProfileModal } from './components/profile/ProfileModal';

import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { UsersPage } from './pages/UsersPage';

import { Database } from 'lucide-react';

const MainApp = () => {
  const { user, profile, isLiveSupabase } = useAuth();
  const { addToast } = useToast();

  const isAdmin = profile?.role === 'Admin';

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'dashboard' | 'users'

  // Data Collections State
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals Control
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Fetch persisted projects, tasks, and files through the Django API.
  const fetchAllData = async () => {
    if (!user) {
      setProjects([]);
      setTasks([]);
      setFiles([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      const [projectData, taskData, fileData] = await Promise.all([
        api.get('projects/'),
        api.get('tasks/'),
        api.get('files/')
      ]);
      setProjects(projectData || []);
      setTasks(taskData || []);
      setFiles(fileData || []);

    } catch (err) {
      console.error('Error fetching Supabase data:', err);
      addToast('Failed to load workspace data.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  // ------------------------------------------------------------------
  // PROJECT CRUD OPERATIONS
  // ------------------------------------------------------------------
  const handleSaveProject = async (projectData, editId) => {
    if (editId) {
      const updatedProject = await api.patch(`projects/${editId}/`, projectData);
      setProjects(prev => prev.map(p => p.id === editId ? updatedProject : p));
      if (selectedProject?.id === editId) {
        setSelectedProject(updatedProject);
      }
    } else {
      const newProject = await api.post('projects/', projectData);
      setProjects(prev => [newProject, ...prev]);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await api.delete(`projects/${projectId}/`);

      setProjects(prev => prev.filter(p => p.id !== projectId));
      setTasks(prev => prev.filter(t => t.project_id !== projectId));
      setFiles(prev => prev.filter(f => f.project_id !== projectId));
      
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      addToast('Project deleted successfully.', 'success');
    } catch (err) {
      console.error('Project delete failed:', err);
      addToast(err.message || 'Failed to delete project.', 'error');
    }
  };

  // ------------------------------------------------------------------
  // RELATIONAL TASK CRUD OPERATIONS
  // ------------------------------------------------------------------
  const handleAddTask = async (taskData) => {
    const newTask = await api.post('tasks/', taskData);
    setTasks(prev => [...prev, newTask]);
  };

  const handleToggleTask = async (taskId, isCompleted) => {
    try {
      const updatedTask = await api.patch(`tasks/${taskId}/`, { is_completed: isCompleted });
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      addToast(err.message || 'Failed to update task.', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`tasks/${taskId}/`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      addToast('Task removed.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to delete task.', 'error');
    }
  };

  // ------------------------------------------------------------------
  // SUPABASE STORAGE FILES OPERATIONS
  // ------------------------------------------------------------------
  const handleFileUpload = async (projectId, file) => {
    const newFile = await api.upload('files/upload/', file, { project_id: projectId });
    setFiles(prev => [newFile, ...prev]);
  };

  const handleFileDelete = async (fileId) => {
    try {
      await api.delete(`files/${fileId}/`);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      addToast('File attachment deleted.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to delete file attachment.', 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardPage
            projects={projects}
            tasks={tasks}
            files={files}
            onOpenCreate={() => {
              if (!user) {
                setIsAuthModalOpen(true);
              } else {
                setProjectToEdit(null);
                setIsProjectFormOpen(true);
              }
            }}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsPage
            projects={projects}
            tasks={tasks}
            loading={loadingData}
            onSelectProject={(proj) => setSelectedProject(proj)}
            onOpenCreate={() => {
              if (!user) {
                setIsAuthModalOpen(true);
              } else {
                setProjectToEdit(null);
                setIsProjectFormOpen(true);
              }
            }}
            onEditProject={(proj) => { setProjectToEdit(proj); setIsProjectFormOpen(true); }}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeTab === 'users' && isAdmin && (
          <UsersPage projects={projects} />
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem', marginTop: 'auto', background: '#070a12' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>NexusSpace &copy; {new Date().getFullYear()}</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: isLiveSupabase ? '#34d399' : '#38bdf8' }}>
              <Database className="w-4 h-4" /> {isLiveSupabase ? 'Cloud Supabase Active' : 'Supabase Backend Active'}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ProjectFormModal
        isOpen={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
      />

      <ProjectDetailModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        tasks={tasks}
        files={files}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
        onFileUpload={handleFileUpload}
        onFileDelete={handleFileDelete}
        onEdit={(proj) => { setProjectToEdit(proj); setIsProjectFormOpen(true); }}
        onDelete={handleDeleteProject}
        currentUserId={user?.id}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
