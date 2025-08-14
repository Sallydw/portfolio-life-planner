import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import {
  LifeArea,
  Goal,
  Project,
  Task,
  JournalEntry,
  DaySummary,
  TABLE_NAMES,
  LifeAreaId,
  GoalId,
  ProjectId,
  TaskId,
  JournalEntryId,

} from '@/types';

export class PortfolioLifePlannerDB extends Dexie {
  // Tables
  lifeAreas!: Table<LifeArea>;
  goals!: Table<Goal>;
  projects!: Table<Project>;
  tasks!: Table<Task>;
  journalEntries!: Table<JournalEntry>;
  daySummaries!: Table<DaySummary>;

  constructor() {
    super('PortfolioLifePlannerDB');
    
    this.version(1).stores({
      [TABLE_NAMES.LIFE_AREAS]: 'id, name, order',
      [TABLE_NAMES.GOALS]: 'id, lifeAreaId, status, targetDate',
      [TABLE_NAMES.PROJECTS]: 'id, goalId, status',
      [TABLE_NAMES.TASKS]: 'id, lifeAreaId, goalId, projectId, scheduledDate, completedAt, priority',
      [TABLE_NAMES.JOURNAL_ENTRIES]: 'id, date',
      [TABLE_NAMES.DAY_SUMMARIES]: 'date',
    });
  }
}

// Database instance
export const db = new PortfolioLifePlannerDB();

// LifeArea CRUD operations
export const lifeAreaHelpers = {
  async getAll(): Promise<LifeArea[]> {
    return await db.lifeAreas.orderBy('order').toArray();
  },

  async getById(id: LifeAreaId): Promise<LifeArea | undefined> {
    return await db.lifeAreas.get(id);
  },

  async create(data: Omit<LifeArea, 'id' | 'createdAt' | 'updatedAt'>): Promise<LifeArea> {
    const now = new Date();
    const lifeArea: LifeArea = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.lifeAreas.add(lifeArea);
    return lifeArea;
  },

  async update(id: LifeAreaId, data: Partial<Omit<LifeArea, 'id' | 'createdAt'>>): Promise<LifeArea> {
    const lifeArea = await db.lifeAreas.get(id);
    if (!lifeArea) throw new Error(`LifeArea with id ${id} not found`);
    
    const updated = { ...lifeArea, ...data, updatedAt: new Date() };
    await db.lifeAreas.put(updated);
    return updated;
  },

  async delete(id: LifeAreaId): Promise<void> {
    await db.lifeAreas.delete(id);
  },
};

// Goal CRUD operations
export const goalHelpers = {
  async getAll(): Promise<Goal[]> {
    return await db.goals.toArray();
  },

  async getById(id: GoalId): Promise<Goal | undefined> {
    return await db.goals.get(id);
  },

  async getByLifeArea(lifeAreaId: LifeAreaId): Promise<Goal[]> {
    return await db.goals.where('lifeAreaId').equals(lifeAreaId).toArray();
  },

  async create(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const now = new Date();
    const goal: Goal = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.goals.add(goal);
    return goal;
  },

  async update(id: GoalId, data: Partial<Omit<Goal, 'id' | 'createdAt'>>): Promise<Goal> {
    const goal = await db.goals.get(id);
    if (!goal) throw new Error(`Goal with id ${id} not found`);
    
    const updated = { ...goal, ...data, updatedAt: new Date() };
    await db.goals.put(updated);
    return updated;
  },

  async delete(id: GoalId): Promise<void> {
    await db.goals.delete(id);
  },
};

// Project CRUD operations
export const projectHelpers = {
  async getAll(): Promise<Project[]> {
    return await db.projects.toArray();
  },

  async getById(id: ProjectId): Promise<Project | undefined> {
    return await db.projects.get(id);
  },

  async getByGoal(goalId: GoalId): Promise<Project[]> {
    return await db.projects.where('goalId').equals(goalId).toArray();
  },

  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date();
    const project: Project = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.add(project);
    return project;
  },

  async update(id: ProjectId, data: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project> {
    const project = await db.projects.get(id);
    if (!project) throw new Error(`Project with id ${id} not found`);
    
    const updated = { ...project, ...data, updatedAt: new Date() };
    await db.projects.put(updated);
    return updated;
  },

  async delete(id: ProjectId): Promise<void> {
    await db.projects.delete(id);
  },
};

// Task CRUD operations
export const taskHelpers = {
  async getAll(): Promise<Task[]> {
    return await db.tasks.toArray();
  },

  async getById(id: TaskId): Promise<Task | undefined> {
    return await db.tasks.get(id);
  },

  async getByLifeArea(lifeAreaId: LifeAreaId): Promise<Task[]> {
    return await db.tasks.where('lifeAreaId').equals(lifeAreaId).toArray();
  },

  async getByGoal(goalId: GoalId): Promise<Task[]> {
    return await db.tasks.where('goalId').equals(goalId).toArray();
  },

  async getByProject(projectId: ProjectId): Promise<Task[]> {
    return await db.tasks.where('projectId').equals(projectId).toArray();
  },

  async getByDate(date: Date): Promise<Task[]> {
    const dateStr = date.toISOString().split('T')[0];
    return await db.tasks.where('scheduledDate').equals(dateStr).toArray();
  },

  async getCompleted(): Promise<Task[]> {
    return await db.tasks.where('completedAt').above(0).toArray();
  },

  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const now = new Date();
    const task: Task = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.tasks.add(task);
    return task;
  },

  async update(id: TaskId, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    const task = await db.tasks.get(id);
    if (!task) throw new Error(`Task with id ${id} not found`);
    
    const updated = { ...task, ...data, updatedAt: new Date() };
    await db.tasks.put(updated);
    return updated;
  },

  async delete(id: TaskId): Promise<void> {
    await db.tasks.delete(id);
  },

  async complete(id: TaskId): Promise<Task> {
    return await this.update(id, { completedAt: new Date() });
  },

  async uncomplete(id: TaskId): Promise<Task> {
    return await this.update(id, { completedAt: undefined });
  },
};

// JournalEntry CRUD operations
export const journalEntryHelpers = {
  async getAll(): Promise<JournalEntry[]> {
    return await db.journalEntries.toArray();
  },

  async getById(id: JournalEntryId): Promise<JournalEntry | undefined> {
    return await db.journalEntries.get(id);
  },

  async getByDate(date: string): Promise<JournalEntry | undefined> {
    return await db.journalEntries.where('date').equals(date).first();
  },

  async create(data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    const now = new Date();
    const entry: JournalEntry = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.journalEntries.add(entry);
    return entry;
  },

  async update(id: JournalEntryId, data: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>): Promise<JournalEntry> {
    const entry = await db.journalEntries.get(id);
    if (!entry) throw new Error(`JournalEntry with id ${id} not found`);
    
    const updated = { ...entry, ...data, updatedAt: new Date() };
    await db.journalEntries.put(updated);
    return updated;
  },

  async delete(id: JournalEntryId): Promise<void> {
    await db.journalEntries.delete(id);
  },

  async upsertByDate(date: string, content: string, mood?: JournalEntry['mood']): Promise<JournalEntry> {
    const existing = await this.getByDate(date);
    if (existing) {
      return await this.update(existing.id, { content, mood });
    } else {
      return await this.create({ date, content, mood });
    }
  },
};

// DaySummary CRUD operations
export const daySummaryHelpers = {
  async getAll(): Promise<DaySummary[]> {
    return await db.daySummaries.toArray();
  },

  async getByDate(date: string): Promise<DaySummary | undefined> {
    return await db.daySummaries.get(date);
  },

  async create(data: Omit<DaySummary, 'createdAt' | 'updatedAt'>): Promise<DaySummary> {
    const now = new Date();
    const summary: DaySummary = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.daySummaries.add(summary);
    return summary;
  },

  async update(date: string, data: Partial<Omit<DaySummary, 'date' | 'createdAt'>>): Promise<DaySummary> {
    const summary = await db.daySummaries.get(date);
    if (!summary) throw new Error(`DaySummary for date ${date} not found`);
    
    const updated = { ...summary, ...data, updatedAt: new Date() };
    await db.daySummaries.put(updated);
    return updated;
  },

  async delete(date: string): Promise<void> {
    await db.daySummaries.delete(date);
  },

  async upsertByDate(date: string, data: Partial<Omit<DaySummary, 'date' | 'createdAt'>>): Promise<DaySummary> {
    const existing = await this.getByDate(date);
    if (existing) {
      return await this.update(date, data);
    } else {
      return await this.create({ date, ...data });
    }
  },
};

// Seed data function
export async function seedDatabase(): Promise<void> {
  // Check if already seeded
  const existingLifeAreas = await lifeAreaHelpers.getAll();
  if (existingLifeAreas.length > 0) return;

  // Create default life areas
  const lifeAreas = [
    { name: 'Health', color: '#10B981', order: 1 },
    { name: 'Family', color: '#3B82F6', order: 2 },
    { name: 'Finance', color: '#F59E0B', order: 3 },
    { name: 'Learning', color: '#8B5CF6', order: 4 },
    { name: 'Community', color: '#EF4444', order: 5 },
  ];

  for (const lifeArea of lifeAreas) {
    await lifeAreaHelpers.create(lifeArea);
  }
}

// Export all helpers
export const dbHelpers = {
  lifeAreas: lifeAreaHelpers,
  goals: goalHelpers,
  projects: projectHelpers,
  tasks: taskHelpers,
  journalEntries: journalEntryHelpers,
  daySummaries: daySummaryHelpers,
  seed: seedDatabase,
};
