'use client';

import { useState, useEffect } from 'react';
import { Task, Goal, LifeArea } from '@/types';
import { dbHelpers } from '@/lib/db';
import { format, parseISO, addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface GoalTask {
  id: string;
  title: string;
  description?: string;
  priority: Task['priority'];
  estimatedMinutes?: number;
  dueDate?: Date;
  dependencies: string[];
  isScheduled: boolean;
  scheduledDate?: Date;
}

interface GoalTaskManagerProps {
  goal: Goal;
  lifeArea: LifeArea;
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated?: (tasks: Task[]) => void;
}

export default function GoalTaskManager({ 
  goal, 
  lifeArea, 
  isOpen, 
  onClose, 
  onTasksCreated 
}: GoalTaskManagerProps) {
  const [goalTasks, setGoalTasks] = useState<GoalTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [newTaskEstimatedMinutes, setNewTaskEstimatedMinutes] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [schedulingTask, setSchedulingTask] = useState<GoalTask | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState('');
  const [editingTask, setEditingTask] = useState<GoalTask | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<Task['priority']>('medium');
  const [editTaskEstimatedMinutes, setEditTaskEstimatedMinutes] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskDependencies, setEditTaskDependencies] = useState<string[]>([]);

  const loadGoalTasks = async () => {
    try {
      const existingTasks = await dbHelpers.tasks.getByGoal(goal.id);
      const goalTaskList: GoalTask[] = existingTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.notes,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        dueDate: task.dueDate,
        dependencies: task.dependencies || [],
        isScheduled: !!task.scheduledDate,
        scheduledDate: task.scheduledDate
      }));
      setGoalTasks(goalTaskList);
    } catch (error) {
      console.error('Error loading goal tasks:', error);
    }
  };

  // Load existing goal tasks
  useEffect(() => {
    if (isOpen && goal.id) {
      loadGoalTasks();
    }
  }, [isOpen, goal.id]);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: GoalTask = {
      id: uuidv4(),
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      priority: newTaskPriority,
      estimatedMinutes: newTaskEstimatedMinutes ? parseInt(newTaskEstimatedMinutes) : undefined,
      dueDate: newTaskDueDate ? parseISO(newTaskDueDate) : undefined,
      dependencies: selectedDependencies,
      isScheduled: false
    };

    setGoalTasks(prev => [...prev, newTask]);
    
    // Reset form
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskEstimatedMinutes('');
    setNewTaskDueDate('');
    setSelectedDependencies([]);
  };

  const handleDeleteTask = (taskId: string) => {
    setGoalTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleEditTask = (task: GoalTask) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskPriority(task.priority);
    setEditTaskEstimatedMinutes(task.estimatedMinutes?.toString() || '');
    setEditTaskDueDate(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '');
    setEditTaskDependencies(task.dependencies);
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
    setEditTaskTitle('');
    setEditTaskDescription('');
    setEditTaskPriority('medium');
    setEditTaskEstimatedMinutes('');
    setEditTaskDueDate('');
    setEditTaskDependencies([]);
  };

  const handleSaveEdit = () => {
    if (!editingTask || !editTaskTitle.trim()) return;

    const updatedTask: GoalTask = {
      ...editingTask,
      title: editTaskTitle.trim(),
      description: editTaskDescription.trim() || undefined,
      priority: editTaskPriority,
      estimatedMinutes: editTaskEstimatedMinutes ? parseInt(editTaskEstimatedMinutes) : undefined,
      dueDate: editTaskDueDate ? parseISO(editTaskDueDate) : undefined,
      dependencies: editTaskDependencies
    };

    setGoalTasks(prev => prev.map(task => 
      task.id === editingTask.id ? updatedTask : task
    ));

    handleCloseEditModal();
  };



  const handleScheduleTask = async (task: GoalTask, targetDate: Date) => {
    if (task.isScheduled) return; // Already scheduled

    try {
      // Create the actual task in the database
      const newTask = await dbHelpers.tasks.create({
        title: task.title,
        lifeAreaId: lifeArea.id,
        goalId: goal.id,
        priority: task.priority,
        notes: task.description,
        estimatedMinutes: task.estimatedMinutes,
        scheduledDate: targetDate,
        dueDate: task.dueDate,
        dependencies: task.dependencies,
        isGoalTask: true,
        tags: []
      });

      // Update local state
      setGoalTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { ...t, isScheduled: true, scheduledDate: targetDate }
          : t
      ));

      // Notify parent component
      onTasksCreated?.([newTask]);
    } catch (error) {
      console.error('Error scheduling task:', error);
    }
  };

  const handleOpenScheduleModal = (task: GoalTask) => {
    setSchedulingTask(task);
    // Set default date to tomorrow or task due date if it's sooner
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const defaultDate = task.dueDate && task.dueDate <= tomorrow ? task.dueDate : tomorrow;
    setSelectedScheduleDate(format(defaultDate, 'yyyy-MM-dd'));
  };

  const handleCloseScheduleModal = () => {
    setSchedulingTask(null);
    setSelectedScheduleDate('');
  };

  const handleConfirmSchedule = () => {
    if (schedulingTask && selectedScheduleDate) {
      handleScheduleTask(schedulingTask, parseISO(selectedScheduleDate));
      handleCloseScheduleModal();
    }
  };

  const handleQuickSchedule = (task: GoalTask) => {
    // Quick schedule options
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);
    
    // Simple logic: if due date is soon, schedule soon; otherwise schedule next week
    let targetDate = nextWeek;
    if (task.dueDate && task.dueDate <= addDays(today, 3)) {
      targetDate = tomorrow;
    }
    
    handleScheduleTask(task, targetDate);
  };

  const getDependencyText = (dependencies: string[]) => {
    if (dependencies.length === 0) return 'No dependencies';
    if (dependencies.length === 1) return '1 dependency';
    return `${dependencies.length} dependencies`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Manage Tasks for: {goal.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Break down your goal into actionable tasks and schedule them
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Add New Task Form */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add New Task
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g., Gather required documents, Book appointment..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Additional details about this task..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={newTaskEstimatedMinutes}
                  onChange={(e) => setNewTaskEstimatedMinutes(e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dependencies
                </label>
                <select
                  multiple
                  value={selectedDependencies}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedDependencies(selected);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {goalTasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Hold Ctrl/Cmd to select multiple
                </p>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Goal Tasks ({goalTasks.length})
              </h3>
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                <strong>Scheduling Options:</strong> 
                <span className="ml-2">📅 Schedule = Choose specific date</span> | 
                <span className="ml-2">⚡ Quick = Auto-assign smart date</span>
              </div>
            </div>
            
            {goalTasks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No tasks yet. Add your first task above to break down this goal!
              </p>
            ) : (
              goalTasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border ${
                    task.isScheduled 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`font-medium ${
                          task.isScheduled 
                            ? 'text-green-800 dark:text-green-200' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {task.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        {task.isScheduled && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Scheduled
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {task.estimatedMinutes && (
                          <span>⏱️ {task.estimatedMinutes} min</span>
                        )}
                        {task.dueDate && (
                          <span>📅 Due: {format(task.dueDate, 'MMM d, yyyy')}</span>
                        )}
                        <span>🔗 {getDependencyText(task.dependencies)}</span>
                        {task.isScheduled && task.scheduledDate && (
                          <span className="text-green-600 dark:text-green-400">
                            📅 Scheduled for {format(task.scheduledDate, 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                                         <div className="flex gap-2 ml-4">
                       {!task.isScheduled && (
                         <>
                           <button
                             onClick={() => handleOpenScheduleModal(task)}
                             className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                             title="Choose date to schedule this task"
                           >
                             Schedule
                           </button>
                           <button
                             onClick={() => handleQuickSchedule(task)}
                             className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                             title="Quick schedule (auto-assign date)"
                           >
                             Quick
                           </button>
                         </>
                       )}
                       <button
                         onClick={() => handleEditTask(task)}
                         className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                         title="Edit this task"
                       >
                         Edit
                       </button>
                       <button
                         onClick={() => handleDeleteTask(task.id)}
                         className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                         title="Delete this task"
                       >
                         Delete
                       </button>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            {goalTasks.length > 0 && (
              <button
                onClick={() => {
                  // TODO: Implement bulk scheduling or other bulk actions
                  alert('Bulk actions coming soon!');
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Schedule All Tasks
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Task Modal */}
      {schedulingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Schedule Task
              </h2>
              <button
                onClick={handleCloseScheduleModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {schedulingTask.title}
                </h3>
                {schedulingTask.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {schedulingTask.description}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Choose Date to Schedule This Task *
                </label>
                <input
                  id="scheduleDate"
                  type="date"
                  value={selectedScheduleDate}
                  onChange={(e) => setSelectedScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This task will appear on your daily task list for the selected date
                </p>
              </div>

              {schedulingTask.dueDate && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Due Date:</strong> {format(schedulingTask.dueDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Make sure to schedule this task before the due date!
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCloseScheduleModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSchedule}
                  disabled={!selectedScheduleDate}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Schedule Task
                </button>
              </div>
            </div>
                     </div>
         </div>
       )}

       {/* Edit Task Modal */}
       {editingTask && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
               <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                 Edit Task
               </h2>
               <button
                 onClick={handleCloseEditModal}
                 className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
               >
                 ✕
               </button>
             </div>
             
             <div className="p-6 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Task Title *
                   </label>
                   <input
                     type="text"
                     value={editTaskTitle}
                     onChange={(e) => setEditTaskTitle(e.target.value)}
                     placeholder="Task title..."
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                   />
                 </div>
                 
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Description (optional)
                   </label>
                   <textarea
                     value={editTaskDescription}
                     onChange={(e) => setEditTaskDescription(e.target.value)}
                     placeholder="Additional details about this task..."
                     rows={3}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Priority
                   </label>
                   <select
                     value={editTaskPriority}
                     onChange={(e) => setEditTaskPriority(e.target.value as Task['priority'])}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                   >
                     <option value="low">Low</option>
                     <option value="medium">Medium</option>
                     <option value="high">High</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Estimated Time (minutes)
                   </label>
                   <input
                     type="number"
                     value={editTaskEstimatedMinutes}
                     onChange={(e) => setEditTaskEstimatedMinutes(e.target.value)}
                     placeholder="30"
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Due Date (optional)
                   </label>
                   <input
                     type="date"
                     value={editTaskDueDate}
                     onChange={(e) => setEditTaskDueDate(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Dependencies
                   </label>
                   <select
                     multiple
                     value={editTaskDependencies}
                     onChange={(e) => {
                       const selected = Array.from(e.target.selectedOptions, option => option.value);
                       setEditTaskDependencies(selected);
                     }}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                   >
                     {goalTasks.filter(t => t.id !== editingTask.id).map(task => (
                       <option key={task.id} value={task.id}>
                         {task.title}
                       </option>
                     ))}
                   </select>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                     Hold Ctrl/Cmd to select multiple (excluding this task)
                   </p>
                 </div>
               </div>
               
               <div className="flex gap-3 pt-4">
                 <button
                   onClick={handleCloseEditModal}
                   className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleSaveEdit}
                   disabled={!editTaskTitle.trim()}
                   className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   Save Changes
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
