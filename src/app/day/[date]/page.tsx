'use client';

import { useParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import TaskList from '@/components/TaskList';
import JournalEditor from '@/components/JournalEditor';

export default function DayPage() {
  const params = useParams();
  const router = useRouter();
  const dateString = params.date as string;
  
  // Parse the date and format it nicely
  const date = parseISO(dateString);
  const formattedDate = format(date, 'EEEE, MMMM d, yyyy');

  const goBack = () => {
    router.push('/');
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={goBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          ← Back to Calendar
        </button>
        <h1 className="text-2xl font-bold">{formattedDate}</h1>
      </div>

      {/* Two-pane layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left pane: TaskList */}
        <div className="order-2 lg:order-1">
          <TaskList date={dateString} />
        </div>

        {/* Right pane: JournalEditor */}
        <div className="order-1 lg:order-2">
          <JournalEditor date={dateString} />
        </div>
      </div>
    </div>
  );
}
