'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LifeArea } from '@/types';
import { dbHelpers } from '@/lib/db';

export default function LifeAreasPage() {
  const router = useRouter();
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<LifeArea | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10B981');
  const [order, setOrder] = useState(1);

  // Load life areas
  useEffect(() => {
    const loadData = async () => {
      try {
        await dbHelpers.seed();
        const areas = await dbHelpers.lifeAreas.getAll();
        setLifeAreas(areas);
        if (areas.length > 0) {
          setOrder(Math.max(...areas.map(a => a.order)) + 1);
        }
      } catch (error) {
        console.error('Error loading life areas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Reset form
  const resetForm = () => {
    setName('');
    setColor('#10B981');
    setOrder(lifeAreas.length > 0 ? Math.max(...lifeAreas.map(a => a.order)) + 1 : 1);
    setEditingArea(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (area: LifeArea) => {
    setEditingArea(area);
    setName(area.name);
    setColor(area.color);
    setOrder(area.order);
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
    if (!name.trim()) return;

    try {
      if (editingArea) {
        // Update existing area
        const updatedArea = await dbHelpers.lifeAreas.update(editingArea.id, {
          name: name.trim(),
          color,
          order
        });
        setLifeAreas(prev => prev.map(area => 
          area.id === editingArea.id ? updatedArea : area
        ));
      } else {
        // Create new area
        const newArea = await dbHelpers.lifeAreas.create({
          name: name.trim(),
          color,
          order
        });
        setLifeAreas(prev => [...prev, newArea]);
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving life area:', error);
    }
  };

  // Delete life area
  const handleDeleteArea = async (areaId: string) => {
    const area = lifeAreas.find(a => a.id === areaId);
    if (!area) return;

    // Check if area is being used by goals or tasks
    try {
      const goals = await dbHelpers.goals.getByLifeArea(areaId);
      const tasks = await dbHelpers.tasks.getByLifeArea(areaId);
      
      if (goals.length > 0 || tasks.length > 0) {
        alert(`Cannot delete "${area.name}" because it has ${goals.length} goals and ${tasks.length} tasks. Please reassign or delete them first.`);
        return;
      }

      if (confirm(`Are you sure you want to delete "${area.name}"?`)) {
        await dbHelpers.lifeAreas.delete(areaId);
        setLifeAreas(prev => prev.filter(area => area.id !== areaId));
      }
    } catch (error) {
      console.error('Error deleting life area:', error);
    }
  };

  // Reorder areas
  const moveArea = async (areaId: string, direction: 'up' | 'down') => {
    const currentIndex = lifeAreas.findIndex(a => a.id === areaId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= lifeAreas.length) return;

    try {
      const [currentArea, targetArea] = [lifeAreas[currentIndex], lifeAreas[newIndex]];
      
      // Swap orders
      await Promise.all([
        dbHelpers.lifeAreas.update(currentArea.id, { order: targetArea.order }),
        dbHelpers.lifeAreas.update(targetArea.id, { order: currentArea.order })
      ]);

      // Update local state
      setLifeAreas(prev => {
        const newAreas = [...prev];
        [newAreas[currentIndex], newAreas[newIndex]] = [newAreas[newIndex], newAreas[currentIndex]];
        return newAreas.sort((a, b) => a.order - b.order);
      });
    } catch (error) {
      console.error('Error reordering life areas:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading life areas...</div>
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
            Life Areas Management
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + New Life Area
          </button>
          <button
            onClick={() => router.push('/goals')}
            className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            title="Manage Goals"
          >
            🎯 Goals
          </button>

        </div>
      </div>

      {/* Life Areas List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Life Areas ({lifeAreas.length})
          </h2>
        </div>
        
        {lifeAreas.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No life areas defined yet. Create your first one to get started!
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Your First Life Area
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                         {lifeAreas.map((area, index) => (
               <div
                 key={area.id}
                 className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                 onClick={() => router.push(`/life-areas/${area.id}/progress`)}
               >
                                 {/* Area Info */}
                 <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         moveArea(area.id, 'up');
                       }}
                       disabled={index === 0}
                       className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                       title="Move up"
                     >
                       ↑
                     </button>
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         moveArea(area.id, 'down');
                       }}
                       disabled={index === lifeAreas.length - 1}
                       className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                       title="Move down"
                     >
                       ↓
                     </button>
                   </div>
                   
                   <div
                     className="w-4 h-4 rounded-full"
                     style={{ backgroundColor: area.color }}
                   />
                   
                   <div className="flex-1">
                     <h3 className="font-medium text-gray-900 dark:text-white">
                       {area.name}
                     </h3>
                     <p className="text-sm text-gray-500 dark:text-gray-400">
                       Order: {area.order}
                     </p>
                   </div>
                   
                   <div className="text-sm text-gray-500 dark:text-gray-400">
                     Click to view progress →
                   </div>
                 </div>

                                 {/* Actions */}
                 <div className="flex gap-2">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       openEditModal(area);
                     }}
                     className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                   >
                     Edit
                   </button>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       handleDeleteArea(area.id);
                     }}
                     className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm"
                   >
                     Delete
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingArea ? 'Edit Life Area' : 'Create New Life Area'}
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
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Area Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Health, Career, Family"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Color */}
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {color}
                  </span>
                </div>
              </div>

              {/* Order */}
              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Order
                </label>
                <input
                  id="order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
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
                  disabled={!name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingArea ? 'Update Area' : 'Create Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
