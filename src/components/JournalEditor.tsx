'use client';

import { useState, useEffect, useCallback } from 'react';
import { JournalEntry } from '@/types';
import { dbHelpers } from '@/lib/db';
import { format, parseISO } from 'date-fns';

interface JournalEditorProps {
  date: string;
}

export default function JournalEditor({ date }: JournalEditorProps) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood']>('good');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  // Load existing journal entry
  useEffect(() => {
    const loadJournalEntry = async () => {
      try {
        const entry = await dbHelpers.journalEntries.getByDate(date);
        if (entry) {
          setContent(entry.content);
          setMood(entry.mood || 'good');
  
        }
      } catch (error) {
        console.error('Error loading journal entry:', error);
      }
    };
    loadJournalEntry();
  }, [date]);

  // Autosave function with debouncing
  const saveJournalEntry = useCallback(async (newContent: string, newMood?: JournalEntry['mood']) => {
    if (!newContent.trim()) return;

    setIsSaving(true);
    try {
      await dbHelpers.journalEntries.upsertByDate(
        date,
        newContent,
        newMood || mood
      );

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setIsSaving(false);
    }
  }, [date, mood]);

  // Debounced autosave effect
  useEffect(() => {
    if (!content.trim()) return;

    const timeoutId = setTimeout(() => {
      saveJournalEntry(content);
    }, 1000); // 1 second delay

    return () => clearTimeout(timeoutId);
  }, [content, saveJournalEntry]);

  // Handle mood change
  const handleMoodChange = (newMood: JournalEntry['mood']) => {
    setMood(newMood);
    if (content.trim()) {
      saveJournalEntry(content, newMood);
    }
  };

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Get mood emoji
  const getMoodEmoji = (moodValue: JournalEntry['mood']) => {
    const moodEmojis: Record<NonNullable<JournalEntry['mood']>, string> = {
      'great': '😄',
      'good': '🙂',
      'okay': '😐',
      'bad': '😔',
      'terrible': '😢'
    };
    return moodValue ? moodEmojis[moodValue] : '🙂';
  };

  // Get mood label
  const getMoodLabel = (moodValue: JournalEntry['mood']) => {
    const moodLabels: Record<NonNullable<JournalEntry['mood']>, string> = {
      'great': 'Great',
      'good': 'Good',
      'okay': 'Okay',
      'bad': 'Bad',
      'terrible': 'Terrible'
    };
    return moodValue ? moodLabels[moodValue] : 'Good';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Journal for {format(parseISO(date), 'EEEE, MMMM d')}
        </h2>
        
        {/* Mood selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Mood:</span>
          <select
            value={mood}
            onChange={(e) => handleMoodChange(e.target.value as JournalEntry['mood'])}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="great">😄 Great</option>
            <option value="good">🙂 Good</option>
            <option value="okay">😐 Okay</option>
            <option value="bad">😔 Bad</option>
            <option value="terrible">😢 Terrible</option>
          </select>
        </div>
      </div>

      {/* Journal content */}
      <div className="mb-4">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="How was your day? What did you accomplish? What are you grateful for?"
          className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </span>
          )}
          {lastSaved && !isSaving && (
            <span>
              Last saved: {format(lastSaved, 'h:mm a')}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span>Current mood:</span>
          <span className="flex items-center gap-1">
            {getMoodEmoji(mood)} {getMoodLabel(mood)}
          </span>
        </div>
      </div>

      {/* Character count */}
      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
        {content.length} characters
      </div>
    </div>
  );
}
