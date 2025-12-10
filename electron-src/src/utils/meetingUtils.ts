// src/utils/meetingUtils.ts
export type Frequency = "daily" | "weekly" | "biweekly" | "bimonthly" | "monthly";

export type Meeting = {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  frequency: Frequency;
  daysOfWeek?: string[]; // ["Mon","Tue",...] optional for weekly+
};

// Map day names to numbers with Monday = 1, Sunday = 7
const dayNameToNumMondayStart: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/**
 * Safely parse meetings from backend
 */
export function parseMeetings(raw: string | Meeting[] | null | undefined): Meeting[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Meeting[];
    } catch (e) {
      console.error("Failed to parse meetings:", e);
      return [];
    }
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

/**
 * Get the next occurrence date of a meeting
 */
function getNextOccurrence(meeting: Meeting, fromDate: Date = new Date()): Date | null {
  const { date, time, frequency, daysOfWeek } = meeting;
  const [hourStr, minStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  // Start from today (or fromDate)
  const now = new Date(fromDate);

  if (frequency === "daily") {
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }

  // Weekly or longer
  if (!daysOfWeek || daysOfWeek.length === 0) return null;

  const candidateDates: Date[] = [];

  for (const dayName of daysOfWeek) {
    const dayNum = dayNameToNumMondayStart[dayName];
    if (!dayNum) continue;

    // Calculate difference from today (Monday=1,...Sunday=7)
    const todayNum = ((now.getDay() + 6) % 7) + 1;
    let diff = dayNum - todayNum;
    if (diff < 0) diff += 7;

    // Candidate date for this weekday
    const d = new Date(now);
    d.setDate(d.getDate() + diff);
    d.setHours(hour, minute, 0, 0);

    // Adjust for biweekly/monthly if needed
    if (frequency === "biweekly") {
      if (d <= now) d.setDate(d.getDate() + 14);
    }
    if (frequency === "monthly") {
      if (d <= now) d.setMonth(d.getMonth() + 1);
    }

    if (d > now) candidateDates.push(d);
  }

  if (candidateDates.length === 0) return null;
  return new Date(Math.min(...candidateDates.map((d) => d.getTime())));
}


/**
 * Returns the next upcoming meeting date from a list
 */
export function getNextMeeting(meetings: Meeting[]): Date | null {
  const now = new Date();
  const upcomingDates = meetings
    .map((m) => getNextOccurrence(m, now))
    .filter((d): d is Date => d !== null);

  if (upcomingDates.length === 0) return null;

  return new Date(Math.min(...upcomingDates.map((d) => d.getTime())));
}

/**
 * Formats next meeting nicely with timezone support
 * @param date - The date to format
 * @param timezone - IANA timezone string (e.g., 'America/New_York', 'UTC'). Defaults to UTC if not provided.
 */
export function formatNextMeeting(date: Date | null, timezone?: string): string {
  if (!date) return "TBD";
  
  // Default to UTC if no timezone provided
  const tz = timezone || "UTC";
  
  try {
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
    });
  } catch (error) {
    console.error(`Invalid timezone '${tz}', falling back to UTC:`, error);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    });
  }
}
