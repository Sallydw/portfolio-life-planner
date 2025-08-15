'use client';

import { useState, useEffect } from 'react';
import { Task, LifeArea, Goal } from '@/types';
import { dbHelpers } from '@/lib/db';
import { format, parseISO } from 'date-fns';
import { useGoals } from '@/contexts/GoalsContext';

interface TaskQuickAddProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onTaskCreated?: (task: Task) => void;
}

export default function TaskQuickAdd({ isOpen, onClose, selectedDate, onTaskCreated }: TaskQuickAddProps) {
  const [title, setTitle] = useState('');
  const [lifeAreaId, setLifeAreaId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [date, setDate] = useState(selectedDate || new Date());
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const { goals } = useGoals();

  // Load life areas
  useEffect(() => {
    const loadLifeAreas = async () => {
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
    loadLifeAreas();
  }, [lifeAreaId]);



  // Update date when selectedDate prop changes
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setGoalId('');
      setNotes('');
      setPriority('medium');
      if (selectedDate) {
        setDate(selectedDate);
      }
    }
  }, [isOpen, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !lifeAreaId) return;

    setIsCreating(true);
    try {
      const newTask = await dbHelpers.tasks.create({
        title: title.trim(),
        lifeAreaId,
        goalId: goalId || undefined,
        priority,
        notes: notes.trim() || undefined,
        tags: [],
        scheduledDate: date
      });

      // Reset form
      setTitle('');
      setNotes('');
      setPriority('medium');
      
      // Notify parent component
      onTaskCreated?.(newTask);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Quick Add Task
          </h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
              disabled={isCreating}
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
              disabled={isCreating}
            >
              {lifeAreas.map(area => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          {/* Goal */}
          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Goal (optional)
            </label>
            <select
              id="goal"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={isCreating}
            >
              <option value="">No Goal</option>
              {goals
                .filter(goal => goal.lifeAreaId === lifeAreaId)
                .map(goal => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={format(date, 'yyyy-MM-dd')}
              onChange={(e) => setDate(parseISO(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={isCreating}
            />
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task['priority'])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={isCreating}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              disabled={isCreating}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !lifeAreaId || isCreating}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
