'use client';

import { PublicHabitCard } from './PublicHabitCard';
import type { PublicHabitListItem } from '@/lib/types/public-habit';

interface PublicHabitsGridProps {
  habits: PublicHabitListItem[];
}

export const PublicHabitsGrid = ({ habits }: PublicHabitsGridProps) => {
  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          No public challenges available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {habits.map(habit => (
        <PublicHabitCard key={habit.id} habit={habit} />
      ))}
    </div>
  );
};
