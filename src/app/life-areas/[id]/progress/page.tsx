'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LifeArea, Task, Goal } from '@/types';
import { dbHelpers } from '@/lib/db';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

type Timeframe = 'week' | 'month' | '3months' | 'halfyear' | 'year';

interface LifeAreaProgressData {
  totalTasks: number;
  completedTasks: number;
  activeDays: number;
  totalDays: number;
  goals: Goal[];
  completionRate: number;
  consistencyRate: number;
  taskBreakdown: Array<{
    date: string;
    tasks: Task[];
    completed: number;
    total: number;
  }>;
}

export default function IndividualLifeAreaProgressPage() {
  const params = useParams();
  const router = useRouter();
  const lifeAreaId = params.id as string;
  
  const [lifeArea, setLifeArea] = useState<LifeArea | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [progressData, setProgressData] = useState<LifeAreaProgressData | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        await dbHelpers.seed();
        const [area, tasks, goals] = await Promise.all([
          dbHelpers.lifeAreas.getById(lifeAreaId),
          dbHelpers.tasks.getAll(),
          dbHelpers.goals.getAll()
        ]);

        if (!area) {
          router.push('/life-areas');
          return;
        }

        setLifeArea(area);
        setAllTasks(tasks);
        setAllGoals(goals);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    if (lifeAreaId) {
      loadData();
    }
  }, [lifeAreaId, router]);

  // Calculate progress when timeframe changes
  useEffect(() => {
    if (!lifeArea || allTasks.length === 0) return;

    const calculateProgress = () => {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      // Determine date range based on timeframe
      switch (timeframe) {
        case 'week':
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case '3months':
          startDate = subMonths(now, 3);
          endDate = now;
          break;
        case 'halfyear':
          startDate = subMonths(now, 6);
          endDate = now;
          break;
        case 'year':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }

      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Get tasks for this life area
      const areaTasks = allTasks.filter(task => task.lifeAreaId === lifeAreaId);
      
      // Get tasks within the timeframe
      const timeframeTasks = areaTasks.filter(task => {
        if (task.scheduledDate) {
          const taskDate = new Date(task.scheduledDate);
          return isWithinInterval(taskDate, { start: startDate, end: endDate });
        }
        return false;
      });

      // Get completed tasks
      const completedTasks = timeframeTasks.filter(task => task.completedAt);
      
      // Calculate active days (days with tasks)
      const daysWithTasks = new Set();
      timeframeTasks.forEach(task => {
        if (task.scheduledDate) {
          daysWithTasks.add(format(new Date(task.scheduledDate), 'yyyy-MM-dd'));
        }
      });

      // Get goals for this life area
      const areaGoals = allGoals.filter(goal => goal.lifeAreaId === lifeAreaId);

      // Create task breakdown by date
      const taskBreakdown: Array<{ date: string; tasks: Task[]; completed: number; total: number }> = [];
      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateString = format(currentDate, 'yyyy-MM-dd');
        
        const dayTasks = timeframeTasks.filter(task => 
          task.scheduledDate && format(new Date(task.scheduledDate), 'yyyy-MM-dd') === dateString
        );
        
        if (dayTasks.length > 0) {
          taskBreakdown.push({
            date: dateString,
            tasks: dayTasks,
            completed: dayTasks.filter(t => t.completedAt).length,
            total: dayTasks.length
          });
        }
      }

      const completionRate = timeframeTasks.length > 0 ? (completedTasks.length / timeframeTasks.length) * 100 : 0;
      const consistencyRate = totalDays > 0 ? (daysWithTasks.size / totalDays) * 100 : 0;

      setProgressData({
        totalTasks: timeframeTasks.length,
        completedTasks: completedTasks.length,
        activeDays: daysWithTasks.size,
        totalDays,
        goals: areaGoals,
        completionRate,
        consistencyRate,
        taskBreakdown
      });
    };

    calculateProgress();
  }, [lifeArea, allTasks, allGoals, timeframe]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading progress data...</div>
        </div>
      </div>
    );
  }

  if (!lifeArea || !progressData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Life area not found</p>
        </div>
      </div>
    );
  }

  const getTimeframeLabel = (tf: Timeframe) => {
    switch (tf) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case '3months': return 'Last 3 Months';
      case 'halfyear': return 'Last 6 Months';
      case 'year': return 'This Year';
      default: return 'This Month';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/life-areas')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ← Back to Life Areas
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: lifeArea.color }}
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {lifeArea.name} Progress
            </h1>
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Timeframe
        </h2>
        <div className="flex flex-wrap gap-2">
          {(['week', 'month', '3months', 'halfyear', 'year'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {getTimeframeLabel(tf)}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Progress Summary Card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4"
             style={{ borderLeftColor: lifeArea.color }}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Progress Summary for {getTimeframeLabel(timeframe)}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Task Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tasks</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {progressData.completedTasks}/{progressData.totalTasks}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressData.completionRate}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Math.round(progressData.completionRate)}% complete
              </span>
            </div>

            {/* Consistency Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Consistency</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {progressData.activeDays}/{progressData.totalDays} days
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressData.consistencyRate}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Math.round(progressData.consistencyRate)}% consistent
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progressData.totalTasks}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progressData.completedTasks}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progressData.activeDays}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Days</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {progressData.goals.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Goals</div>
            </div>
          </div>
        </div>

        {/* Goals Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active Goals ({progressData.goals.filter(g => g.status === 'active').length})
          </h3>
          {progressData.goals.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No goals set for this life area yet.
            </p>
          ) : (
            <div className="space-y-3">
              {progressData.goals.slice(0, 5).map(goal => (
                <div
                  key={goal.id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    {goal.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      goal.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                      goal.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                    </span>
                    {goal.targetDate && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(goal.targetDate, 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {progressData.goals.length > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +{progressData.goals.length - 5} more goals
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Breakdown by Date */}
      {progressData.taskBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily Task Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {progressData.taskBreakdown.map((dayData) => (
              <div
                key={dayData.date}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(dayData.date), 'MMM d')}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {dayData.completed}/{dayData.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dayData.total > 0 ? (dayData.completed / dayData.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {dayData.tasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      className={`text-xs truncate ${
                        task.completedAt 
                          ? 'text-green-600 dark:text-green-400 line-through' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                      title={task.title}
                    >
                      • {task.title}
                    </div>
                  ))}
                  {dayData.tasks.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayData.tasks.length - 3} more tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Tasks Message */}
      {progressData.totalTasks === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            No tasks scheduled for {getTimeframeLabel(timeframe).toLowerCase()} in {lifeArea.name}.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Start scheduling tasks to see your progress here!
          </p>
        </div>
      )}
    </div>
  );
}

