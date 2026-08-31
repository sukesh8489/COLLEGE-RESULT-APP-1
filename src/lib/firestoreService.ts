import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  DepartmentInfo,
  DailyAttendanceRecord,
  EntryPermissionPolicy,
  ExamAttendanceRecord,
  ExamSchedule,
  ExtensionRequest,
  HODAccount,
  StaffMember,
  Student,
  Subject,
  SubjectAssignment,
  AcademicCalendarEvent,
} from '../types';
import {
  DEPARTMENTS,
  INITIAL_HODS,
  INITIAL_STAFF,
  INITIAL_STUDENTS,
  SUBJECTS,
  INITIAL_EXAMS,
  INITIAL_ACADEMIC_EVENTS,
  INITIAL_EXAM_ATTENDANCE,
  INITIAL_ENTRY_POLICY,
  INITIAL_EXTENSION_REQUESTS,
} from '../data/mockData';

/**
 * Recursively strips all keys with `undefined` values from an object or array
 * to prevent Firestore "Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized as T;
  }
  return data;
}

// Collection References
export const COLLECTIONS = {
  DEPARTMENTS: 'departments',
  HODS: 'hods',
  STAFF: 'staff',
  STUDENTS: 'students',
  SUBJECTS: 'subjects',
  ASSIGNMENTS: 'assignments',
  EXAMS: 'exams',
  DAILY_ATTENDANCE: 'dailyAttendance',
  ACADEMIC_EVENTS: 'academicEvents',
  EXAM_ATTENDANCE: 'examAttendance',
  ENTRY_POLICY: 'entryPolicy',
  EXTENSION_REQUESTS: 'extensionRequests',
};

// --- Realtime Subscriptions ---

export const subscribeToDepartments = (
  callback: (depts: DepartmentInfo[]) => void
) => {
  const colRef = collection(db, COLLECTIONS.DEPARTMENTS);
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      // Seed initial default departments if collection is empty
      const batch = writeBatch(db);
      DEPARTMENTS.forEach((dept) => {
        const docRef = doc(db, COLLECTIONS.DEPARTMENTS, dept.code);
        batch.set(docRef, sanitizeForFirestore(dept));
      });
      await batch.commit();
    } else {
      const data = snapshot.docs.map((doc) => doc.data() as DepartmentInfo);
      callback(data);
    }
  });
};

export const subscribeToHods = (callback: (hods: HODAccount[]) => void) => {
  const colRef = collection(db, COLLECTIONS.HODS);
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty && INITIAL_HODS.length > 0) {
      const batch = writeBatch(db);
      INITIAL_HODS.forEach((hod) => {
        const docRef = doc(db, COLLECTIONS.HODS, hod.hodId);
        batch.set(docRef, sanitizeForFirestore(hod));
      });
      await batch.commit();
    } else {
      const data = snapshot.docs.map((doc) => doc.data() as HODAccount);
      callback(data);
    }
  });
};

export const subscribeToStaff = (callback: (staff: StaffMember[]) => void) => {
  const colRef = collection(db, COLLECTIONS.STAFF);
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty && INITIAL_STAFF.length > 0) {
      const batch = writeBatch(db);
      INITIAL_STAFF.forEach((staff) => {
        const docRef = doc(db, COLLECTIONS.STAFF, staff.staffId);
        batch.set(docRef, sanitizeForFirestore(staff));
      });
      await batch.commit();
    } else {
      const data = snapshot.docs.map((doc) => doc.data() as StaffMember);
      callback(data);
    }
  });
};

export const subscribeToStudents = (callback: (students: Student[]) => void) => {
  const colRef = collection(db, COLLECTIONS.STUDENTS);
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => doc.data() as Student);
    callback(data);
  });
};

export const subscribeToSubjects = (callback: (subjects: Subject[]) => void) => {
  const colRef = collection(db, COLLECTIONS.SUBJECTS);
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty && SUBJECTS.length > 0) {
      const batch = writeBatch(db);
      SUBJECTS.forEach((subj) => {
        const docRef = doc(db, COLLECTIONS.SUBJECTS, subj.code);
        batch.set(docRef, sanitizeForFirestore(subj));
      });
      await batch.commit();
    } else {
      const data = snapshot.docs.map((doc) => doc.data() as Subject);
      callback(data);
    }
  });
};

export const subscribeToAssignments = (
  callback: (assignments: SubjectAssignment[]) => void
) => {
  const colRef = collection(db, COLLECTIONS.ASSIGNMENTS);
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => doc.data() as SubjectAssignment);
    callback(data);
  });
};

export const subscribeToExams = (
  callback: (exams: ExamSchedule[]) => void
) => {
  const colRef = collection(db, COLLECTIONS.EXAMS);
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty && INITIAL_EXAMS.length > 0) {
      // Seed initial default exam schedules if collection is empty
      const batch = writeBatch(db);
      INITIAL_EXAMS.forEach((ex) => {
        const docRef = doc(db, COLLECTIONS.EXAMS, ex.id);
        batch.set(docRef, sanitizeForFirestore(ex));
      });
      await batch.commit();
    } else {
      const data = snapshot.docs.map((doc) => doc.data() as ExamSchedule);
      callback(data);
    }
  });
};

export const subscribeToDailyAttendance = (
  callback: (records: DailyAttendanceRecord[]) => void
) => {
  const colRef = collection(db, COLLECTIONS.DAILY_ATTENDANCE);
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => doc.data() as DailyAttendanceRecord);
    callback(data);
  });
};

export const subscribeToAcademicEvents = (
  callback: (events: AcademicCalendarEvent[]) => void
) => {
  const colRef = collection(db, COLLECTIONS.ACADEMIC_EVENTS);
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty && INITIAL_ACADEMIC_EVENTS.length > 0) {
      // Seed initial default academic events if collection is empty
      const batch = writeBatch(db);
      INITIAL_ACADEMIC_EVENTS.forEach((ev) => {
        const docRef = doc(db, COLLECTIONS.ACADEMIC_EVENTS, ev.id);
        batch.set(docRef, sanitizeForFirestore(ev));
      });
      await batch.commit();
    } else {
      const data = snapshot.docs.map((doc) => doc.data() as AcademicCalendarEvent);
      // Sort events by startDate ascending
      data.sort((a, b) => a.startDate.localeCompare(b.startDate));
      callback(data);
    }
  });
};

export const subscribeToExamAttendance = (
  callback: (records: ExamAttendanceRecord[]) => void
) => {
  const colRef = collection(db, COLLECTIONS.EXAM_ATTENDANCE);
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty && INITIAL_EXAM_ATTENDANCE.length > 0) {
      // Seed initial default exam attendance if collection is empty
      const batch = writeBatch(db);
      INITIAL_EXAM_ATTENDANCE.forEach((rec) => {
        const docRef = doc(db, COLLECTIONS.EXAM_ATTENDANCE, rec.id);
        batch.set(docRef, sanitizeForFirestore(rec));
      });
      await batch.commit();
    } else {
      const data = snapshot.docs.map((doc) => doc.data() as ExamAttendanceRecord);
      // Sort by examDate descending
      data.sort((a, b) => b.examDate.localeCompare(a.examDate));
      callback(data);
    }
  });
};

// --- Single Document Operations ---

export const saveDepartmentInFirestore = async (dept: DepartmentInfo) => {
  const docRef = doc(db, COLLECTIONS.DEPARTMENTS, dept.code);
  await setDoc(docRef, sanitizeForFirestore(dept));
};

export const deleteDepartmentFromFirestore = async (code: string) => {
  const cleanCode = code.trim();
  const upper = cleanCode.toUpperCase();
  const docRef = doc(db, COLLECTIONS.DEPARTMENTS, cleanCode);
  await deleteDoc(docRef);
  if (upper !== cleanCode) {
    await deleteDoc(doc(db, COLLECTIONS.DEPARTMENTS, upper)).catch(() => {});
  }

  // Also clean up all department documents with alias or case differences
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.DEPARTMENTS));
    const batch = writeBatch(db);
    let count = 0;
    snap.docs.forEach((d) => {
      const dData = d.data() as DepartmentInfo;
      const dCode = (dData.code || d.id).toString().trim().toUpperCase();
      if (
        d.id === cleanCode ||
        dCode === upper ||
        ((upper === 'AIDA' || upper === 'AI&DA' || upper === 'AIDS') &&
          ['AIDA', 'AI&DA', 'AIDS', 'AI & DA', 'AI-DS'].includes(dCode))
      ) {
        batch.delete(d.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    console.error('Error cleaning up department documents:', err);
  }

  // Also remove orphaned subjects attached to this department
  try {
    const subjSnap = await getDocs(collection(db, COLLECTIONS.SUBJECTS));
    const subjBatch = writeBatch(db);
    let subjCount = 0;
    subjSnap.docs.forEach((d) => {
      const data = d.data() as Subject;
      const subjDept = (data.department || '').trim().toUpperCase();
      if (
        subjDept === upper ||
        ((upper === 'AIDA' || upper === 'AI&DA' || upper === 'AIDS') &&
          ['AIDA', 'AI&DA', 'AIDS', 'AI & DA', 'AI-DS'].includes(subjDept))
      ) {
        subjBatch.delete(d.ref);
        subjCount++;
      }
    });
    if (subjCount > 0) {
      await subjBatch.commit();
    }
  } catch (err) {
    console.error('Error cleaning up department subjects:', err);
  }
};

export const saveHodInFirestore = async (hod: HODAccount) => {
  const docRef = doc(db, COLLECTIONS.HODS, hod.hodId);
  await setDoc(docRef, sanitizeForFirestore(hod));
};

export const deleteHodFromFirestore = async (hodId: string) => {
  const docRef = doc(db, COLLECTIONS.HODS, hodId);
  await deleteDoc(docRef);
};

export const saveStaffInFirestore = async (staff: StaffMember) => {
  const docRef = doc(db, COLLECTIONS.STAFF, staff.staffId);
  await setDoc(docRef, sanitizeForFirestore(staff));
};

export const deleteStaffFromFirestore = async (staffId: string) => {
  const docRef = doc(db, COLLECTIONS.STAFF, staffId);
  await deleteDoc(docRef);
};

export const saveStudentInFirestore = async (student: Student) => {
  const docRef = doc(db, COLLECTIONS.STUDENTS, student.registerNumber);
  await setDoc(docRef, sanitizeForFirestore(student));
};

export const saveMultipleStudentsInFirestore = async (students: Student[]) => {
  const batch = writeBatch(db);
  students.forEach((s) => {
    const docRef = doc(db, COLLECTIONS.STUDENTS, s.registerNumber);
    batch.set(docRef, sanitizeForFirestore(s));
  });
  await batch.commit();
};

export const deleteStudentFromFirestore = async (registerNumber: string) => {
  const docRef = doc(db, COLLECTIONS.STUDENTS, registerNumber);
  await deleteDoc(docRef);
};

export const saveSubjectInFirestore = async (subject: Subject) => {
  const docRef = doc(db, COLLECTIONS.SUBJECTS, subject.code);
  await setDoc(docRef, sanitizeForFirestore(subject));
};

export const deleteSubjectFromFirestore = async (code: string) => {
  const cleanCode = code.trim();
  const upper = cleanCode.toUpperCase();
  const docRef = doc(db, COLLECTIONS.SUBJECTS, cleanCode);
  await deleteDoc(docRef);
  if (upper !== cleanCode) {
    await deleteDoc(doc(db, COLLECTIONS.SUBJECTS, upper)).catch(() => {});
  }

  // Query in case the document ID is different from subject code
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.SUBJECTS));
    const batch = writeBatch(db);
    let count = 0;
    snap.docs.forEach((d) => {
      const data = d.data() as Subject;
      if (d.id === cleanCode || d.id === upper || data.code?.trim().toUpperCase() === upper) {
        batch.delete(d.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    console.error('Error cleaning up subject document:', err);
  }
};

export const saveAssignmentInFirestore = async (assignment: SubjectAssignment) => {
  const docRef = doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id);
  await setDoc(docRef, sanitizeForFirestore(assignment));
};

export const deleteAssignmentFromFirestore = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.ASSIGNMENTS, id);
  await deleteDoc(docRef);
};

export const saveExamInFirestore = async (exam: ExamSchedule) => {
  const docRef = doc(db, COLLECTIONS.EXAMS, exam.id);
  await setDoc(docRef, sanitizeForFirestore(exam));
};

export const deleteExamFromFirestore = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.EXAMS, id);
  await deleteDoc(docRef);
};

export const saveDailyAttendanceInFirestore = async (record: DailyAttendanceRecord) => {
  const docRef = doc(db, COLLECTIONS.DAILY_ATTENDANCE, record.id);
  await setDoc(docRef, sanitizeForFirestore(record));
};

export const deleteDailyAttendanceFromFirestore = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.DAILY_ATTENDANCE, id);
  await deleteDoc(docRef);
};

export const saveAcademicEventInFirestore = async (event: AcademicCalendarEvent) => {
  const docRef = doc(db, COLLECTIONS.ACADEMIC_EVENTS, event.id);
  await setDoc(docRef, sanitizeForFirestore(event));
};

export const deleteAcademicEventFromFirestore = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.ACADEMIC_EVENTS, id);
  await deleteDoc(docRef);
};

export const saveExamAttendanceInFirestore = async (record: ExamAttendanceRecord) => {
  const docRef = doc(db, COLLECTIONS.EXAM_ATTENDANCE, record.id);
  await setDoc(docRef, sanitizeForFirestore(record));
};

export const deleteExamAttendanceFromFirestore = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.EXAM_ATTENDANCE, id);
  await deleteDoc(docRef);
};

// --- Array Sync Helpers ---

export const syncDepartmentsToFirestore = async (
  prev: DepartmentInfo[],
  next: DepartmentInfo[]
) => {
  const removed = prev.filter((p) => !next.some((n) => n.code === p.code));
  const updatedOrAdded = next.filter((n) => {
    const old = prev.find((p) => p.code === n.code);
    return !old || JSON.stringify(old) !== JSON.stringify(n);
  });

  for (const item of removed) {
    await deleteDepartmentFromFirestore(item.code);
  }
  for (const item of updatedOrAdded) {
    await saveDepartmentInFirestore(item);
  }
};

export const syncHodsToFirestore = async (
  prev: HODAccount[],
  next: HODAccount[]
) => {
  const removed = prev.filter((p) => !next.some((n) => n.hodId === p.hodId));
  const updatedOrAdded = next.filter((n) => {
    const old = prev.find((p) => p.hodId === n.hodId);
    return !old || JSON.stringify(old) !== JSON.stringify(n);
  });

  for (const item of removed) {
    await deleteHodFromFirestore(item.hodId);
  }
  for (const item of updatedOrAdded) {
    await saveHodInFirestore(item);
  }
};

export const syncStaffToFirestore = async (
  prev: StaffMember[],
  next: StaffMember[]
) => {
  const removed = prev.filter((p) => !next.some((n) => n.staffId === p.staffId));
  const updatedOrAdded = next.filter((n) => {
    const old = prev.find((p) => p.staffId === n.staffId);
    return !old || JSON.stringify(old) !== JSON.stringify(n);
  });

  for (const item of removed) {
    await deleteStaffFromFirestore(item.staffId);
  }
  for (const item of updatedOrAdded) {
    await saveStaffInFirestore(item);
  }
};

export const syncStudentsToFirestore = async (
  prev: Student[],
  next: Student[]
) => {
  const removed = prev.filter(
    (p) => !next.some((n) => n.registerNumber === p.registerNumber)
  );
  const updatedOrAdded = next.filter((n) => {
    const old = prev.find((p) => p.registerNumber === n.registerNumber);
    return !old || JSON.stringify(old) !== JSON.stringify(n);
  });

  for (const item of removed) {
    await deleteStudentFromFirestore(item.registerNumber);
  }
  if (updatedOrAdded.length === 1) {
    await saveStudentInFirestore(updatedOrAdded[0]);
  } else if (updatedOrAdded.length > 1) {
    await saveMultipleStudentsInFirestore(updatedOrAdded);
  }
};

export const syncSubjectsToFirestore = async (
  prev: Subject[],
  next: Subject[]
) => {
  const removed = prev.filter((p) => !next.some((n) => n.code === p.code));
  const updatedOrAdded = next.filter((n) => {
    const old = prev.find((p) => p.code === n.code);
    return !old || JSON.stringify(old) !== JSON.stringify(n);
  });

  for (const item of removed) {
    await deleteSubjectFromFirestore(item.code);
  }
  for (const item of updatedOrAdded) {
    await saveSubjectInFirestore(item);
  }
};

export const syncAssignmentsToFirestore = async (
  prev: SubjectAssignment[],
  next: SubjectAssignment[]
) => {
  const removed = prev.filter((p) => !next.some((n) => n.id === p.id));
  const updatedOrAdded = next.filter((n) => {
    const old = prev.find((p) => p.id === n.id);
    return !old || JSON.stringify(old) !== JSON.stringify(n);
  });

  for (const item of removed) {
    await deleteAssignmentFromFirestore(item.id);
  }
  for (const item of updatedOrAdded) {
    await saveAssignmentInFirestore(item);
  }
};

export const syncExamsToFirestore = async (
  prev: ExamSchedule[],
  next: ExamSchedule[]
) => {
  const removed = prev.filter((p) => !next.some((n) => n.id === p.id));
  const updatedOrAdded = next.filter((n) => {
    const old = prev.find((p) => p.id === n.id);
    return !old || JSON.stringify(old) !== JSON.stringify(n);
  });

  for (const item of removed) {
    await deleteExamFromFirestore(item.id);
  }
  for (const item of updatedOrAdded) {
    await saveExamInFirestore(item);
  }
};

export const syncDailyAttendanceToFirestore = async (
  prev: DailyAttendanceRecord[],
  next: DailyAttendanceRecord[]
) => {
  const removed = prev.filter((p) => !next.some((n) => n.id === p.id));
  const updatedOrAdded = next.filter((n) => {
    const old = prev.find((p) => p.id === n.id);
    return !old || JSON.stringify(old) !== JSON.stringify(n);
  });

  for (const item of removed) {
    await deleteDailyAttendanceFromFirestore(item.id);
  }
  for (const item of updatedOrAdded) {
    await saveDailyAttendanceInFirestore(item);
  }
};

export const syncAcademicEventsToFirestore = async (
  prev: AcademicCalendarEvent[],
  next: AcademicCalendarEvent[]
) => {
  const removed = prev.filter((p) => !next.some((n) => n.id === p.id));
  const updatedOrAdded = next.filter((n) => {
    const old = prev.find((p) => p.id === n.id);
    return !old || JSON.stringify(old) !== JSON.stringify(n);
  });

  for (const item of removed) {
    await deleteAcademicEventFromFirestore(item.id);
  }
  for (const item of updatedOrAdded) {
    await saveAcademicEventInFirestore(item);
  }
};

export const syncExamAttendanceToFirestore = async (
  prev: ExamAttendanceRecord[],
  next: ExamAttendanceRecord[]
) => {
  const removed = prev.filter((p) => !next.some((n) => n.id === p.id));
  const updatedOrAdded = next.filter((n) => {
    const old = prev.find((p) => p.id === n.id);
    return !old || JSON.stringify(old) !== JSON.stringify(n);
  });

  for (const item of removed) {
    await deleteExamAttendanceFromFirestore(item.id);
  }
  for (const item of updatedOrAdded) {
    await saveExamAttendanceInFirestore(item);
  }
};

// --- Entry Permissions Policy & Extension Requests ---

export const subscribeToEntryPolicy = (
  callback: (policy: EntryPermissionPolicy) => void
) => {
  const docRef = doc(db, COLLECTIONS.ENTRY_POLICY, 'EXAM_CELL_POLICY_01');
  return onSnapshot(docRef, async (snapshot) => {
    if (!snapshot.exists()) {
      await setDoc(docRef, sanitizeForFirestore(INITIAL_ENTRY_POLICY));
      callback(INITIAL_ENTRY_POLICY);
    } else {
      const data = snapshot.data() as Partial<EntryPermissionPolicy> | undefined;
      const merged: EntryPermissionPolicy = {
        ...INITIAL_ENTRY_POLICY,
        ...data,
        isMarksEntryGlobalEnabled: data?.isMarksEntryGlobalEnabled ?? false,
        windowRules: Array.isArray(data?.windowRules) ? data.windowRules : [],
      };
      callback(merged);
    }
  });
};

export const saveEntryPolicyInFirestore = async (policy: EntryPermissionPolicy) => {
  const docRef = doc(db, COLLECTIONS.ENTRY_POLICY, policy.id || 'EXAM_CELL_POLICY_01');
  await setDoc(docRef, sanitizeForFirestore(policy), { merge: true });
};

export const subscribeToExtensionRequests = (
  callback: (requests: ExtensionRequest[]) => void
) => {
  const colRef = collection(db, COLLECTIONS.EXTENSION_REQUESTS);
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      const batch = writeBatch(db);
      INITIAL_EXTENSION_REQUESTS.forEach((req) => {
        const docRef = doc(db, COLLECTIONS.EXTENSION_REQUESTS, req.id);
        batch.set(docRef, sanitizeForFirestore(req));
      });
      await batch.commit();
    } else {
      const data = snapshot.docs.map((d) => d.data() as ExtensionRequest);
      callback(data);
    }
  });
};

export const saveExtensionRequestInFirestore = async (request: ExtensionRequest) => {
  const docRef = doc(db, COLLECTIONS.EXTENSION_REQUESTS, request.id);
  await setDoc(docRef, sanitizeForFirestore(request), { merge: true });
};

export const deleteExtensionRequestFromFirestore = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.EXTENSION_REQUESTS, id);
  await deleteDoc(docRef);
};

// --- WHOLE COLLEGE DATABASE MANAGEMENT & RESET SUITE ---

/**
 * Deletes all documents in a specified Firestore collection.
 */
export const clearEntireCollection = async (collectionName: string) => {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return;

    // Firestore batch limit is 500 ops per commit
    const docs = snapshot.docs;
    const chunkSize = 400;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.error(`Error clearing collection ${collectionName}:`, err);
    throw err;
  }
};

/**
 * Resets the entire college database or selective sub-modules.
 */
export const resetWholeCollegeDatabase = async (options?: {
  wipeAll?: boolean;
  wipeStudents?: boolean;
  wipeStaff?: boolean;
  wipeHods?: boolean;
  wipeDailyAttendance?: boolean;
  wipeExamAttendance?: boolean;
  wipeExams?: boolean;
  wipeAssignments?: boolean;
  wipeSubjects?: boolean;
  wipeAcademicEvents?: boolean;
}) => {
  const isWipeAll = !options || options.wipeAll;

  if (isWipeAll || options?.wipeStudents) {
    await clearEntireCollection(COLLECTIONS.STUDENTS);
  }
  if (isWipeAll || options?.wipeStaff) {
    await clearEntireCollection(COLLECTIONS.STAFF);
  }
  if (isWipeAll || options?.wipeHods) {
    await clearEntireCollection(COLLECTIONS.HODS);
  }
  if (isWipeAll || options?.wipeDailyAttendance) {
    await clearEntireCollection(COLLECTIONS.DAILY_ATTENDANCE);
  }
  if (isWipeAll || options?.wipeExamAttendance) {
    await clearEntireCollection(COLLECTIONS.EXAM_ATTENDANCE);
  }
  if (isWipeAll || options?.wipeAssignments) {
    await clearEntireCollection(COLLECTIONS.ASSIGNMENTS);
  }
  if (isWipeAll || options?.wipeExams) {
    await clearEntireCollection(COLLECTIONS.EXAMS);
  }
  if (isWipeAll || options?.wipeAcademicEvents) {
    await clearEntireCollection(COLLECTIONS.ACADEMIC_EVENTS);
  }
  if (isWipeAll || options?.wipeSubjects) {
    await clearEntireCollection(COLLECTIONS.SUBJECTS);
  }
};

export const clearAllStudentsInFirestore = async () => {
  await clearEntireCollection(COLLECTIONS.STUDENTS);
};

export const clearAllSubjectsInFirestore = async () => {
  await clearEntireCollection(COLLECTIONS.SUBJECTS);
  await clearEntireCollection(COLLECTIONS.ASSIGNMENTS);
};

/**
 * Initializes/seeds standard Anna University department structure
 * and official academic calendar events.
 */
export const initializeWholeCollegeStructure = async () => {
  // 1. Departments across the college
  const deptBatch = writeBatch(db);
  DEPARTMENTS.forEach((dept) => {
    const docRef = doc(db, COLLECTIONS.DEPARTMENTS, dept.code);
    deptBatch.set(docRef, sanitizeForFirestore(dept));
  });
  await deptBatch.commit();

  // 2. Official Academic Calendar Milestones & Assessment Dates
  const eventBatch = writeBatch(db);
  INITIAL_ACADEMIC_EVENTS.forEach((ev) => {
    const docRef = doc(db, COLLECTIONS.ACADEMIC_EVENTS, ev.id);
    eventBatch.set(docRef, sanitizeForFirestore(ev));
  });
  await eventBatch.commit();
};


