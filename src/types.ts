export type RoleType = 'admin' | 'hod' | 'staff' | 'student' | 'exam_cell';

export type DegreeType = 'B.E' | 'B.Tech';

export type ExamType =
  | 'CAT-1'
  | 'CAT-2'
  | 'CAT-3'
  | 'M-1'
  | 'M-2'
  | 'M-3'
  | 'Practical'
  | 'IAT-1'
  | 'IAT-2'
  | 'IAT-3'
  | 'MODEL_EXAM'
  | 'SEMESTER';

export interface DepartmentInfo {
  code: string; // e.g. 'CSE', 'AIDS', 'ECE'
  name: string; // e.g. 'Computer Science and Engineering'
  degree?: DegreeType;
  description?: string;
}

export interface HODAccount {
  hodId: string;
  password: string;
  name: string;
  email: string;
  department: string; // department code e.g. 'CSE'
  phone?: string;
  photoUrl?: string;
}

export interface Subject {
  code: string;
  name: string;
  department: string;
  semester: number;
  credits?: number;
  maxMarks: number;
}

export interface SubjectAssignment {
  id: string;
  subjectCode: string;
  staffId: string;
  department: string;
}

export interface SubjectMark {
  subjectCode: string;
  subjectName: string;
  maxMarks: number;
  marksObtained: number;
  grade?: string;
  status: 'PASS' | 'FAIL' | 'ABSENT';
}

export interface ExamRecord {
  id: string; // e.g., "211419104001-SEM6-IAT-1"
  registerNumber: string;
  semester: number;
  examType: ExamType;
  academicYear: string;
  marks: SubjectMark[];
  totalObtained: number;
  maxTotal: number;
  percentage: number;
  overallStatus: 'PASS' | 'FAIL';
  enteredByStaffId?: string;
  datePublished: string;
}

export interface ExamSchedule {
  id: string; // e.g., "EXAM-CSE-SEM6-IAT1-CS8691"
  examType: ExamType;
  department: string; // e.g. 'CSE' or 'ALL'
  semester: number; // 1-8
  subjectCode: string;
  subjectName: string;
  examDate: string; // YYYY-MM-DD
  examTime: string; // e.g., "10:00 AM - 01:00 PM"
  session: 'FN' | 'AN'; // Forenoon or Afternoon
  venue?: string; // e.g., "Exam Hall A-102"
  instructions?: string;
  createdAt?: string;
}

export interface AttendanceRecord {
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  semester?: number;
  lastUpdated?: string;
}

export interface Student {
  registerNumber: string;
  name: string;
  dob: string; // YYYY-MM-DD
  department: string;
  year: 1 | 2 | 3 | 4; // 1st, 2nd, 3rd, 4th Year
  currentSemester: number; // 1-8
  batch: string; // e.g. "2021-2025"
  email: string;
  phone?: string;
  photoUrl?: string;
  attendance?: AttendanceRecord;
  examRecords: ExamRecord[];
}

export interface StaffMember {
  staffId: string;
  password: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone?: string;
  photoUrl?: string;
  isCC?: boolean; // Class Counselor / Class Incharge
  ccYear?: number; // e.g. 1, 2, 3, 4
  ccSemester?: number; // e.g. 1, 2, 3, 4, 5, 6, 7, 8
  ccBatch?: string; // e.g. "2023-2027" or "Sec A"
}

export type DailyAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'ON_DUTY';

export type AcademicEventCategory =
  | 'INTERNAL_ASSESSMENT' // IAT-1, IAT-2, Model Exam
  | 'SEMESTER_EXAM'       // Anna University Theory / Practical Exams
  | 'HOLIDAY'             // College / National / State Holidays
  | 'ACADEMIC_MILESTONE'  // Reopening, Last Working Day, Fee Deadlines, Course Registration
  | 'COLLEGE_EVENT'       // Symposium, Cultural, Sports Day, Graduation Day
  | 'CIRCULAR';           // General Notice / Exam Cell Memo

export interface AcademicCalendarEvent {
  id: string; // e.g., "EVENT-2026-08-20-IAT1"
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  category: AcademicEventCategory;
  targetAudience: 'ALL' | 'STUDENTS' | 'FACULTY' | string; // e.g. 'CSE' or 'ALL'
  isHoliday?: boolean;
  semester?: number; // 0 or undefined for All, or 1-8
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  venueOrLocation?: string;
  publishedBy?: string; // e.g. "Central Exam Cell, JSEC"
  attachmentsNote?: string;
  createdAt: string;
}

export interface StudentDailyStatus {
  registerNumber: string;
  studentName: string;
  status: DailyAttendanceStatus;
  remarks?: string;
}

export interface DailyAttendanceRecord {
  id: string; // e.g., "ATT-CSE-SEM6-2026-08-08-FN"
  date: string; // YYYY-MM-DD
  department: string;
  semester: number;
  session: 'FN' | 'AN';
  markedByStaffId: string;
  markedByStaffName: string;
  createdAt: string;
  records: StudentDailyStatus[];
  totalStudents?: number;
  presentCount?: number;
  absentCount?: number;
  odCount?: number;
  leaveCount?: number;
}

export type ExamAttendanceStatus = 'PRESENT' | 'ABSENT' | 'ON_DUTY' | 'MALPRACTICE' | 'MEDICAL';

export interface ExamStudentStatus {
  registerNumber: string;
  studentName: string;
  status: ExamAttendanceStatus;
  answerBookletNo?: string;
  hallNo?: string;
  remarks?: string;
}

export interface ExamAttendanceRecord {
  id: string; // e.g. "EXAM-ATT-CSE-SEM6-IAT1-CS8691-2026-08-20-FN"
  examType: ExamType;
  department: string;
  year: number; // 1, 2, 3, 4
  semester: number; // 1 to 8
  subjectCode: string;
  subjectName: string;
  examDate: string; // YYYY-MM-DD
  session: 'FN' | 'AN';
  hallNumber?: string;
  invigilatorStaffId?: string;
  invigilatorName?: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  odCount: number;
  malpracticeCount: number;
  medicalCount: number;
  records: ExamStudentStatus[];
  createdAt: string;
  updatedAt?: string;
}

export interface CurrentUser {
  role: RoleType;
  id: string; // staffId, hodId, registerNumber, or 'KUMAR@1120'
  name: string;
  department?: string;
  photoUrl?: string;
  studentData?: Student;
  staffData?: StaffMember;
  hodData?: HODAccount;
}

export type PermissionScope =
  | 'MARKS_ENTRY'
  | 'IAT_EXAM_ATTENDANCE'
  | 'DAILY_ATTENDANCE'
  | 'SUBJECT_ATTENDANCE';

export interface EntryWindowRule {
  id: string; // "WIN-IAT1-CSE-CS8691" or "WIN-MARKS-IAT1"
  scope?: PermissionScope;
  title: string; // e.g., "IAT-1 Internal Marks Entry Window"
  examType?: ExamType;
  department?: string; // 'ALL' or specific dept e.g. 'CSE'
  semester?: number; // 0 for all, or 1-8
  subjectCode?: string; // specific subject code or 'ALL'
  staffId?: string; // specific staff ID or 'ALL'
  startDate: string; // ISO string e.g. '2026-08-20T08:30:00.000Z'
  endDate?: string; // ISO string e.g. '2026-08-23T23:59:59.000Z'
  status?: 'OPEN' | 'LOCKED' | 'EXTENDED';
  isEnabled?: boolean;
  durationLabel?: string; // e.g., "3 Days Window" or "90 Minutes Window"
  reasonOrNotes?: string;
  reason?: string;
  grantedBy?: string; // e.g., "Central Exam Cell (Admin)"
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EntryPermissionPolicy {
  id?: string; // e.g. "EXAM_CELL_POLICY"
  // Default durations configured by exam cell
  marksEntryWindowDays?: number; // e.g. 3 days (2-3 days standard)
  iatAttendanceWindowMinutes?: number; // e.g. 90 mins (60-90 mins standard)
  dailyAttendanceWindowHours?: number; // e.g. 24 hours
  
  // Master switches
  isMarksEntryGlobalEnabled: boolean;
  isIatAttendanceGlobalEnabled?: boolean;
  isDailyAttendanceGlobalEnabled?: boolean;
  isSubjectAttendanceGlobalEnabled?: boolean;

  // Window rules & overrides
  windowRules: EntryWindowRule[];
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ExtensionRequest {
  id: string;
  scope: PermissionScope;
  examType?: ExamType;
  department: string;
  semester: number;
  subjectCode?: string;
  subjectName?: string;
  staffId: string;
  staffName: string;
  requestedExtension: string; // "+1 Hour", "+1 Day", "+3 Days"
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

