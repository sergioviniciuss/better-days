const REMINDER_PREFIX = 'betterDays_reminder_';

export function setReminder(challengeId: string, hours: number): void {
  const expiryTime = Date.now() + hours * 60 * 60 * 1000;
  const key = `${REMINDER_PREFIX}${challengeId}`;
  
  try {
    localStorage.setItem(key, expiryTime.toString());
  } catch (error) {
    console.error('Failed to set reminder:', error);
  }
}

export function checkReminder(challengeId: string): boolean {
  const key = `${REMINDER_PREFIX}${challengeId}`;
  
  try {
    const expiryTime = localStorage.getItem(key);
    
    if (!expiryTime) {
      return false;
    }
    
    const expiry = parseInt(expiryTime, 10);
    const now = Date.now();
    
    // If reminder has expired, clean it up
    if (now >= expiry) {
      localStorage.removeItem(key);
      return false;
    }
    
    // Reminder is still active
    return true;
  } catch (error) {
    console.error('Failed to check reminder:', error);
    return false;
  }
}

export function clearReminder(challengeId: string): void {
  const key = `${REMINDER_PREFIX}${challengeId}`;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear reminder:', error);
  }
}

