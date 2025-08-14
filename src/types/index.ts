export interface LifeArea {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  lifeAreaId: string;
  title: string;
  targetDate?: Date;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  goalId: string;
  title: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  lifeAreaId: string;
  goalId?: string;
  projectId?: string;
  title: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
  scheduledDate?: Date;
  completedAt?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  content: string;
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  createdAt: Date;
  updatedAt: Date;
}

export interface DaySummary {
  date: string; // YYYY-MM-DD format
  reflection?: string;
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  score?: number; // 0-10
  createdAt: Date;
  updatedAt: Date;
}

// Utility types
export type LifeAreaId = string;
export type GoalId = string;
export type ProjectId = string;
export type TaskId = string;
export type JournalEntryId = string;
export type DaySummaryId = string;

// Database table names
export const TABLE_NAMES = {
  LIFE_AREAS: 'lifeAreas',
  GOALS: 'goals',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  JOURNAL_ENTRIES: 'journalEntries',
  DAY_SUMMARIES: 'daySummaries',
} as const;
