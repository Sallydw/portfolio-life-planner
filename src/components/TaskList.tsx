'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, LifeArea } from '@/types';
import { dbHelpers } from '@/lib/db';
import { format, parseISO } from 'date-fns';
import { useGoals } from '@/contexts/GoalsContext';

interface TaskListProps {
  date: string;
}

export default function TaskList({ date }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskLifeAreaId, setNewTaskLifeAreaId] = useState('');
  const [newTaskGoalId, setNewTaskGoalId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const { goals } = useGoals();

  // Load tasks and life areas
  useEffect(() => {
    const loadData = async () => {
      try {
        await dbHelpers.seed(); // Ensure database is seeded
        const [taskList, areas] = await Promise.all([
          dbHelpers.tasks.getByDate(parseISO(date)),
          dbHelpers.lifeAreas.getAll()
        ]);
        setTasks(taskList);
        setLifeAreas(areas);
        if (areas.length > 0 && !newTaskLifeAreaId) {
          setNewTaskLifeAreaId(areas[0].id);
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };
    loadData();
  }, [date, newTaskLifeAreaId]);

  // Add a function to refresh tasks
  const refreshTasks = useCallback(async () => {
    try {
      const taskList = await dbHelpers.tasks.getByDate(parseISO(date));
      setTasks(taskList);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
  }, [date]);

  // Refresh tasks when component receives focus (e.g., when navigating back from calendar)
  useEffect(() => {
    const handleFocus = () => {
      refreshTasks();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [date, refreshTasks]);



  // Create new task
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskLifeAreaId) return;

    try {
      await dbHelpers.tasks.create({
        title: newTaskTitle.trim(),
        lifeAreaId: newTaskLifeAreaId,
        goalId: newTaskGoalId || undefined,
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? parseISO(newTaskDueDate) : undefined,
        tags: [],
        scheduledDate: parseISO(date)
      });
      
      // Refresh the task list to ensure consistency
      await refreshTasks();
      setNewTaskTitle('');
      setNewTaskGoalId('');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Update task
  const handleUpdateTask = async (taskId: string) => {
    if (!editingTitle.trim()) return;

    try {
      const updatedTask = await dbHelpers.tasks.update(taskId, {
        title: editingTitle.trim()
      });
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      setEditingTaskId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await dbHelpers.tasks.delete(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Toggle task completion
  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    try {
      const updatedTask = isCompleted 
        ? await dbHelpers.tasks.uncomplete(taskId)
        : await dbHelpers.tasks.complete(taskId);
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  // Start editing task
  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingTitle('');
  };

  // Get life area color
  const getLifeAreaColor = (lifeAreaId: string) => {
    const area = lifeAreas.find(a => a.id === lifeAreaId);
    return area?.color || '#6B7280';
  };

  // Get life area name
  const getLifeAreaName = (lifeAreaId: string) => {
    const area = lifeAreas.find(a => a.id === lifeAreaId);
    return area?.name || 'Unknown';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Tasks for {format(parseISO(date), 'EEEE, MMMM d')}
        </h2>
        <button
          onClick={refreshTasks}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Refresh tasks"
        >
          🔄
        </button>
      </div>

      {/* Add new task */}
      <div className="space-y-3 mb-6">
        {/* Task title row */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
          />
          <button
            onClick={handleCreateTask}
            disabled={!newTaskTitle.trim() || !newTaskLifeAreaId}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            Add
          </button>
        </div>
        
        {/* Life area, goal, priority, and due date row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 min-w-0">
          <select
            value={newTaskLifeAreaId}
            onChange={(e) => setNewTaskLifeAreaId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white min-w-0"
          >
            {lifeAreas.map(area => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <select
            value={newTaskGoalId}
            onChange={(e) => setNewTaskGoalId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white min-w-0"
          >
            <option value="">No Goal</option>
            {goals
              .filter(goal => goal.lifeAreaId === newTaskLifeAreaId)
              .map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
          </select>
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white min-w-0"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <input
            type="date"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
            placeholder="Due Date"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white min-w-0"
          />
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No tasks for this day. Add one above!
          </p>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                task.completedAt 
                  ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
              }`}
            >
              {/* Completion checkbox */}
              <input
                type="checkbox"
                checked={!!task.completedAt}
                onChange={() => handleToggleComplete(task.id, !!task.completedAt)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />

              {/* Life area indicator */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getLifeAreaColor(task.lifeAreaId) }}
                title={getLifeAreaName(task.lifeAreaId)}
              />

              {/* Task content */}
              <div className="flex-1 min-w-0">
                {editingTaskId === task.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleUpdateTask(task.id)}
                    />
                    <button
                      onClick={() => handleUpdateTask(task.id)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                                         <div className="flex-1">
                       <span
                         className={`block ${
                           task.completedAt 
                             ? 'line-through text-gray-500 dark:text-gray-400' 
                             : 'text-gray-900 dark:text-white'
                         }`}
                       >
                         {task.title}
                       </span>
                       {task.goalId && (
                         <span className="text-xs text-blue-600 dark:text-blue-400">
                           🎯 {goals.find(g => g.id === task.goalId)?.title}
                         </span>
                       )}
                       {task.dueDate && (
                         <span className="text-xs text-orange-600 dark:text-orange-400">
                           📅 Due: {format(task.dueDate, 'MMM d')}
                         </span>
                       )}
                       {task.dependencies && task.dependencies.length > 0 && (
                         <span className="text-xs text-purple-600 dark:text-purple-400">
                           🔗 {task.dependencies.length} dependency{task.dependencies.length !== 1 ? 's' : ''}
                         </span>
                       )}
                     </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditing(task)}
                        className="px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-2 py-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
