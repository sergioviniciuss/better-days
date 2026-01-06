'use client';

interface ConfirmationCalendarProps {
  dates: string[]; // Dates to highlight (pending or confirmed)
  currentStates: Record<string, boolean | undefined>; // Current state: date -> consumedSugar (undefined = unconfirmed)
  editableDates: string[]; // Dates that can be edited
  onDateClick: (date: string) => void; // Parent handles state cycling
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
  userTimezone: string;
}

export function ConfirmationCalendar({
  dates,
  currentStates,
  editableDates,
  onDateClick,
  currentMonth,
  currentYear,
  onMonthChange,
  userTimezone,
}: ConfirmationCalendarProps) {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Create array of days with empty slots for alignment
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  const formatDateForComparison = (day: number) => {
    const month = (currentMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${currentYear}-${month}-${dayStr}`;
  };
  
  const isDateInList = (day: number | null) => {
    if (day === null) return false;
    const dateStr = formatDateForComparison(day);
    return dates.includes(dateStr);
  };
  
  const isEditable = (day: number | null) => {
    if (day === null) return false;
    const dateStr = formatDateForComparison(day);
    return editableDates.includes(dateStr);
  };
  
  const getDateState = (day: number | null): 'success' | 'failure' | 'unconfirmed' | null => {
    if (day === null) return null;
    const dateStr = formatDateForComparison(day);
    if (!isDateInList(day)) return null;
    const state = currentStates[dateStr];
    if (state === false) return 'success';
    if (state === true) return 'failure';
    return 'unconfirmed';
  };
  
  const handleDateClick = (day: number) => {
    const dateStr = formatDateForComparison(day);
    if (!isEditable(day)) return;
    onDateClick(dateStr);
  };
  
  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (currentMonth === 0) {
              onMonthChange(11, currentYear - 1);
            } else {
              onMonthChange(currentMonth - 1, currentYear);
            }
          }}
          className="px-3 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md min-h-[36px]"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={() => {
            if (currentMonth === 11) {
              onMonthChange(0, currentYear + 1);
            } else {
              onMonthChange(currentMonth + 1, currentYear);
            }
          }}
          className="px-3 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md min-h-[36px]"
        >
          →
        </button>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day names */}
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          
          const dateStr = formatDateForComparison(day);
          const isInList = isDateInList(day);
          const isEditableDate = isEditable(day);
          const state = getDateState(day);
          
          const isSuccess = state === 'success';
          const isFailure = state === 'failure';
          const isUnconfirmed = state === 'unconfirmed';
          
          return (
            <div
              key={day}
              className={`aspect-square flex flex-col items-center justify-center rounded-md text-sm transition-colors ${
                !isInList
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : isEditableDate
                  ? 'cursor-pointer'
                  : 'cursor-not-allowed'
              } ${
                isSuccess
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : isFailure
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : isUnconfirmed
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
              onClick={() => handleDateClick(day)}
            >
              <span className="font-medium">{day}</span>
              {isInList && (isSuccess || isFailure) && (
                <span className="text-xs mt-1">
                  {isSuccess ? '✓' : '✗'}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-4">
        Click once for ✓ (No Sugar), twice for ✗ (Consumed), three times to clear
      </p>
    </div>
  );
}

