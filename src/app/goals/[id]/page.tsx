'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Goal, LifeArea, Task } from '@/types';
import { dbHelpers } from '@/lib/db';
import { format } from 'date-fns';
import { useGoals } from '@/contexts/GoalsContext';
import GoalTaskManager from '@/components/GoalTaskManager';

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { refreshGoals } = useGoals();
  const goalId = params.id as string;
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [lifeArea, setLifeArea] = useState<LifeArea | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGoalTaskManagerOpen, setIsGoalTaskManagerOpen] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editLifeAreaId, setEditLifeAreaId] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editStatus, setEditStatus] = useState<Goal['status']>('active');
  const [editDescription, setEditDescription] = useState('');



  // Load goal data
  useEffect(() => {
    const loadGoalData = async () => {
      try {
        await dbHelpers.seed();
        const [goalData, lifeAreaData, goalTasks] = await Promise.all([
          dbHelpers.goals.getById(goalId),
          dbHelpers.lifeAreas.getAll(),
          dbHelpers.tasks.getByGoal(goalId)
        ]);

        if (!goalData) {
          router.push('/goals');
          return;
        }

        setGoal(goalData);
        setEditTitle(goalData.title);
        setEditLifeAreaId(goalData.lifeAreaId);
        setEditTargetDate(goalData.targetDate ? format(goalData.targetDate, 'yyyy-MM-dd') : '');
        setEditStatus(goalData.status);
        setEditDescription(goalData.description || '');

        const area = lifeAreaData.find(a => a.id === goalData.lifeAreaId);
        setLifeArea(area || null);

        setTasks(goalTasks);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading goal data:', error);
        setIsLoading(false);
      }
    };

    if (goalId) {
      loadGoalData();
    }
  }, [goalId, router]);

  // Handle goal update
  const handleUpdateGoal = async () => {
    if (!goal || !editTitle.trim() || !editLifeAreaId) return;

    try {
      const updatedGoal = await dbHelpers.goals.update(goal.id, {
        title: editTitle.trim(),
        lifeAreaId: editLifeAreaId,
        targetDate: editTargetDate ? new Date(editTargetDate) : undefined,
        status: editStatus,
        description: editDescription.trim() || undefined
      });

      setGoal(updatedGoal);
      await refreshGoals();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  // Handle goal task creation
  const handleTasksCreated = async () => {
    // Refresh the tasks list to show newly created tasks
    try {
      const goalTasks = await dbHelpers.tasks.getByGoal(goalId);
      setTasks(goalTasks);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
  };

  // Calculate progress
  const completedTasks = tasks.filter(task => task.completedAt);
  const progressPercentage = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading goal...</div>
        </div>
      </div>
    );
  }

  if (!goal || !lifeArea) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Goal not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/goals')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ← Back to Goals
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {goal.title}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Edit Goal
          </button>
          <button
            onClick={() => setIsGoalTaskManagerOpen(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Manage Tasks
          </button>
        </div>
      </div>

      {/* Goal Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Goal Info Card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: lifeArea.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {lifeArea.name}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {goal.title}
              </h2>
              {goal.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {goal.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {goal.targetDate && (
                  <span>
                    <span className="font-medium">Target:</span> {format(goal.targetDate, 'MMM d, yyyy')}
                  </span>
                )}
                <span>
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                    goal.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    goal.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Progress Overview
          </h3>
          
          {/* Task Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tasks</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {completedTasks.length}/{tasks.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(progressPercentage)}% complete
            </span>
          </div>

          {/* Quick Stats */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Tasks:</span>
              <span className="font-medium">{tasks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Completed:</span>
              <span className="font-medium text-green-600">{completedTasks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pending:</span>
              <span className="font-medium text-orange-600">{tasks.length - completedTasks.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Task Management
          </h3>
          <button
            onClick={() => setIsGoalTaskManagerOpen(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Manage Tasks
          </button>
        </div>
        
        {tasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No tasks yet for this goal. Click &quot;Manage Tasks&quot; to break down your goal into actionable steps!
          </p>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              You have <span className="font-semibold text-blue-600">{tasks.length}</span> tasks for this goal
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Use the &quot;Manage Tasks&quot; button above to add, edit, or schedule your goal breakdown
            </p>
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Completed Tasks
        </h3>
        {completedTasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No tasks completed yet for this goal. Start working on your plan!
          </p>
        ) : (
          <div className="space-y-3">
            {completedTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              >
                <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </span>
                  {task.completedAt && (
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      completed {format(task.completedAt, 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Tasks */}
      {tasks.filter(t => !t.completedAt).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pending Tasks
          </h3>
          <div className="space-y-3">
            {tasks
              .filter(task => !task.completedAt)
              .map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </span>
                                         {task.scheduledDate && (
                       <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                         scheduled for {format(task.scheduledDate, 'MMM d, yyyy')}
                       </span>
                     )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Goal
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateGoal(); }} className="p-6 space-y-4">
              <div>
                <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Title *
                </label>
                <input
                  id="editTitle"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Describe your goal..."
                />
              </div>
              <div>
                <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="editStatus"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Goal['status'])}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editTitle.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Update Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Task Manager */}
      {isGoalTaskManagerOpen && (
        <GoalTaskManager
          goal={goal}
          lifeArea={lifeArea}
          isOpen={isGoalTaskManagerOpen}
          onClose={() => setIsGoalTaskManagerOpen(false)}
          onTasksCreated={handleTasksCreated}
        />
      )}
    </div>
  );
}
