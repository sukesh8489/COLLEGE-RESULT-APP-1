import {
  EntryPermissionPolicy,
  EntryWindowRule,
  ExamSchedule,
  ExamType,
  PermissionScope,
} from '../types';

export interface PermissionCheckResult {
  isAllowed: boolean;
  status: 'OPEN' | 'LOCKED' | 'EXPIRED' | 'NOT_STARTED';
  reason: string;
  timeRemaining?: string;
  startDate?: string;
  endDate?: string;
  matchedRule?: EntryWindowRule;
  allowedDurationLabel?: string;
}

/**
 * Format remaining time nicely (e.g. "2d 4h left", "45m left", "Expired")
 */
export function formatRemainingTime(endDateIso: string, now: Date = new Date()): { text: string; isUrgent: boolean; isExpired: boolean } {
  const target = new Date(endDateIso).getTime();
  const current = now.getTime();
  const diffMs = target - current;

  if (diffMs <= 0) {
    return { text: 'Expired', isUrgent: true, isExpired: true };
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remHours = diffHours % 24;
    return { text: `${diffDays}d ${remHours}h remaining`, isUrgent: diffDays <= 1, isExpired: false };
  }
  if (diffHours > 0) {
    const remMin = diffMin % 60;
    return { text: `${diffHours}h ${remMin}m remaining`, isUrgent: diffHours <= 2, isExpired: false };
  }
  return { text: `${diffMin}m remaining (Closing Soon)`, isUrgent: true, isExpired: false };
}

/**
 * Check if Marks Entry is permitted for a specific exam, department, semester, subject & staff
 * Default: LOCKED unless Exam Cell Admin grants permission.
 */
export function checkMarksEntryPermission(
  policy: EntryPermissionPolicy | undefined,
  examType: ExamType,
  department: string,
  semester: number,
  subjectCode: string,
  staffId?: string,
  now: Date = new Date()
): PermissionCheckResult {
  // If no policy is provided, default to locked
  if (!policy) {
    return {
      isAllowed: false,
      status: 'LOCKED',
      reason: 'Marks entry is locked by default. Exam Cell Admin permission is required.',
      allowedDurationLabel: 'Permission Required',
    };
  }

  // Check for specific override/window rules in policy first
  const rules = policy.windowRules || [];
  const marksRules = rules.filter(
    (r) =>
      (r.scope === 'MARKS_ENTRY' || !r.scope) &&
      (!r.examType || (r.examType as string) === 'ALL' || r.examType === examType) &&
      (!r.department || r.department === 'ALL' || r.department === department) &&
      (!r.semester || r.semester === 0 || r.semester === semester) &&
      (!r.subjectCode || r.subjectCode === 'ALL' || r.subjectCode === subjectCode) &&
      (!r.staffId || r.staffId === 'ALL' || r.staffId === staffId)
  );

  // If there are specific rules, check the most specific matching rule
  if (marksRules.length > 0) {
    // Sort so most specific comes first
    marksRules.sort((a, b) => {
      const scoreA =
        (a.subjectCode && a.subjectCode !== 'ALL' ? 4 : 0) +
        (a.staffId && a.staffId !== 'ALL' ? 4 : 0) +
        (a.department && a.department !== 'ALL' ? 2 : 0) +
        (a.examType && (a.examType as string) !== 'ALL' ? 1 : 0);
      const scoreB =
        (b.subjectCode && b.subjectCode !== 'ALL' ? 4 : 0) +
        (b.staffId && b.staffId !== 'ALL' ? 4 : 0) +
        (b.department && b.department !== 'ALL' ? 2 : 0) +
        (b.examType && (b.examType as string) !== 'ALL' ? 1 : 0);
      return scoreB - scoreA;
    });

    const rule = marksRules[0];
    const start = new Date(rule.startDate).getTime();
    const end = rule.endDate ? new Date(rule.endDate).getTime() : Infinity;
    const current = now.getTime();

    if (rule.status === 'LOCKED' || rule.isEnabled === false) {
      return {
        isAllowed: false,
        status: 'LOCKED',
        reason: `Marks entry locked by Exam Cell Admin (${rule.reasonOrNotes || rule.reason || 'Permission closed'}).`,
        startDate: rule.startDate,
        endDate: rule.endDate,
        matchedRule: rule,
        allowedDurationLabel: rule.durationLabel || `${policy.marksEntryWindowDays || 3} Days Window`,
      };
    }

    if (current < start) {
      return {
        isAllowed: false,
        status: 'NOT_STARTED',
        reason: `Marks entry window has not opened yet (Opens on ${new Date(rule.startDate).toLocaleString()}).`,
        startDate: rule.startDate,
        endDate: rule.endDate,
        matchedRule: rule,
        allowedDurationLabel: rule.durationLabel || `${policy.marksEntryWindowDays || 3} Days Window`,
      };
    }

    if (current > end) {
      return {
        isAllowed: false,
        status: 'EXPIRED',
        reason: `Marks entry window expired on ${new Date(rule.endDate).toLocaleString()} (Standard ${rule.durationLabel || policy.marksEntryWindowDays + ' days'} window ended). Contact Exam Cell Admin for extension.`,
        startDate: rule.startDate,
        endDate: rule.endDate,
        timeRemaining: 'Expired',
        matchedRule: rule,
        allowedDurationLabel: rule.durationLabel || `${policy.marksEntryWindowDays || 3} Days Window`,
      };
    }

    const remaining = formatRemainingTime(rule.endDate, now);
    return {
      isAllowed: true,
      status: 'OPEN',
      reason: `Marks Entry Permission is GRANTED by Exam Cell Admin until ${new Date(rule.endDate).toLocaleString()}.`,
      timeRemaining: remaining.text,
      startDate: rule.startDate,
      endDate: rule.endDate,
      matchedRule: rule,
      allowedDurationLabel: rule.durationLabel || `${policy.marksEntryWindowDays || 3} Days Window`,
    };
  }

  // If no specific rule, check if Global Switch is enabled
  if (policy?.isMarksEntryGlobalEnabled) {
    return {
      isAllowed: true,
      status: 'OPEN',
      reason: 'Global Staff Marks Entry permission has been enabled by Exam Cell Admin.',
      timeRemaining: `College-wide Open`,
      allowedDurationLabel: `${policy?.marksEntryWindowDays || 3} Days Window`,
    };
  }

  // Default: LOCKED
  return {
    isAllowed: false,
    status: 'LOCKED',
    reason: 'Marks entry is locked by default. Exam Cell Admin has not given permission to enter marks for this subject yet.',
    allowedDurationLabel: 'Permission Required',
  };
}

/**
 * Check if IAT Exam Attendance marking is permitted (Strict 60-90 min window from exam start)
 */
export function checkIatAttendancePermission(
  policy: EntryPermissionPolicy | undefined,
  examType: ExamType,
  department: string,
  semester: number,
  subjectCode: string,
  examDate?: string,
  examSession?: 'FN' | 'AN',
  staffId?: string,
  now: Date = new Date()
): PermissionCheckResult {
  if (!policy) {
    return {
      isAllowed: true,
      status: 'OPEN',
      reason: 'IAT 90-min Attendance Window is Active',
      timeRemaining: 'Active window',
      allowedDurationLabel: '90 Minutes Window',
    };
  }

  if (!policy.isIatAttendanceGlobalEnabled) {
    return {
      isAllowed: false,
      status: 'LOCKED',
      reason: 'Exam Cell has locked IAT Exam Attendance submission.',
      allowedDurationLabel: `${policy.iatAttendanceWindowMinutes || 90} Min Window`,
    };
  }

  // Check specific rules
  const rules = policy.windowRules || [];
  const attRules = rules.filter(
    (r) =>
      r.scope === 'IAT_EXAM_ATTENDANCE' &&
      (!r.examType || r.examType === examType) &&
      (!r.department || r.department === 'ALL' || r.department === department) &&
      (!r.semester || r.semester === 0 || r.semester === semester) &&
      (!r.subjectCode || r.subjectCode === 'ALL' || r.subjectCode === subjectCode)
  );

  if (attRules.length > 0) {
    const rule = attRules[0];
    const start = new Date(rule.startDate).getTime();
    const end = new Date(rule.endDate).getTime();
    const current = now.getTime();

    if (rule.status === 'LOCKED') {
      return {
        isAllowed: false,
        status: 'LOCKED',
        reason: 'Exam Cell has locked this attendance session.',
        matchedRule: rule,
        allowedDurationLabel: rule.durationLabel || `${policy.iatAttendanceWindowMinutes || 90} Mins`,
      };
    }

    if (current < start) {
      return {
        isAllowed: false,
        status: 'NOT_STARTED',
        reason: `IAT Attendance window opens at ${new Date(rule.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        matchedRule: rule,
        allowedDurationLabel: rule.durationLabel || `${policy.iatAttendanceWindowMinutes || 90} Mins`,
      };
    }

    if (current > end) {
      return {
        isAllowed: false,
        status: 'EXPIRED',
        reason: `IAT Attendance 60-90 min session window closed at ${new Date(rule.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Contact Exam Cell.`,
        matchedRule: rule,
        timeRemaining: 'Expired',
        allowedDurationLabel: rule.durationLabel || `${policy.iatAttendanceWindowMinutes || 90} Mins`,
      };
    }

    const remaining = formatRemainingTime(rule.endDate, now);
    return {
      isAllowed: true,
      status: 'OPEN',
      reason: `IAT Exam Attendance Window is OPEN (Duration: ${policy.iatAttendanceWindowMinutes || 90} Mins).`,
      timeRemaining: remaining.text,
      matchedRule: rule,
      allowedDurationLabel: rule.durationLabel || `${policy.iatAttendanceWindowMinutes || 90} Mins`,
    };
  }

  // If examDate is provided, check if today is the exam date and session time
  return {
    isAllowed: true,
    status: 'OPEN',
    reason: `IAT ${policy.iatAttendanceWindowMinutes || 90}-minute Exam Session attendance window active.`,
    timeRemaining: `${policy.iatAttendanceWindowMinutes || 90} min window`,
    allowedDurationLabel: `${policy.iatAttendanceWindowMinutes || 90} Minutes Window`,
  };
}

/**
 * Check Daily Class Attendance Permission
 */
export function checkDailyAttendancePermission(
  policy: EntryPermissionPolicy | undefined,
  dateStr: string,
  department: string,
  semester: number,
  staffId?: string,
  now: Date = new Date()
): PermissionCheckResult {
  if (!policy) {
    return {
      isAllowed: true,
      status: 'OPEN',
      reason: 'Daily Attendance Entry Active',
      allowedDurationLabel: '24 Hours Window',
    };
  }

  if (!policy.isDailyAttendanceGlobalEnabled) {
    return {
      isAllowed: false,
      status: 'LOCKED',
      reason: 'Central Exam Cell has temporarily paused Daily Attendance submission.',
      allowedDurationLabel: `${policy.dailyAttendanceWindowHours || 24} Hours Window`,
    };
  }

  // Check specific rules
  const rules = policy.windowRules || [];
  const dailyRules = rules.filter(
    (r) =>
      r.scope === 'DAILY_ATTENDANCE' &&
      (!r.department || r.department === 'ALL' || r.department === department) &&
      (!r.semester || r.semester === 0 || r.semester === semester)
  );

  if (dailyRules.length > 0) {
    const rule = dailyRules[0];
    if (rule.status === 'LOCKED') {
      return {
        isAllowed: false,
        status: 'LOCKED',
        reason: 'Daily attendance entry locked for this class by Exam Cell.',
        matchedRule: rule,
      };
    }
  }

  // Check if date is within policy allowed hours (e.g. within 24-48 hours of attendance date)
  const entryDate = new Date(dateStr).getTime();
  const today = new Date(now.toISOString().slice(0, 10)).getTime();
  const dayDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

  const maxAllowedDays = Math.ceil((policy.dailyAttendanceWindowHours || 24) / 24);

  if (dayDiff > maxAllowedDays) {
    return {
      isAllowed: false,
      status: 'EXPIRED',
      reason: `Daily Attendance for ${dateStr} is locked (> ${maxAllowedDays} days old). Request unlock from Exam Cell.`,
      allowedDurationLabel: `${policy.dailyAttendanceWindowHours || 24} Hours Window`,
    };
  }

  return {
    isAllowed: true,
    status: 'OPEN',
    reason: 'Daily Class Attendance is OPEN for entry and editing.',
    allowedDurationLabel: `${policy.dailyAttendanceWindowHours || 24} Hours Window`,
  };
}
