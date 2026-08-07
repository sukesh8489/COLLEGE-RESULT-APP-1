export type RoleType = 'admin' | 'hod' | 'staff' | 'student';

export type ExamType = 'IAT-1' | 'IAT-2' | 'MODEL_EXAM' | 'SEMESTER';

export interface DepartmentInfo {
  code: string; // e.g. 'CSE', 'AIDS', 'ECE'
  name: string; // e.g. 'Computer Science and Engineering'
  description?: string;
}

export interface HODAccount {
  hodId: string;
  password: string;
  name: string;
  email: string;
  department: string; // department code e.g. 'CSE'
  phone?: string;
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
}

export interface CurrentUser {
  role: RoleType;
  id: string; // staffId, hodId, registerNumber, or 'KUMAR@1120'
  name: string;
  department?: string;
  studentData?: Student;
  staffData?: StaffMember;
  hodData?: HODAccount;
}
