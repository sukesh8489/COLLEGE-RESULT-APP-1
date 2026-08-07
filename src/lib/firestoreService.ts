import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  DepartmentInfo,
  HODAccount,
  StaffMember,
  Student,
  Subject,
  SubjectAssignment,
} from '../types';
import { DEPARTMENTS } from '../data/mockData';

// Collection References
const COLLECTIONS = {
  DEPARTMENTS: 'departments',
  HODS: 'hods',
  STAFF: 'staff',
  STUDENTS: 'students',
  SUBJECTS: 'subjects',
  ASSIGNMENTS: 'assignments',
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
        batch.set(docRef, dept);
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
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => doc.data() as HODAccount);
    callback(data);
  });
};

export const subscribeToStaff = (callback: (staff: StaffMember[]) => void) => {
  const colRef = collection(db, COLLECTIONS.STAFF);
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => doc.data() as StaffMember);
    callback(data);
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
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => doc.data() as Subject);
    callback(data);
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

// --- Single Document Operations ---

export const saveDepartmentInFirestore = async (dept: DepartmentInfo) => {
  const docRef = doc(db, COLLECTIONS.DEPARTMENTS, dept.code);
  await setDoc(docRef, dept);
};

export const deleteDepartmentFromFirestore = async (code: string) => {
  const docRef = doc(db, COLLECTIONS.DEPARTMENTS, code);
  await deleteDoc(docRef);
};

export const saveHodInFirestore = async (hod: HODAccount) => {
  const docRef = doc(db, COLLECTIONS.HODS, hod.hodId);
  await setDoc(docRef, hod);
};

export const deleteHodFromFirestore = async (hodId: string) => {
  const docRef = doc(db, COLLECTIONS.HODS, hodId);
  await deleteDoc(docRef);
};

export const saveStaffInFirestore = async (staff: StaffMember) => {
  const docRef = doc(db, COLLECTIONS.STAFF, staff.staffId);
  await setDoc(docRef, staff);
};

export const deleteStaffFromFirestore = async (staffId: string) => {
  const docRef = doc(db, COLLECTIONS.STAFF, staffId);
  await deleteDoc(docRef);
};

export const saveStudentInFirestore = async (student: Student) => {
  const docRef = doc(db, COLLECTIONS.STUDENTS, student.registerNumber);
  await setDoc(docRef, student);
};

export const saveMultipleStudentsInFirestore = async (students: Student[]) => {
  const batch = writeBatch(db);
  students.forEach((s) => {
    const docRef = doc(db, COLLECTIONS.STUDENTS, s.registerNumber);
    batch.set(docRef, s);
  });
  await batch.commit();
};

export const deleteStudentFromFirestore = async (registerNumber: string) => {
  const docRef = doc(db, COLLECTIONS.STUDENTS, registerNumber);
  await deleteDoc(docRef);
};

export const saveSubjectInFirestore = async (subject: Subject) => {
  const docRef = doc(db, COLLECTIONS.SUBJECTS, subject.code);
  await setDoc(docRef, subject);
};

export const deleteSubjectFromFirestore = async (code: string) => {
  const docRef = doc(db, COLLECTIONS.SUBJECTS, code);
  await deleteDoc(docRef);
};

export const saveAssignmentInFirestore = async (assignment: SubjectAssignment) => {
  const docRef = doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id);
  await setDoc(docRef, assignment);
};

export const deleteAssignmentFromFirestore = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.ASSIGNMENTS, id);
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
