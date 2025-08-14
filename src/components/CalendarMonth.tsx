'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { LifeArea, Task } from '@/types';
import { dbHelpers } from '@/lib/db';
import TaskQuickAdd from './TaskQuickAdd';

interface CalendarMonthProps {
  currentDate?: Date;
}

export default function CalendarMonth({ currentDate = new Date() }: CalendarMonthProps) {
  const router = useRouter();
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [monthStart, setMonthStart] = useState(startOfMonth(currentDate));
  const [monthEnd, setMonthEnd] = useState(endOfMonth(currentDate));
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Load life areas for color coding
  useEffect(() => {
    const loadLifeAreas = async () => {
      try {
        await dbHelpers.seed(); // Ensure database is seeded
        const areas = await dbHelpers.lifeAreas.getAll();
        setLifeAreas(areas);
      } catch (error) {
        console.error('Error loading life areas:', error);
      }
    };
    loadLifeAreas();
  }, []);

  // Generate calendar days for the month
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newDate = new Date(monthStart);
    newDate.setMonth(newDate.getMonth() - 1);
    setMonthStart(startOfMonth(newDate));
    setMonthEnd(endOfMonth(newDate));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const newDate = new Date(monthStart);
    newDate.setMonth(newDate.getMonth() + 1);
    setMonthStart(startOfMonth(newDate));
    setMonthEnd(endOfMonth(newDate));
  };

  // Navigate to today
  const goToToday = () => {
    const today = new Date();
    setMonthStart(startOfMonth(today));
    setMonthEnd(endOfMonth(today));
  };

  // Handle day cell click
  const handleDayClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    router.push(`/day/${dateString}`);
  };

  // Handle quick add button click
  const handleQuickAddClick = (date: Date) => {
    setSelectedDate(date);
    setIsQuickAddOpen(true);
  };

  // Handle task creation from quick add
  const handleTaskCreated = (task: Task) => {
    // Optionally refresh the calendar or show a success message
    console.log('Task created:', task);
  };

  // Get day of week headers
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          ←
        </button>
        
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {format(monthStart, 'MMMM yyyy')}
          </h1>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Today
          </button>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
          {dayHeaders.map((day) => (
            <div
              key={day}
              className="p-3 text-center font-semibold text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={index}
                className={`
                  group min-h-[100px] p-2 border-r border-b border-gray-200 dark:border-gray-600
                  ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
                  ${index % 7 === 6 ? 'border-r-0' : ''}
                  ${index >= calendarDays.length - 7 ? 'border-b-0' : ''}
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                `}
              >
                {/* Day Number and Quick Add Button */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`
                      text-sm font-medium cursor-pointer
                      ${isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}
                      ${isCurrentDay ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                    `}
                    onClick={() => handleDayClick(day)}
                  >
                    {format(day, 'd')}
                  </div>
                  
                  {/* Quick Add Button */}
                  <button
                    onClick={() => handleQuickAddClick(day)}
                    className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Quick Add Task"
                  >
                    +
                  </button>
                </div>

                {/* Life Area Dots (placeholder for now) */}
                <div className="flex flex-wrap gap-1">
                  {lifeAreas.slice(0, 3).map((area) => (
                    <div
                      key={area.id}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: area.color }}
                      title={area.name}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        {lifeAreas.map((area) => (
          <div key={area.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: area.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {area.name}
            </span>
          </div>
        ))}
      </div>

      {/* TaskQuickAdd Modal */}
      <TaskQuickAdd
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        selectedDate={selectedDate}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
