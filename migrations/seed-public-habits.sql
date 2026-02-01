-- Seed 3 public habits
INSERT INTO "PublicHabit" (id, slug, title, description, "objectiveType", rules, "isPublic", "isFeatured", icon, "createdAt")
VALUES
  (
    'public-habit-zero-sugar',
    'zero-sugar',
    'Zero Sugar',
    'Build a sugar-free lifestyle. Track your progress and compete with others in monthly, yearly, and lifetime rankings.',
    'NO_SUGAR_STREAK',
    ARRAY['addedSugarCounts', 'fruitDoesNotCount', 'missingDaysPending'],
    true,
    true,
    '🍬',
    NOW()
  ),
  (
    'public-habit-zero-alcohol',
    'zero-alcohol',
    'Zero Alcohol',
    'Build an alcohol-free lifestyle. Track your progress and compete with others in monthly, yearly, and lifetime rankings.',
    'ZERO_ALCOHOL',
    ARRAY['missingDaysPending'],
    true,
    true,
    '🚫',
    NOW()
  ),
  (
    'public-habit-active-days',
    'active-days',
    'Active Days',
    'Build a daily exercise habit. Track your progress and compete with others in monthly, yearly, and lifetime rankings.',
    'DAILY_EXERCISE',
    ARRAY['missingDaysPending'],
    true,
    true,
    '💪',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "isFeatured" = EXCLUDED."isFeatured";
