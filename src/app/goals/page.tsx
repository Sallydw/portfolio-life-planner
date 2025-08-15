'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Goal, LifeArea } from '@/types';
import { dbHelpers } from '@/lib/db';
import { format } from 'date-fns';
import { useGoals } from '@/contexts/GoalsContext';

export default function GoalsPage() {
  const router = useRouter();
  const { goals, refreshGoals, isLoading } = useGoals();
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lifeAreaId, setLifeAreaId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<Goal['status']>('active');

  // Load life areas
  useEffect(() => {
    const loadData = async () => {
      try {
        await dbHelpers.seed();
        const areas = await dbHelpers.lifeAreas.getAll();
        setLifeAreas(areas);
        if (areas.length > 0 && !lifeAreaId) {
          setLifeAreaId(areas[0].id);
        }
      } catch (error) {
        console.error('Error loading life areas:', error);
      }
    };
    loadData();
  }, [lifeAreaId]);

  // Reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLifeAreaId(lifeAreas[0]?.id || '');
    setTargetDate('');
    setStatus('active');
    setEditingGoal(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setLifeAreaId(goal.lifeAreaId);
    setTargetDate(goal.targetDate ? format(goal.targetDate, 'yyyy-MM-dd') : '');
    setStatus(goal.status);
    setIsCreateModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !lifeAreaId) return;

    try {
      if (editingGoal) {
        // Update existing goal
        await dbHelpers.goals.update(editingGoal.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          lifeAreaId,
          targetDate: targetDate ? new Date(targetDate) : undefined,
          status
        });
      } else {
        // Create new goal
        await dbHelpers.goals.create({
          title: title.trim(),
          description: description.trim() || undefined,
          lifeAreaId,
          targetDate: targetDate ? new Date(targetDate) : undefined,
          status
        });
      }
      
      // Refresh goals to get updated data
      await refreshGoals();
      
      closeModal();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  // Delete goal
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await dbHelpers.goals.delete(goalId);
      await refreshGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
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

  // Get status color
  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading goals...</div>
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
            onClick={() => router.push('/')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ← Back to Calendar
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Goals Management
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + New Goal
          </button>
          <button
            onClick={() => router.push('/life-areas')}
            className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            title="Manage Life Areas"
          >
            🎯 Life Areas
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No goals yet. Create your first goal to get started!
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          goals.map(goal => (
            <div
              key={goal.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4"
              style={{ borderLeftColor: getLifeAreaColor(goal.lifeAreaId) }}
            >
              {/* Goal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {goal.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getLifeAreaColor(goal.lifeAreaId) }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getLifeAreaName(goal.lifeAreaId)}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                  {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                </span>
              </div>

              {/* Goal Details */}
              <div className="space-y-2 mb-4">
                {goal.targetDate && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Target:</span> {format(goal.targetDate, 'MMM d, yyyy')}
                  </div>
                )}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Created:</span> {format(goal.createdAt, 'MMM d, yyyy')}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                                 <button
                   onClick={() => router.push(`/goals/${goal.id}`)}
                   className="flex-1 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm"
                 >
                   View Details
                 </button>
                 <button
                   onClick={() => openEditModal(goal)}
                   className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                 >
                   Edit
                 </button>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you want to achieve?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your goal in detail..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Life Area */}
              <div>
                <label htmlFor="lifeArea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Life Area *
                </label>
                <select
                  id="lifeArea"
                  value={lifeAreaId}
                  onChange={(e) => setLifeAreaId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  {lifeAreas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Date */}
              <div>
                <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Date (optional)
                </label>
                <input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Goal['status'])}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !lifeAreaId}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
