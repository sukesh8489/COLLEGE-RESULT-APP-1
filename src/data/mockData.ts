import { DepartmentInfo, HODAccount, StaffMember, Student, Subject } from '../types';

export const DEPARTMENTS: DepartmentInfo[] = [
  { code: 'AIDS', name: 'Artificial Intelligence and Data Science', description: 'School of Intelligent Systems' },
  { code: 'CSE', name: 'Computer Science and Engineering', description: 'School of Computing' },
  { code: 'MECH', name: 'Mechanical Engineering', description: 'School of Mechanical Sciences' },
  { code: 'PHARMA', name: 'Pharmaceutical Technology', description: 'School of Pharmaceutical Sciences' },
  { code: 'BIO-MED', name: 'Biomedical Engineering', description: 'School of Bio-Medical Engineering' },
  { code: 'BIO-TECH', name: 'Biotechnology', description: 'School of Bio-Technology' },
];

export const INITIAL_HODS: HODAccount[] = [];

export const INITIAL_STAFF: StaffMember[] = [];

export const SUBJECTS: Subject[] = [];

export const INITIAL_STUDENTS: Student[] = [];
