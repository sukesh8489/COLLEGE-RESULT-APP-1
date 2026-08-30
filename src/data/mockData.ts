import {
  AcademicCalendarEvent,
  DepartmentInfo,
  EntryPermissionPolicy,
  ExamAttendanceRecord,
  ExamSchedule,
  ExtensionRequest,
  HODAccount,
  StaffMember,
  Student,
  Subject,
} from '../types';

export const DEPARTMENTS: DepartmentInfo[] = [
  // B.E Branches
  { code: 'CSE', name: 'Computer Science and Engineering', degree: 'B.E', description: 'School of Computing & Software Engineering' },
  { code: 'CSE-CS', name: 'CSE (Cyber Security)', degree: 'B.E', description: 'Department of Cyber Security & Forensics' },
  { code: 'BME', name: 'Biomedical Engineering', degree: 'B.E', description: 'School of Bio-Medical Engineering & Healthcare Tech' },
  { code: 'MECH', name: 'Mechanical Engineering', degree: 'B.E', description: 'School of Mechanical Sciences & Manufacturing' },
  { code: 'ECE', name: 'Electronics and Communication Engineering', degree: 'B.E', description: 'School of Electronics & Communication' },
  { code: 'EEE', name: 'Electrical and Electronics Engineering', degree: 'B.E', description: 'Department of Electrical & Electronics' },
  { code: 'CIVIL', name: 'Civil Engineering', degree: 'B.E', description: 'Department of Civil & Structural Engineering' },

  // B.Tech Branches
  { code: 'PHARMA', name: 'Pharmaceutical Technology', degree: 'B.Tech', description: 'School of Pharmaceutical Sciences' },
  { code: 'BIO-TECH', name: 'Biotechnology', degree: 'B.Tech', description: 'School of Bio-Technology & Genetic Engineering' },
  { code: 'IT', name: 'Information Technology', degree: 'B.Tech', description: 'Department of Information Technology & Cloud Systems' },

  // First Year S&H
  { code: 'S&H', name: 'Science and Humanities (First Year)', description: 'Department of Science, Mathematics & Humanities' },
];

export const INITIAL_HODS: HODAccount[] = [];

export const INITIAL_STAFF: StaffMember[] = [];

export const SUBJECTS: Subject[] = [];

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_EXAMS: ExamSchedule[] = [];

export const INITIAL_ACADEMIC_EVENTS: AcademicCalendarEvent[] = [
  {
    id: 'EVENT-2026-08-15-IND',
    title: 'Independence Day Celebrations & Holiday',
    description: '79th Independence Day Flag Hoisting at Main Ground followed by college holiday.',
    startDate: '2026-08-15',
    endDate: '2026-08-15',
    category: 'HOLIDAY',
    targetAudience: 'ALL',
    isHoliday: true,
    priority: 'HIGH',
    venueOrLocation: 'College Central Quadrangle (08:30 AM)',
    publishedBy: 'Central Exam Cell & Principal Office',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-08-20-IAT1',
    title: 'Internal Assessment Test - 1 (IAT-1) Commencement',
    description: 'Mandatory Centralized Assessment for all UG/PG Odd Semester Engineering classes.',
    startDate: '2026-08-20',
    endDate: '2026-08-27',
    category: 'INTERNAL_ASSESSMENT',
    targetAudience: 'ALL',
    isHoliday: false,
    priority: 'URGENT',
    venueOrLocation: 'All Allocated Exam Block Halls',
    publishedBy: 'Central Exam Cell',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-08-31-MARKS-LOCK',
    title: 'IAT-1 Marks Portal Freeze & Report Submission',
    description: 'Deadline for all Course Instructors and CCs to freeze internal marks and send deficiency reports.',
    startDate: '2026-08-31',
    endDate: '2026-08-31',
    category: 'ACADEMIC_MILESTONE',
    targetAudience: 'FACULTY',
    isHoliday: false,
    priority: 'HIGH',
    venueOrLocation: 'Exam Cell Portal',
    publishedBy: 'Central Exam Cell',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-09-05-TEACHERS',
    title: 'Teachers’ Day & Student Mentorship Conclave',
    description: 'Special felicitation ceremony and class counselor progress reviews.',
    startDate: '2026-09-05',
    endDate: '2026-09-05',
    category: 'COLLEGE_EVENT',
    targetAudience: 'ALL',
    isHoliday: false,
    priority: 'NORMAL',
    venueOrLocation: 'Dr. APJ Abdul Kalam Auditorium',
    publishedBy: 'Academic Council & Student Affairs',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-09-14-VINAYAGAR',
    title: 'Vinayagar Chathurthi Holiday',
    description: 'Declared Government Holiday for all college students, faculty, and administrative staff.',
    startDate: '2026-09-14',
    endDate: '2026-09-14',
    category: 'HOLIDAY',
    targetAudience: 'ALL',
    isHoliday: true,
    priority: 'NORMAL',
    publishedBy: 'Principal Office',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-09-18-SYMPOSIUM',
    title: 'National Tech Symposium: SAKTHI TECHFEST 2026',
    description: 'Annual Inter-Collegiate Technical Symposium hosted by CSE, AIDS, and Mech departments.',
    startDate: '2026-09-18',
    endDate: '2026-09-19',
    category: 'COLLEGE_EVENT',
    targetAudience: 'ALL',
    isHoliday: false,
    priority: 'HIGH',
    venueOrLocation: 'Tech Park & Conference Halls A-D',
    publishedBy: 'Organizing Committee & Central Exam Cell',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-09-24-IAT2',
    title: 'Internal Assessment Test - 2 (IAT-2) Window',
    description: 'Evaluation covering Units 3 & 4. Hall tickets required.',
    startDate: '2026-09-24',
    endDate: '2026-10-01',
    category: 'INTERNAL_ASSESSMENT',
    targetAudience: 'ALL',
    isHoliday: false,
    priority: 'URGENT',
    venueOrLocation: 'Central Examination Complex',
    publishedBy: 'Central Exam Cell',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-10-02-GANDHI',
    title: 'Gandhi Jayanthi Holiday',
    description: 'National Holiday.',
    startDate: '2026-10-02',
    endDate: '2026-10-02',
    category: 'HOLIDAY',
    targetAudience: 'ALL',
    isHoliday: true,
    priority: 'NORMAL',
    publishedBy: 'Central Admin',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-10-19-POOJA',
    title: 'Ayutha Pooja & Vijaya Dasami Holidays',
    description: 'Festive holidays for all departments and hostel premises.',
    startDate: '2026-10-19',
    endDate: '2026-10-20',
    category: 'HOLIDAY',
    targetAudience: 'ALL',
    isHoliday: true,
    priority: 'HIGH',
    publishedBy: 'College Administration',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-11-08-DEEPAVALI',
    title: 'Deepavali Holidays',
    description: 'College closed for festival celebrations. Classes resume on 11th Nov.',
    startDate: '2026-11-08',
    endDate: '2026-11-10',
    category: 'HOLIDAY',
    targetAudience: 'ALL',
    isHoliday: true,
    priority: 'HIGH',
    publishedBy: 'College Administration',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-11-12-MODEL',
    title: 'Model Practical & Theory Examination Window',
    description: 'Full syllabus pre-board exams simulating Anna University pattern.',
    startDate: '2026-11-12',
    endDate: '2026-11-19',
    category: 'INTERNAL_ASSESSMENT',
    targetAudience: 'ALL',
    isHoliday: false,
    priority: 'URGENT',
    venueOrLocation: 'Campus Academic Blocks',
    publishedBy: 'Central Exam Cell',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-11-21-LASTDAY',
    title: 'Last Working Day for Odd Semester 2026-27',
    description: 'Final attendance cutoff generation and generation of eligibility lists for Anna University Exams.',
    startDate: '2026-11-21',
    endDate: '2026-11-21',
    category: 'ACADEMIC_MILESTONE',
    targetAudience: 'ALL',
    isHoliday: false,
    priority: 'HIGH',
    publishedBy: 'Central Exam Cell',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-11-25-AUPRAC',
    title: 'Anna University Practical Examinations',
    description: 'Zone-1 Laboratory and Project Viva-Voce examinations with external examiners.',
    startDate: '2026-11-25',
    endDate: '2026-12-05',
    category: 'SEMESTER_EXAM',
    targetAudience: 'ALL',
    isHoliday: false,
    priority: 'URGENT',
    venueOrLocation: 'Department Laboratories',
    publishedBy: 'Central Exam Cell & Anna University',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EVENT-2026-12-10-AUTHEORY',
    title: 'Anna University End-Semester Theory Examinations',
    description: 'Commencement of Anna University Controller of Examinations (ACOE) Theory Exams.',
    startDate: '2026-12-10',
    endDate: '2026-12-30',
    category: 'SEMESTER_EXAM',
    targetAudience: 'ALL',
    isHoliday: false,
    priority: 'URGENT',
    venueOrLocation: 'University Examination Center',
    publishedBy: 'Anna University & Central Exam Cell',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
];

export const INITIAL_EXAM_ATTENDANCE: ExamAttendanceRecord[] = [];

export const INITIAL_ENTRY_POLICY: EntryPermissionPolicy = {
  id: 'EXAM_CELL_POLICY_01',
  marksEntryWindowDays: 3, // 2 to 3 days standard window for Internal Marks
  iatAttendanceWindowMinutes: 90, // 60 to 90 min window during IAT exam session
  dailyAttendanceWindowHours: 24, // 24 hours same-day window
  isMarksEntryGlobalEnabled: false, // Default is FALSE: Staff cannot enter/edit marks until Exam Cell Admin gives permission
  isIatAttendanceGlobalEnabled: true,
  isDailyAttendanceGlobalEnabled: true,
  isSubjectAttendanceGlobalEnabled: true,
  windowRules: [],
  lastUpdatedBy: 'Central Exam Cell (Admin)',
  lastUpdatedAt: new Date().toISOString(),
};

export const INITIAL_EXTENSION_REQUESTS: ExtensionRequest[] = [];




