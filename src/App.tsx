import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { StudentPortal } from './components/StudentPortal';
import { StaffPortal } from './components/StaffPortal';
import { HodPortal } from './components/HodPortal';
import { ExamCellPortal } from './components/ExamCellPortal';
import { DatabaseControlModal } from './components/DatabaseControlModal';
import {
  AcademicCalendarEvent,
  CurrentUser,
  DailyAttendanceRecord,
  DepartmentInfo,
  EntryPermissionPolicy,
  ExamSchedule,
  HODAccount,
  StaffMember,
  Student,
  Subject,
  SubjectAssignment,
} from './types';
import {
  DEPARTMENTS,
  INITIAL_ACADEMIC_EVENTS,
  INITIAL_ENTRY_POLICY,
  INITIAL_EXAMS,
  INITIAL_HODS,
  INITIAL_STAFF,
  INITIAL_STUDENTS,
  SUBJECTS,
} from './data/mockData';
import {
  subscribeToDepartments,
  subscribeToHods,
  subscribeToStaff,
  subscribeToStudents,
  subscribeToSubjects,
  subscribeToAssignments,
  subscribeToExams,
  subscribeToDailyAttendance,
  subscribeToAcademicEvents,
  subscribeToEntryPolicy,
  saveEntryPolicyInFirestore,
  saveDailyAttendanceInFirestore,
  syncDepartmentsToFirestore,
  syncHodsToFirestore,
  syncStaffToFirestore,
  syncStudentsToFirestore,
  syncSubjectsToFirestore,
  syncAssignmentsToFirestore,
  syncExamsToFirestore,
  syncDailyAttendanceToFirestore,
  syncAcademicEventsToFirestore,
  clearAllStudentsInFirestore,
} from './lib/firestoreService';

export function App() {
  const [departments, setDepartments] = useState<DepartmentInfo[]>(DEPARTMENTS);
  const [hods, setHods] = useState<HODAccount[]>(INITIAL_HODS);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(INITIAL_STAFF);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [subjects, setSubjects] = useState<Subject[]>(SUBJECTS);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>(INITIAL_EXAMS);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceRecord[]>([]);
  const [academicEvents, setAcademicEvents] = useState<AcademicCalendarEvent[]>(INITIAL_ACADEMIC_EVENTS);
  const [entryPolicy, setEntryPolicy] = useState<EntryPermissionPolicy>(INITIAL_ENTRY_POLICY);

  // Database Management Modal State
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // Current User Session State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const saved = localStorage.getItem('jayasakthi_session_v4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  // Real-time Firestore Subscriptions
  useEffect(() => {
    // Clear all existing student documents in the database
    clearAllStudentsInFirestore().catch((err) => {
      console.error('Error clearing student documents from Firestore:', err);
    });

    const unsubDepts = subscribeToDepartments((data) => setDepartments(data));
    const unsubHods = subscribeToHods((data) => setHods(data));
    const unsubStaff = subscribeToStaff((data) => setStaffMembers(data));
    const unsubStudents = subscribeToStudents((data) => setStudents(data));
    const unsubSubjects = subscribeToSubjects((data) => setSubjects(data));
    const unsubAssignments = subscribeToAssignments((data) => setSubjectAssignments(data));
    const unsubExams = subscribeToExams((data) => setExams(data));
    const unsubDailyAtt = subscribeToDailyAttendance((data) => setDailyAttendance(data));
    const unsubAcademicEvents = subscribeToAcademicEvents((data) => setAcademicEvents(data));
    const unsubPolicy = subscribeToEntryPolicy((data) => setEntryPolicy(data));

    return () => {
      unsubDepts();
      unsubHods();
      unsubStaff();
      unsubStudents();
      unsubSubjects();
      unsubAssignments();
      unsubExams();
      unsubDailyAtt();
      unsubAcademicEvents();
      unsubPolicy();
    };
  }, []);

  const handleUpdateEntryPolicy = (newPolicy: EntryPermissionPolicy) => {
    setEntryPolicy(newPolicy);
    saveEntryPolicyInFirestore(newPolicy);
  };

  // Save session to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('jayasakthi_session_v4', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('jayasakthi_session_v4');
    }
  }, [currentUser]);

  // Sync helpers to Firestore for real-time synchronization across all portals
  const setDepartmentsWrapped: React.Dispatch<React.SetStateAction<DepartmentInfo[]>> = (updater) => {
    setDepartments((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncDepartmentsToFirestore(prev, next);
      return next;
    });
  };

  const setHodsWrapped: React.Dispatch<React.SetStateAction<HODAccount[]>> = (updater) => {
    setHods((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncHodsToFirestore(prev, next);
      return next;
    });
  };

  const setStudentsWrapped: React.Dispatch<React.SetStateAction<Student[]>> = (updater) => {
    setStudents((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncStudentsToFirestore(prev, next);
      return next;
    });
  };

  const setStaffWrapped: React.Dispatch<React.SetStateAction<StaffMember[]>> = (updater) => {
    setStaffMembers((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncStaffToFirestore(prev, next);
      return next;
    });
  };

  const setSubjectsWrapped: React.Dispatch<React.SetStateAction<Subject[]>> = (updater) => {
    setSubjects((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncSubjectsToFirestore(prev, next);
      return next;
    });
  };

  const setAssignmentsWrapped: React.Dispatch<React.SetStateAction<SubjectAssignment[]>> = (updater) => {
    setSubjectAssignments((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncAssignmentsToFirestore(prev, next);
      return next;
    });
  };

  const setExamsWrapped: React.Dispatch<React.SetStateAction<ExamSchedule[]>> = (updater) => {
    setExams((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncExamsToFirestore(prev, next);
      return next;
    });
  };

  const setDailyAttendanceWrapped: React.Dispatch<React.SetStateAction<DailyAttendanceRecord[]>> = (updater) => {
    setDailyAttendance((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncDailyAttendanceToFirestore(prev, next);
      return next;
    });
  };

  const setAcademicEventsWrapped: React.Dispatch<React.SetStateAction<AcademicCalendarEvent[]>> = (updater) => {
    setAcademicEvents((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncAcademicEventsToFirestore(prev, next);
      return next;
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Find active student data dynamically from real-time students collection if role is student
  const activeStudentData =
    currentUser?.role === 'student'
      ? students.find((s) => s.registerNumber === currentUser.id) || currentUser.studentData
      : null;

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
            <div className="text-center px-4 max-w-xl mx-auto space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-[#0B2238] tracking-tight">
                Jaya Sakthi Engineering College
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
                Approved by AICTE, New Delhi &amp; Affiliated to Anna University, Chennai
                <br />
                <span className="text-gray-500 text-[11px]">Thiruninravur, Chennai &bull; Empowering Future Engineers</span>
              </p>
            </div>

            <LoginView
              students={students}
              staffMembers={staffMembers}
              hods={hods}
              onLoginSuccess={(user) => setCurrentUser(user)}
            />
          </div>
        ) : currentUser.role === 'student' ? (
          activeStudentData ? (
            <StudentPortal
              student={activeStudentData}
              exams={exams}
              dailyAttendance={dailyAttendance}
              academicEvents={academicEvents}
              onUpdateStudent={(updated) => {
                setStudentsWrapped((prev) =>
                  prev.map((s) => (s.registerNumber === updated.registerNumber ? updated : s))
                );
                if (currentUser) {
                  setCurrentUser((prev) =>
                    prev
                      ? {
                          ...prev,
                          photoUrl: updated.photoUrl,
                          studentData: updated,
                        }
                      : null
                  );
                }
              }}
              onLogout={handleLogout}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">Student profile record not found.</p>
              <button
                onClick={handleLogout}
                className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold"
              >
                Back to Login
              </button>
            </div>
          )
        ) : currentUser.role === 'staff' ? (
          <StaffPortal
            currentUser={currentUser}
            staffMembers={staffMembers}
            students={students}
            onUpdateStudents={setStudentsWrapped}
            subjects={subjects}
            subjectAssignments={subjectAssignments}
            exams={exams}
            dailyAttendance={dailyAttendance}
            onSaveDailyAttendance={(rec) => {
              saveDailyAttendanceInFirestore(rec);
              setDailyAttendanceWrapped((prev) => [rec, ...prev.filter((p) => p.id !== rec.id)]);
            }}
            academicEvents={academicEvents}
            entryPolicy={entryPolicy}
            onLogout={handleLogout}
          />
        ) : currentUser.role === 'hod' ? (
          <HodPortal
            currentUser={currentUser}
            hods={hods}
            staffMembers={staffMembers}
            onUpdateStaff={setStaffWrapped}
            students={students}
            onUpdateStudents={setStudentsWrapped}
            subjects={subjects}
            onUpdateSubjects={setSubjectsWrapped}
            subjectAssignments={subjectAssignments}
            onUpdateAssignments={setAssignmentsWrapped}
            dailyAttendance={dailyAttendance}
            exams={exams}
            academicEvents={academicEvents}
            entryPolicy={entryPolicy}
            onLogout={handleLogout}
          />
        ) : currentUser.role === 'exam_cell' ? (
          <ExamCellPortal
            currentUser={currentUser}
            departments={departments}
            students={students}
            subjects={subjects}
            exams={exams}
            academicEvents={academicEvents}
            onUpdateStudents={setStudentsWrapped}
            entryPolicy={entryPolicy}
            onUpdateEntryPolicy={handleUpdateEntryPolicy}
            onLogout={handleLogout}
            hods={hods}
            staffMembers={staffMembers}
            onAddDepartment={(newDept) => setDepartmentsWrapped((prev) => [...prev.filter((d) => d.code !== newDept.code), newDept])}
            onDeleteDepartment={(code) => setDepartmentsWrapped((prev) => prev.filter((d) => d.code !== code))}
            onAddHod={(newHod) => setHodsWrapped((prev) => [...prev.filter((h) => h.hodId !== newHod.hodId), newHod])}
            onDeleteHod={(id) => setHodsWrapped((prev) => prev.filter((h) => h.hodId !== id))}
            onAddStaff={(newStaff) => setStaffWrapped((prev) => [...prev.filter((s) => s.staffId !== newStaff.staffId), newStaff])}
            onDeleteStaff={(id) => setStaffWrapped((prev) => prev.filter((s) => s.staffId !== id))}
            onAddSubject={(newSubj) => setSubjectsWrapped((prev) => [...prev.filter((s) => s.code !== newSubj.code), newSubj])}
            onDeleteSubject={(code) => setSubjectsWrapped((prev) => prev.filter((s) => s.code !== code))}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Invalid user session role.</p>
            <button
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold"
            >
              Back to Login
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-gray-200/80 bg-white/50 text-center text-xs text-gray-500 print:hidden">
        <div className="max-w-5xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-gray-700">
            Jaya Sakthi Engineering College &bull; Academic &amp; Examination Portal
          </p>
          <p className="text-[11px] text-gray-400">
            St. Thomas Mount - Poonamallee - Avadi Road, Thiruninravur, Chennai, Tamil Nadu 602024
          </p>
        </div>
      </footer>

      {/* College Database & Whole Setup Control Modal */}
      <DatabaseControlModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        departments={departments}
        hods={hods}
        staffMembers={staffMembers}
        students={students}
        subjects={subjects}
        exams={exams}
        dailyAttendance={dailyAttendance}
      />
    </div>
  );
}

export default App;
