import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { AdminPortal } from './components/AdminPortal';
import { HodPortal } from './components/HodPortal';
import { StaffPortal } from './components/StaffPortal';
import { StudentPortal } from './components/StudentPortal';
import { DepartmentInfo, HODAccount, StaffMember, Student, Subject, SubjectAssignment, CurrentUser } from './types';
import { DEPARTMENTS, INITIAL_HODS, INITIAL_STAFF, INITIAL_STUDENTS, SUBJECTS } from './data/mockData';
import { Sparkles } from 'lucide-react';
import {
  subscribeToDepartments,
  subscribeToHods,
  subscribeToStaff,
  subscribeToStudents,
  subscribeToSubjects,
  subscribeToAssignments,
  syncDepartmentsToFirestore,
  syncHodsToFirestore,
  syncStaffToFirestore,
  syncStudentsToFirestore,
  syncSubjectsToFirestore,
  syncAssignmentsToFirestore,
} from './lib/firestoreService';

export function App() {
  const [departments, setDepartments] = useState<DepartmentInfo[]>(DEPARTMENTS);
  const [hods, setHods] = useState<HODAccount[]>(INITIAL_HODS);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(INITIAL_STAFF);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [subjects, setSubjects] = useState<Subject[]>(SUBJECTS);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);

  // Current User Session State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem('jayasakthi_session_v4');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubDepts = subscribeToDepartments((data) => setDepartments(data));
    const unsubHods = subscribeToHods((data) => setHods(data));
    const unsubStaff = subscribeToStaff((data) => setStaffMembers(data));
    const unsubStudents = subscribeToStudents((data) => setStudents(data));
    const unsubSubjects = subscribeToSubjects((data) => setSubjects(data));
    const unsubAssign = subscribeToAssignments((data) => setSubjectAssignments(data));

    return () => {
      unsubDepts();
      unsubHods();
      unsubStaff();
      unsubStudents();
      unsubSubjects();
      unsubAssign();
    };
  }, []);

  // Sync Session to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('jayasakthi_session_v4', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('jayasakthi_session_v4');
    }
  }, [currentUser]);

  // Wrapped Setters that trigger Firestore sync
  const setDepartmentsWrapped: React.Dispatch<React.SetStateAction<DepartmentInfo[]>> = (action) => {
    setDepartments((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      syncDepartmentsToFirestore(prev, next);
      return next;
    });
  };

  const setHodsWrapped: React.Dispatch<React.SetStateAction<HODAccount[]>> = (action) => {
    setHods((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      syncHodsToFirestore(prev, next);
      return next;
    });
  };

  const setStaffMembersWrapped: React.Dispatch<React.SetStateAction<StaffMember[]>> = (action) => {
    setStaffMembers((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      syncStaffToFirestore(prev, next);
      return next;
    });
  };

  const setStudentsWrapped: React.Dispatch<React.SetStateAction<Student[]>> = (action) => {
    setStudents((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      syncStudentsToFirestore(prev, next);
      return next;
    });
  };

  const setSubjectsWrapped: React.Dispatch<React.SetStateAction<Subject[]>> = (action) => {
    setSubjects((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      syncSubjectsToFirestore(prev, next);
      return next;
    });
  };

  const setSubjectAssignmentsWrapped: React.Dispatch<React.SetStateAction<SubjectAssignment[]>> = (action) => {
    setSubjectAssignments((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      syncAssignmentsToFirestore(prev, next);
      return next;
    });
  };

  // Sync active student data
  const activeStudentData = currentUser?.role === 'student'
    ? students.find((s) => s.registerNumber === currentUser.id) || currentUser.studentData
    : null;

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-gray-900 font-sans flex flex-col antialiased selection:bg-amber-300 selection:text-slate-900">
      {/* Navigation Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateHome={() => setCurrentUser(null)}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full pb-12">
        {!currentUser ? (
          <div className="space-y-6 pt-4">
            <div className="text-center px-4 max-w-xl mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 text-[11px] font-extrabold rounded-full uppercase tracking-wider border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>OFFICIAL COLLEGE ACADEMIC PORTAL</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B2238] tracking-tight">
                Jaya Sakthi Engineering College
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Role-based access system connected to a common cloud database for Students, Staff, HOD, and Administrator.
              </p>
            </div>

            <LoginView
              students={students}
              staffMembers={staffMembers}
              hods={hods}
              onLoginSuccess={(user) => setCurrentUser(user)}
            />
          </div>
        ) : currentUser.role === 'admin' ? (
          <AdminPortal
            departments={departments}
            setDepartments={setDepartmentsWrapped}
            hods={hods}
            setHods={setHodsWrapped}
            staffMembers={staffMembers}
            students={students}
            subjects={subjects}
            setSubjects={setSubjectsWrapped}
            onLogout={handleLogout}
          />
        ) : currentUser.role === 'hod' ? (
          <HodPortal
            currentUser={currentUser}
            staffMembers={staffMembers}
            setStaffMembers={setStaffMembersWrapped}
            subjects={subjects}
            setSubjects={setSubjectsWrapped}
            subjectAssignments={subjectAssignments}
            setSubjectAssignments={setSubjectAssignmentsWrapped}
            students={students}
            onLogout={handleLogout}
          />
        ) : currentUser.role === 'staff' ? (
          <StaffPortal
            currentUser={currentUser}
            students={students}
            setStudents={setStudentsWrapped}
            subjects={subjects}
            onLogout={handleLogout}
          />
        ) : (
          activeStudentData ? (
            <StudentPortal student={activeStudentData} onLogout={handleLogout} />
          ) : (
            <div className="text-center py-12">
              <p className="text-xs text-gray-500">Student record not found.</p>
              <button
                onClick={handleLogout}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Back to Login
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 bg-[#0B2238] text-blue-200/80 text-xs text-center border-t border-blue-900/50 print:hidden mt-auto">
        <div className="max-w-4xl mx-auto space-y-1">
          <p className="font-semibold text-white">
            JAYA SAKTHI ENGINEERING COLLEGE
          </p>
          <p className="text-[11px] text-blue-300/70">
            Official Academic Results & Internal Assessment Portal
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
