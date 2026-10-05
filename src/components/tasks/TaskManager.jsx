import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ListTodo
} from 'lucide-react';

export const TaskManager = ({ projectId, tasks, onAddTask, onToggleTask, onDeleteTask, isOwner }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [adding, setAdding] = useState(false);

  const projectTasks = tasks.filter(t => t.project_id === projectId);

  const filteredTasks = projectTasks.filter(task => {
    if (filter === 'active') return !task.is_completed;
    if (filter === 'completed') return task.is_completed;
    return true;
  });

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (!user) {
      addToast('Please sign in to manage project tasks.', 'error');
      return;
    }

    setAdding(true);
    try {
      const taskData = {
        project_id: projectId,
        title: newTitle.trim(),
        priority,
        due_date: dueDate || null,
        is_completed: false
      };
      await onAddTask(taskData);
      setNewTitle('');
      setDueDate('');
      addToast('Task added to project!', 'success');
    } catch (err) {
      addToast('Failed to add task.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'High': return 'badge-rose';
      case 'Medium': return 'badge-amber';
      default: return 'badge-cyan';
    }
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ListTodo className="w-5 h-5 text-indigo-400" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
            Relational Tasks ({projectTasks.filter(t => t.is_completed).length}/{projectTasks.length})
          </h3>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.2)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          {['all', 'active', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: filter === f ? 'var(--primary)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Add Task Form (Allowed for owner or authenticated user) */}
      {isOwner && (
        <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Add a new project task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
            required
          />

          <select 
            className="input-field" 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            style={{ width: '120px' }}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <input
            type="date"
            className="input-field"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ width: '140px' }}
          />

          <button type="submit" className="btn btn-primary" disabled={adding}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Add</span>
          </button>
        </form>
      )}

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className="glass-card"
              style={{
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                opacity: task.is_completed ? 0.75 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id, !task.is_completed)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.is_completed ? '#34d399' : 'var(--text-dim)' }}
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <span style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 500,
                  textDecoration: task.is_completed ? 'line-through' : 'none',
                  color: task.is_completed ? 'var(--text-muted)' : 'var(--text-main)'
                }}>
                  {task.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {task.due_date && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar className="w-3 h-3" /> {task.due_date}
                  </span>
                )}
                
                <span className={`badge ${getPriorityBadge(task.priority)}`} style={{ fontSize: '0.65rem' }}>
                  {task.priority}
                </span>

                {isOwner && (
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="btn btn-danger btn-icon btn-sm"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
