'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Goal } from '@/types';
import { dbHelpers } from '@/lib/db';

interface GoalsContextType {
  goals: Goal[];
  refreshGoals: () => Promise<void>;
  isLoading: boolean;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshGoals = async () => {
    try {
      setIsLoading(true);
      const goalsList = await dbHelpers.goals.getAll();
      setGoals(goalsList);
    } catch (error) {
      console.error('Error refreshing goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshGoals();
  }, []);

  return (
    <GoalsContext.Provider value={{ goals, refreshGoals, isLoading }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
}

