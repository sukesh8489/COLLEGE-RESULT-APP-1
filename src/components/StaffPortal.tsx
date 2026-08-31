import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  BookOpen,
  ClipboardList,
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  UserCheck,
  GraduationCap,
  Sparkles,
  BarChart3,
  Layers,
  Check,
  X,
  Plus,
  UserPlus,
  FileSpreadsheet,
  Download,
  Filter,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Info,
  Eye,
  Phone,
  Mail,
  FileText,
  ChevronRight,
} from 'lucide-react';
import {
  AcademicCalendarEvent,
  CurrentUser,
  DailyAttendanceRecord,
  EntryPermissionPolicy,
  ExamSchedule,
  ExamType,
  StaffMember,
  Student,
  Subject,
  SubjectAssignment,
  SubjectMark,
} from '../types';
import { AttendanceDownloadModal } from './AttendanceDownloadModal';
import { AddStudentModal } from './AddStudentModal';
import { checkMarksEntryPermission } from '../utils/permissionUtils';
import { saveMultipleStudentsInFirestore, saveStudentInFirestore } from '../lib/firestoreService';

interface StaffPortalProps {
  currentUser: CurrentUser;
  staffMembers: StaffMember[];
  students: Student[];
  onUpdateStudents: (updater: (prev: Student[]) => Student[]) => void;
  subjects: Subject[];
  subjectAssignments: SubjectAssignment[];
  exams: ExamSchedule[];
  dailyAttendance: DailyAttendanceRecord[];
  onSaveDailyAttendance: (record: DailyAttendanceRecord) => void;
  academicEvents: AcademicCalendarEvent[];
  entryPolicy?: EntryPermissionPolicy;
  onLogout: () => void;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({
  currentUser,
  staffMembers,
  students,
  onUpdateStudents,
  subjects,
  subjectAssignments,
  exams,
  dailyAttendance,
  onSaveDailyAttendance,
  academicEvents,
  entryPolicy,
  onLogout,
}) => {
  // Find logged in staff info
  const staff =
    staffMembers.find((s) => s.staffId === currentUser.id) ||
    currentUser.staffData || {
      staffId: currentUser.id,
      name: currentUser.name,
      department: currentUser.department || 'CSE',
      email: 'staff@jayasakthi.edu.in',
      designation: 'Faculty Member',
      password: '',
    };

  const [activeTab, setActiveTab] = useState<'attendance' | 'students' | 'counselor' | 'subjects' | 'profile'>(
    staff.isCC ? 'attendance' : 'subjects'
  );

  // Sync activeTab if CC assignment status changes
  useEffect(() => {
    if (!staff.isCC) {
      if (activeTab === 'attendance' || activeTab === 'counselor' || activeTab === 'students') {
        setActiveTab('subjects');
      }
    }
  }, [staff.isCC, activeTab]);

  // --- CC VIEW FILTER STATE ---
  const [ccAttFilter, setCcAttFilter] = useState<'ALL' | 'GOOD' | 'DEFICIT'>('ALL');
  const [ccSearchTerm, setCcSearchTerm] = useState<string>('');
  const [selectedMenteeForView, setSelectedMenteeForView] = useState<Student | null>(null);

  // --- STUDENT REGISTRATION & DIRECTORY STATE ---
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studFilterSem, setStudFilterSem] = useState<number>(staff.ccSemester || 0);
  const [studFilterSearch, setStudFilterSearch] = useState<string>('');

  // --- ATTENDANCE STATE ---
  const [attDate, setAttDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attSession, setAttSession] = useState<'FN' | 'AN'>('FN');
  const [attSemester, setAttSemester] = useState<number>(staff.ccSemester || 6);
  const [attStatusMap, setAttStatusMap] = useState<{ [regNo: string]: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'ON_DUTY' }>({});
  const [attSaveSuccess, setAttSaveSuccess] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Department subjects & assigned subjects strictly assigned by HOD
  const assignedSubjectCodes = useMemo(() => {
    return subjectAssignments
      .filter((a) => a.staffId === staff.staffId)
      .map((a) => a.subjectCode);
  }, [subjectAssignments, staff.staffId]);

  const assignedSubjects = useMemo(() => {
    return subjects.filter((s) => assignedSubjectCodes.includes(s.code));
  }, [subjects, assignedSubjectCodes]);

  // Filter students in staff department & relevant semester
  const deptStudents = useMemo(() => {
    return students.filter((st) => st.department === staff.department);
  }, [students, staff.department]);

  const filteredDeptStudents = useMemo(() => {
    return deptStudents.filter((st) => {
      const matchesSem = studFilterSem === 0 || st.currentSemester === studFilterSem;
      const matchesSearch =
        st.name.toLowerCase().includes(studFilterSearch.toLowerCase()) ||
        st.registerNumber.toLowerCase().includes(studFilterSearch.toLowerCase());
      return matchesSem && matchesSearch;
    });
  }, [deptStudents, studFilterSem, studFilterSearch]);

  const semStudents = useMemo(() => {
    return deptStudents.filter((st) => st.currentSemester === attSemester);
  }, [deptStudents, attSemester]);

  // Counselor Batch Students
  const counselorStudents = useMemo(() => {
    if (!staff.isCC) return [];
    return deptStudents.filter((st) => st.currentSemester === staff.ccSemester || st.year === staff.ccYear);
  }, [deptStudents, staff.isCC, staff.ccSemester, staff.ccYear]);

  // Class Counselor's corresponding class students filtered by search
  const filteredCcClassStudents = useMemo(() => {
    return counselorStudents.filter((st) => {
      const q = studFilterSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        st.name.toLowerCase().includes(q) ||
        st.registerNumber.toLowerCase().includes(q)
      );
    });
  }, [counselorStudents, studFilterSearch]);

  // --- MARKS ENTRY STATE (INSIDE MY SUBJECTS) ---
  const [selectedMarksSubject, setSelectedMarksSubject] = useState<Subject | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('CAT-1');
  const [marksBatchMap, setMarksBatchMap] = useState<{ [regNo: string]: { marksObtained: number; maxMarks: number; status: 'PASS' | 'FAIL' | 'ABSENT' } }>({});
  const [marksSaveSuccess, setMarksSaveSuccess] = useState(false);
  const [marksSearchTerm, setMarksSearchTerm] = useState('');

  // Students for the active marks subject
  const marksStudents = useMemo(() => {
    if (!selectedMarksSubject) return [];
    return deptStudents.filter((st) => st.currentSemester === selectedMarksSubject.semester);
  }, [deptStudents, selectedMarksSubject]);

  // Permission check for current subject & exam type
  const marksPermission = useMemo(() => {
    if (!selectedMarksSubject) {
      return {
        isAllowed: false,
        status: 'LOCKED' as const,
        reason: 'Please select an assigned subject first.',
        allowedDurationLabel: 'Permission Required',
      };
    }
    return checkMarksEntryPermission(
      entryPolicy,
      selectedExamType,
      staff.department,
      selectedMarksSubject.semester,
      selectedMarksSubject.code,
      staff.staffId
    );
  }, [entryPolicy, selectedExamType, staff.department, selectedMarksSubject, staff.staffId]);

  // Helper for Anna University Grade Calculation
  const calculateGrade = (obtained: number, max: number = 100): string => {
    const pct = (obtained / max) * 100;
    if (pct >= 90) return 'O';
    if (pct >= 80) return 'A+';
    if (pct >= 70) return 'A';
    if (pct >= 60) return 'B+';
    if (pct >= 50) return 'B';
    return 'RA';
  };

  // Load existing marks into marksBatchMap when selected subject or examType changes
  React.useEffect(() => {
    if (!selectedMarksSubject) return;
    const newMap: { [regNo: string]: { marksObtained: number; maxMarks: number; status: 'PASS' | 'FAIL' | 'ABSENT' } } = {};
    const isCat = selectedExamType.startsWith('CAT');
    const defaultMax = isCat ? 50 : (selectedMarksSubject.maxMarks || 100);

    marksStudents.forEach((st) => {
      const rec = st.examRecords?.find((r) => r.examType === selectedExamType && r.semester === selectedMarksSubject.semester);
      const subMark = rec?.marks?.find((m) => m.subjectCode === selectedMarksSubject.code);

      if (subMark) {
        newMap[st.registerNumber] = {
          marksObtained: subMark.marksObtained,
          maxMarks: isCat ? 50 : (subMark.maxMarks || defaultMax),
          status: subMark.status,
        };
      } else {
        newMap[st.registerNumber] = {
          marksObtained: 0,
          maxMarks: defaultMax,
          status: 'PASS',
        };
      }
    });

    setMarksBatchMap(newMap);
    setMarksSaveSuccess(false);
  }, [selectedMarksSubject, selectedExamType, marksStudents]);

  // Save Marks Batch for Selected Subject
  const handleSaveMarksBatch = () => {
    if (!selectedMarksSubject || !assignedSubjectCodes.includes(selectedMarksSubject.code)) {
      alert('Unauthorized: You are only permitted to enter and publish marks for subjects allocated to you by your HOD.');
      return;
    }

    if (!marksPermission.isAllowed) {
      alert(`Marks Entry Locked: ${marksPermission.reason}\n\nPlease contact the Exam Cell Admin to grant entry permission.`);
      return;
    }

    const updatedStudentsList: Student[] = [];

    onUpdateStudents((prev) => {
      const nextStudents = prev.map((st) => {
        if (st.department === staff.department && st.currentSemester === selectedMarksSubject.semester) {
          const inputData = marksBatchMap[st.registerNumber] || {
            marksObtained: 0,
            maxMarks: selectedMarksSubject.maxMarks || 100,
            status: 'PASS',
          };

          const grade = calculateGrade(inputData.marksObtained, inputData.maxMarks);
          const subjectMark: SubjectMark = {
            subjectCode: selectedMarksSubject.code,
            subjectName: selectedMarksSubject.name,
            maxMarks: inputData.maxMarks,
            marksObtained: inputData.marksObtained,
            grade,
            status: inputData.status,
          };

          const existingRecords = st.examRecords ? [...st.examRecords] : [];
          const recordIdx = existingRecords.findIndex(
            (r) => r.examType === selectedExamType && r.semester === selectedMarksSubject.semester
          );

          if (recordIdx >= 0) {
            const currentRec = existingRecords[recordIdx];
            const updatedMarks = [...currentRec.marks];
            const markIdx = updatedMarks.findIndex((m) => m.subjectCode === selectedMarksSubject.code);

            if (markIdx >= 0) {
              updatedMarks[markIdx] = subjectMark;
            } else {
              updatedMarks.push(subjectMark);
            }

            const totalObt = updatedMarks.reduce((acc, m) => acc + (m.status !== 'ABSENT' ? m.marksObtained : 0), 0);
            const maxTot = updatedMarks.reduce((acc, m) => acc + m.maxMarks, 0);
            const pct = maxTot > 0 ? Number(((totalObt / maxTot) * 100).toFixed(2)) : 0;
            const hasFail = updatedMarks.some((m) => m.status === 'FAIL' || m.status === 'ABSENT');

            existingRecords[recordIdx] = {
              ...currentRec,
              marks: updatedMarks,
              totalObtained: totalObt,
              maxTotal: maxTot,
              percentage: pct,
              overallStatus: hasFail ? 'FAIL' : 'PASS',
              enteredByStaffId: staff.staffId,
              datePublished: new Date().toISOString().split('T')[0],
            };
          } else {
            const totalObt = inputData.status !== 'ABSENT' ? inputData.marksObtained : 0;
            const maxTot = inputData.maxMarks;
            const pct = Number(((totalObt / maxTot) * 100).toFixed(2));

            existingRecords.push({
              id: `${st.registerNumber}-SEM${selectedMarksSubject.semester}-${selectedExamType}`,
              registerNumber: st.registerNumber,
              semester: selectedMarksSubject.semester,
              examType: selectedExamType,
              academicYear: st.batch || '2023-2027',
              marks: [subjectMark],
              totalObtained: totalObt,
              maxTotal: maxTot,
              percentage: pct,
              overallStatus: inputData.status === 'FAIL' || inputData.status === 'ABSENT' ? 'FAIL' : 'PASS',
              enteredByStaffId: staff.staffId,
              datePublished: new Date().toISOString().split('T')[0],
            });
          }

          const updatedSt = {
            ...st,
            examRecords: existingRecords,
          };
          updatedStudentsList.push(updatedSt);
          return updatedSt;
        }
        return st;
      });

      if (updatedStudentsList.length > 0) {
        saveMultipleStudentsInFirestore(updatedStudentsList).catch((err) =>
          console.error('Failed to sync batch marks to Firestore:', err)
        );
      }

      return nextStudents;
    });

    setMarksSaveSuccess(true);
    setTimeout(() => setMarksSaveSuccess(false), 3000);
  };

  // Handle Mark All Present
  const handleMarkAllPresent = () => {
    if (!staff.isCC) {
      alert('Access Restricted: Daily class attendance marking is strictly managed by designated Class Counselors (CC).');
      return;
    }
    const map: { [regNo: string]: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'ON_DUTY' } = {};
    semStudents.forEach((st) => {
      map[st.registerNumber] = 'PRESENT';
    });
    setAttStatusMap(map);
  };

  // Handle Save Attendance
  const handleSaveAttendance = () => {
    if (!staff.isCC) {
      alert('Access Restricted: Daily class attendance saving is strictly managed by designated Class Counselors (CC).');
      return;
    }
    const recordId = `ATT-${staff.department}-SEM${attSemester}-${attDate}-${attSession}`;
    const presentCount = Object.values(attStatusMap).filter((s) => s === 'PRESENT').length;
    const absentCount = Object.values(attStatusMap).filter((s) => s === 'ABSENT').length;
    const odCount = Object.values(attStatusMap).filter((s) => s === 'ON_DUTY').length;
    const leaveCount = Object.values(attStatusMap).filter((s) => s === 'LEAVE').length;

    const studentStatuses = semStudents.map((st) => ({
      registerNumber: st.registerNumber,
      studentName: st.name,
      status: attStatusMap[st.registerNumber] || 'PRESENT',
    }));

    const newRecord: DailyAttendanceRecord = {
      id: recordId,
      date: attDate,
      session: attSession,
      department: staff.department,
      semester: attSemester,
      markedByStaffId: staff.staffId,
      markedByStaffName: staff.name,
      totalStudents: semStudents.length,
      presentCount,
      absentCount,
      odCount,
      leaveCount,
      records: studentStatuses,
      createdAt: new Date().toISOString(),
    };

    onSaveDailyAttendance(newRecord);

    // Update cumulative student attendance
    onUpdateStudents((prev) =>
      prev.map((st) => {
        if (st.department === staff.department && st.currentSemester === attSemester) {
          const currentAtt = st.attendance || { totalClasses: 180, attendedClasses: 160, percentage: 88.8 };
          const status = attStatusMap[st.registerNumber] || 'PRESENT';
          const isAttended = status === 'PRESENT' || status === 'ON_DUTY';

          const newTotal = currentAtt.totalClasses + 1;
          const newAttended = currentAtt.attendedClasses + (isAttended ? 1 : 0);
          const newPct = Number(((newAttended / newTotal) * 100).toFixed(1));

          return {
            ...st,
            attendance: {
              totalClasses: newTotal,
              attendedClasses: newAttended,
              percentage: newPct,
              semester: attSemester,
              lastUpdated: attDate,
            },
          };
        }
        return st;
      })
    );

    setAttSaveSuccess(true);
    setTimeout(() => setAttSaveSuccess(false), 3000);
  };

  // Good Attendance (>= 95%), Deficit (< 75%)
  const goodAttWards = useMemo(() => {
    return counselorStudents.filter((st) => (st.attendance?.percentage ?? 90) >= 95);
  }, [counselorStudents]);

  const deficitAttWards = useMemo(() => {
    return counselorStudents.filter((st) => (st.attendance?.percentage ?? 90) < 75);
  }, [counselorStudents]);

  // Filtered wards based on selected percentage category & search
  const filteredCounselorStudents = useMemo(() => {
    return counselorStudents.filter((st) => {
      const pct = st.attendance?.percentage ?? 90;
      let matchesAtt = true;
      if (ccAttFilter === 'GOOD') matchesAtt = pct >= 95;
      else if (ccAttFilter === 'DEFICIT') matchesAtt = pct < 75;

      const matchesSearch =
        st.name.toLowerCase().includes(ccSearchTerm.toLowerCase()) ||
        st.registerNumber.toLowerCase().includes(ccSearchTerm.toLowerCase());

      return matchesAtt && matchesSearch;
    });
  }, [counselorStudents, ccAttFilter, ccSearchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ========================================================================= */}
      {/* HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0B2238] via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div>
              {staff.photoUrl ? (
                <img
                  src={staff.photoUrl}
                  alt={staff.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
                  {staff.name.charAt(0)}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  FACULTY PORTAL
                </span>
                {staff.isCC && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/30 text-blue-200 uppercase tracking-wider border border-blue-400/30">
                    CLASS COUNSELOR (SEM {staff.ccSemester || 6})
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {staff.name}
              </h1>
              <p className="text-xs text-blue-200/80 mt-0.5">
                {staff.designation} &bull; Department of {staff.department} &bull; ID: {staff.staffId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white/10 text-right">
              <div className="text-[10px] uppercase font-bold text-amber-300">Department</div>
              <div className="text-sm font-black text-white">{staff.department}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white/10 text-right">
              <div className="text-[10px] uppercase font-bold text-amber-300">Assigned Courses</div>
              <div className="text-sm font-black text-white">{assignedSubjects.length} Subjects</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB NAVIGATION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        {(staff.isCC
          ? [
              { id: 'attendance', label: 'Daily Attendance', icon: ClipboardList, badge: `${semStudents.length} Students` },
              { id: 'subjects', label: 'Assigned Subjects & Marks', icon: BookOpen, badge: `${assignedSubjects.length}` },
              { id: 'students', label: 'Students Directory', icon: GraduationCap, badge: `${counselorStudents.length} Students` },
              { id: 'counselor', label: 'Class Counselor (CC) View', icon: Users, badge: `${counselorStudents.length} Wards` },
              { id: 'profile', label: 'Faculty Profile', icon: UserCheck },
            ]
          : [
              { id: 'subjects', label: 'My Subjects & Syllabus', icon: BookOpen, badge: `${assignedSubjects.length}` },
              { id: 'profile', label: 'Faculty Profile', icon: UserCheck },
            ]
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ATTENDANCE MARKING */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          {!staff.isCC && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs font-semibold">
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                Daily Attendance Entry & Editing is restricted to appointed Class Counselors (CC). As subject faculty, you have read-only access.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <span>Daily Class Attendance Marking</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mark student attendance session-wise (Forenoon / Afternoon) for department classes.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Report</span>
              </button>

              {staff.isCC && (
                <>
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark All Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    className="px-4 py-2 bg-blue-900 text-white hover:bg-blue-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Attendance</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {attSaveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Attendance saved and synced to student database successfully!</span>
            </div>
          )}

          {/* FILTERS BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Date</label>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Session</label>
              <select
                value={attSession}
                onChange={(e) => setAttSession(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="FN">Forenoon (FN - Period 1 to 4)</option>
                <option value="AN">Afternoon (AN - Period 5 to 7)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Semester / Year</label>
              <select
                value={attSemester}
                onChange={(e) => setAttSemester(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s} (Year {Math.ceil(s / 2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STUDENTS ATTENDANCE TABLE */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Register Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Cumulative Att %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {semStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                      No students found for {staff.department} - Semester {attSemester}.
                    </td>
                  </tr>
                ) : (
                  semStudents.map((st, idx) => {
                    const currentStatus = attStatusMap[st.registerNumber] || 'PRESENT';

                    return (
                      <tr key={st.registerNumber} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{st.registerNumber}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{st.name}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              (st.attendance?.percentage || 90) < 75
                                ? 'bg-rose-100 text-rose-700'
                                : (st.attendance?.percentage || 90) < 95
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {st.attendance?.percentage ? `${st.attendance.percentage}%` : '90%'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {[
                              { key: 'PRESENT', label: 'Present', bg: 'bg-emerald-600 text-white' },
                              { key: 'ABSENT', label: 'Absent', bg: 'bg-rose-600 text-white' },
                              { key: 'ON_DUTY', label: 'OD', bg: 'bg-blue-600 text-white' },
                              { key: 'LEAVE', label: 'Leave', bg: 'bg-amber-600 text-white' },
                            ].map((opt) => {
                              const isSelected = currentStatus === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  disabled={!staff.isCC}
                                  onClick={() => {
                                    if (!staff.isCC) return;
                                    setAttStatusMap((prev) => ({
                                      ...prev,
                                      [st.registerNumber]: opt.key as any,
                                    }));
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                    !staff.isCC ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                                  } ${
                                    isSelected
                                      ? `${opt.bg} shadow-xs`
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDENTS DIRECTORY & ENROLMENT (CC ONLY) */}
      {/* ========================================================================= */}
      {activeTab === 'students' && staff.isCC && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span>Class Students Directory</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  Semester {staff.ccSemester || 6}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Roster of enrolled students in your assigned class ({staff.department} &bull; Semester {staff.ccSemester || 6} &bull; Batch {staff.ccBatch || '2023-2027'}).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200">
                {filteredCcClassStudents.length} Students
              </span>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(true)}
                className="px-3.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>+ Add Student to Class</span>
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2">
              <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-500 font-medium">Assigned Class: </span>
                <strong className="text-slate-900">Semester {staff.ccSemester || 6} ({staff.department})</strong>
                <span className="ml-1.5 text-[11px] font-mono text-slate-500">[{staff.ccBatch || '2023-2027'}]</span>
              </div>
            </div>

            <div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={studFilterSearch}
                  onChange={(e) => setStudFilterSearch(e.target.value)}
                  placeholder="Search class students by Register Number or Name..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* STUDENTS TABLE */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Register Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCcClassStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic text-xs">
                      No students found matching your search in Semester {staff.ccSemester || 6}.
                    </td>
                  </tr>
                ) : (
                  filteredCcClassStudents.map((st, idx) => {
                    const attPct = st.attendance?.percentage || 85;
                    return (
                      <tr key={st.registerNumber} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{st.registerNumber}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{st.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold text-[11px]">
                            Sem {st.currentSemester}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{st.batch || '2023-2027'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              attPct < 75
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {attPct}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                          {st.phone || st.email || 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: CLASS COUNSELOR (CC) VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'counselor' && staff.isCC && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Class Counselor (CC) Mentorship Ward Roster</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring academic standing, arrears, and attendance alerts for Batch {staff.ccBatch || '2023-2027'} (Sem {staff.ccSemester || 6}).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold">
                {counselorStudents.length} Mentees Assigned
              </span>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(true)}
                className="px-3.5 py-1.5 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Add Student / Ward</span>
              </button>
            </div>
          </div>

          {/* 3 INTERACTIVE METRIC CARDS WITH VIEW OPTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CARD 1: TOTAL WARDS */}
            <div
              onClick={() => setCcAttFilter('ALL')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                ccAttFilter === 'ALL'
                  ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-500/50'
                  : 'bg-blue-50/70 text-blue-950 border-blue-100 hover:bg-blue-100/70'
              }`}
            >
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${ccAttFilter === 'ALL' ? 'text-blue-200' : 'text-blue-700'}`}>
                  Total Wards
                </div>
                <div className="text-2xl font-black mt-1">{counselorStudents.length}</div>
                <p className={`text-[11px] mt-1 ${ccAttFilter === 'ALL' ? 'text-blue-200/80' : 'text-slate-500'}`}>
                  All assigned batch mentees
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-between text-xs font-bold">
                <span>View All Wards</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 2: GOOD ATTENDANCE (>= 95%) */}
            <div
              onClick={() => setCcAttFilter('GOOD')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                ccAttFilter === 'GOOD'
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-md ring-2 ring-emerald-400/50'
                  : 'bg-emerald-50/70 text-emerald-950 border-emerald-100 hover:bg-emerald-100/70'
              }`}
            >
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${ccAttFilter === 'GOOD' ? 'text-emerald-200' : 'text-emerald-700'}`}>
                  Good Attendance (≥95%)
                </div>
                <div className="text-2xl font-black mt-1">{goodAttWards.length}</div>
                <p className={`text-[11px] mt-1 ${ccAttFilter === 'GOOD' ? 'text-emerald-200/80' : 'text-slate-500'}`}>
                  Exemplary regular attendance
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-between text-xs font-bold">
                <span>View Students (≥95%)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 3: ATTENDANCE DEFICIT (< 75%) */}
            <div
              onClick={() => setCcAttFilter('DEFICIT')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                ccAttFilter === 'DEFICIT'
                  ? 'bg-rose-800 text-white border-rose-800 shadow-md ring-2 ring-rose-400/50'
                  : 'bg-rose-50/70 text-rose-950 border-rose-100 hover:bg-rose-100/70'
              }`}
            >
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${ccAttFilter === 'DEFICIT' ? 'text-rose-200' : 'text-rose-700'}`}>
                  Deficit Alert (&lt;75%)
                </div>
                <div className="text-2xl font-black mt-1">{deficitAttWards.length}</div>
                <p className={`text-[11px] mt-1 ${ccAttFilter === 'DEFICIT' ? 'text-rose-200/80' : 'text-slate-500'}`}>
                  Below university exam eligibility
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-between text-xs font-bold">
                <span>View Students (&lt;75%)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* ACTIVE FILTER BAR & SEARCH */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Filter View:</span>
              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  ccAttFilter === 'GOOD'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : ccAttFilter === 'DEFICIT'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {ccAttFilter === 'ALL' && `All Wards (${counselorStudents.length})`}
                {ccAttFilter === 'GOOD' && `Good Attendance ≥95% (${goodAttWards.length})`}
                {ccAttFilter === 'DEFICIT' && `Attendance Deficit <75% (${deficitAttWards.length})`}
              </span>

              {ccAttFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setCcAttFilter('ALL')}
                  className="text-xs text-slate-600 hover:text-slate-900 underline font-semibold cursor-pointer ml-1"
                >
                  Show All Wards
                </button>
              )}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ward name or reg no..."
                value={ccSearchTerm}
                onChange={(e) => setCcSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* MENTEES TABLE WITH VIEW OPTION */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Register Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Contact & Parent</th>
                  <th className="py-3 px-4">Attendance Percentage</th>
                  <th className="py-3 px-4">Latest IAT Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCounselorStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic text-xs">
                      No wards found matching the selected filter ({ccAttFilter}) or search keyword.
                    </td>
                  </tr>
                ) : (
                  filteredCounselorStudents.map((st) => {
                    const latestRecord = st.examRecords?.[st.examRecords.length - 1];
                    const attPct = st.attendance?.percentage ?? 90;

                    return (
                      <tr key={st.registerNumber} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{st.registerNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{st.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Roll: {st.rollNumber || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-700 text-[11px]">{st.phone || '+91 98765 43210'}</div>
                          {st.parentContact && (
                            <div className="text-[10px] text-slate-500">Parent: {st.parentContact}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1.5 ${
                              attPct < 75
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : attPct >= 95
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                attPct < 75 ? 'bg-rose-600' : attPct >= 95 ? 'bg-emerald-600' : 'bg-slate-400'
                              }`}
                            />
                            {attPct}% {attPct >= 95 ? '(≥95% Good)' : attPct < 75 ? '(<75% Deficit)' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {latestRecord ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                latestRecord.overallStatus === 'PASS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {latestRecord.examType}: {latestRecord.percentage}% ({latestRecord.overallStatus})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No exams recorded</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedMenteeForView(st)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MENTEE DETAILS MODAL (OPENED VIA "VIEW" OPTION) */}
      {selectedMenteeForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* MODAL HEADER */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shadow">
                  {selectedMenteeForView.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white uppercase">
                      Mentee Profile
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase">
                      Sem {selectedMenteeForView.currentSemester}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedMenteeForView.name}</h3>
                  <p className="text-xs text-indigo-200 font-mono">
                    {selectedMenteeForView.registerNumber} &bull; Dept: {selectedMenteeForView.department} &bull; Batch: {selectedMenteeForView.batch || '2023-2027'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMenteeForView(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* ATTENDANCE SUMMARY CARD */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-600">Attendance Standing</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      (selectedMenteeForView.attendance?.percentage ?? 90) < 75
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : (selectedMenteeForView.attendance?.percentage ?? 90) >= 95
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                    }`}
                  >
                    {selectedMenteeForView.attendance?.percentage ?? 90}% Cumulative Attendance
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                    <div className="text-[10px] text-slate-500 font-medium">Total Classes</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      {selectedMenteeForView.attendance?.totalClasses || 180}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                    <div className="text-[10px] text-slate-500 font-medium">Attended Classes</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      {selectedMenteeForView.attendance?.attendedClasses || 162}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                    <div className="text-[10px] text-slate-500 font-medium">Eligibility Status</div>
                    <div className="text-xs font-black mt-1">
                      {(selectedMenteeForView.attendance?.percentage ?? 90) >= 75 ? (
                        <span className="text-emerald-700">Eligible for Exams</span>
                      ) : (
                        <span className="text-rose-700">Lack of Attendance</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTACT & GUARDIAN INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium block">Student Phone</span>
                  <span className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    {selectedMenteeForView.phone || '+91 98765 43210'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium block">Student Email</span>
                  <span className="font-bold text-slate-900 font-mono flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    {selectedMenteeForView.email || 'student@jayasakthi.edu.in'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium block">Father / Guardian Name</span>
                  <span className="font-bold text-slate-900">
                    {selectedMenteeForView.fatherName || 'Guardian'}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium block">Parent Contact Phone</span>
                  <span className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    {selectedMenteeForView.parentContact || '+91 94440 12345'}
                  </span>
                </div>
              </div>

              {/* INTERNAL ASSESSMENT & EXAMS RECORD */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Internal Assessment Records</span>
                </h4>

                {(!selectedMenteeForView.examRecords || selectedMenteeForView.examRecords.length === 0) ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
                    No examination records published yet for this student.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Exam Type</th>
                          <th className="py-2.5 px-3">Semester</th>
                          <th className="py-2.5 px-3">Total Marks</th>
                          <th className="py-2.5 px-3">Percentage</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedMenteeForView.examRecords.map((rec, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{rec.examType}</td>
                            <td className="py-2.5 px-3 text-slate-600">Sem {rec.semester}</td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                              {rec.totalObtained} / {rec.totalMax}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{rec.percentage}%</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  rec.overallStatus === 'PASS'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {rec.overallStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedMenteeForView(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MY SUBJECTS & SYLLABUS / MARKS ENTRY */}
      {/* ========================================================================= */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          {!selectedMarksSubject ? (
            <>
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Assigned Subjects & Curriculum</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Course syllabus and active teaching allocations assigned to you by your HOD for the current semester. Click <strong>Enter Marks</strong> on any subject to submit CAT and Model assessment scores.
                </p>
              </div>

              {assignedSubjects.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Courses Allocated Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Your Head of Department ({staff.department}) has not yet allocated subjects to your faculty profile.
                    Once course allocations are configured in the HOD portal, your syllabus, student rosters, and marks entry options will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedSubjects.map((sub) => {
                    const studentCount = deptStudents.filter((s) => s.currentSemester === sub.semester).length;
                    return (
                      <div
                        key={sub.code}
                        className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              SEM {sub.semester} &bull; {sub.department}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 mt-1.5">{sub.name}</h3>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">Course Code: {sub.code}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                            Max: {sub.maxMarks || 100} M
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                          <span className="text-[11px] text-slate-500 font-medium">Students Enrolled: <strong className="text-slate-800">{studentCount}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMarksSubject(sub);
                              setSelectedExamType('CAT-1');
                              setMarksSearchTerm('');
                            }}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Enter Marks &rarr;</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {/* HEADER WITH BACK BUTTON & SUBJECT INFO */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedMarksSubject(null)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition mb-1"
                  >
                    &larr; Back to Assigned Subjects
                  </button>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Marks Entry: {selectedMarksSubject.name}</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Course Code: <strong className="font-mono text-slate-700">{selectedMarksSubject.code}</strong> &bull; Semester: <strong>{selectedMarksSubject.semester}</strong> &bull; Dept: <strong>{selectedMarksSubject.department}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMarksSubject(null)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  {marksPermission.isAllowed ? (
                    <button
                      type="button"
                      onClick={handleSaveMarksBatch}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save &amp; Publish Marks</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Marks entry is currently locked by the Exam Cell Admin"
                      className="px-4 py-2 bg-slate-100 border border-slate-300 text-slate-400 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-not-allowed opacity-80"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Locked by Exam Cell</span>
                    </button>
                  )}
                </div>
              </div>

              {marksSaveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Marks for {selectedMarksSubject.name} ({selectedExamType}) have been saved to student records and synced to Firestore!</span>
                </div>
              )}

              {/* PERMISSION STATUS BANNER */}
              {marksPermission.isAllowed ? (
                <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-950">Marks Entry Window Open</span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      </div>
                      <p className="text-emerald-800 text-[11px] mt-0.5">
                        Exam Cell Admin has granted permission for <strong>{selectedMarksSubject.name}</strong> ({selectedExamType}). {marksPermission.timeRemaining ? `Time Remaining: ${marksPermission.timeRemaining}` : 'You can enter and edit student marks.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
                      <Lock className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-950">Marks Entry &amp; Editing Locked (Default Policy)</span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                          Permission Required
                        </span>
                      </div>
                      <p className="text-amber-800 text-[11px] mt-0.5">
                        Faculty cannot enter or modify marks by default. Once the <strong>Exam Cell Admin</strong> grants entry permission, this portal will automatically unlock for mark submission.
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-lg w-fit">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Status: {marksPermission.reason}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Select Examination</label>
                  <select
                    value={selectedExamType}
                    onChange={(e) => setSelectedExamType(e.target.value as ExamType)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="CAT-1">CAT-1 (Continuous Assessment Test 1)</option>
                    <option value="CAT-2">CAT-2 (Continuous Assessment Test 2)</option>
                    <option value="CAT-3">CAT-3 (Continuous Assessment Test 3)</option>
                    <option value="M-1">Model-1 (Model Examination 1)</option>
                    <option value="M-2">Model-2 (Model Examination 2)</option>
                    <option value="M-3">Model-3 (Model Examination 3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Search Student</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={marksSearchTerm}
                      onChange={(e) => setMarksSearchTerm(e.target.value)}
                      placeholder="Filter student by name or reg no..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* MARKS ENTRY TABLE */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Register Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 w-36">
                        <div className="flex items-center gap-1.5">
                          <span>Marks Obtained</span>
                          {!marksPermission.isAllowed && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              <Lock className="w-2.5 h-2.5" /> Read-Only
                            </span>
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 w-24">Max Marks</th>
                      <th className="py-3 px-4 text-center">Grade</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marksStudents
                      .filter(
                        (st) =>
                          st.name.toLowerCase().includes(marksSearchTerm.toLowerCase()) ||
                          st.registerNumber.includes(marksSearchTerm)
                      )
                      .map((st, idx) => {
                        const rowData = marksBatchMap[st.registerNumber] || {
                          marksObtained: 0,
                          maxMarks: selectedExamType.startsWith('CAT') ? 50 : (selectedMarksSubject.maxMarks || 100),
                          status: 'PASS',
                        };
                        const grade = calculateGrade(rowData.marksObtained, rowData.maxMarks);

                        return (
                          <tr key={st.registerNumber} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{st.registerNumber}</td>
                            <td className="py-3 px-4 font-medium text-slate-800">{st.name}</td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min="0"
                                max={rowData.maxMarks}
                                value={rowData.marksObtained}
                                disabled={!marksPermission.isAllowed}
                                onChange={(e) => {
                                  if (!marksPermission.isAllowed) return;
                                  const val = Math.max(0, Math.min(Number(e.target.value) || 0, rowData.maxMarks));
                                  setMarksBatchMap((prev) => ({
                                    ...prev,
                                    [st.registerNumber]: {
                                      ...rowData,
                                      marksObtained: val,
                                      status: val >= rowData.maxMarks * 0.5 ? 'PASS' : 'FAIL',
                                    },
                                  }));
                                }}
                                title={!marksPermission.isAllowed ? 'Marks entry is locked by Exam Cell Admin' : undefined}
                                className={`w-24 px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                                  !marksPermission.isAllowed
                                    ? 'bg-slate-100/90 border border-slate-200 text-slate-600 cursor-not-allowed select-none'
                                    : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none'
                                }`}
                              />
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">{rowData.maxMarks}</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                  grade === 'O' || grade === 'A+'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : grade === 'A' || grade === 'B+'
                                    ? 'bg-blue-100 text-blue-800'
                                    : grade === 'B'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {grade}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  rowData.status === 'PASS'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {rowData.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="text-center pb-4 border-b border-slate-100">
            <div className="w-20 h-20 rounded-full mx-auto overflow-hidden border-4 border-amber-400 shadow-md mb-3 flex items-center justify-center bg-slate-900 text-white font-black text-2xl">
              {staff.photoUrl ? (
                <img src={staff.photoUrl} alt={staff.name} className="w-full h-full object-cover" />
              ) : (
                staff.name.charAt(0)
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{staff.name}</h2>
            <p className="text-xs text-slate-500 font-mono">{staff.staffId} &bull; {staff.designation}</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-bold text-slate-900">{staff.department}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Email Address</span>
              <span className="font-bold text-slate-900 font-mono">{staff.email}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Phone</span>
              <span className="font-bold text-slate-900 font-mono">{staff.phone || '+91 94441 55667'}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Class Counselor Role</span>
              <span className="font-bold text-slate-900">
                {staff.isCC ? `Yes - Sem ${staff.ccSemester || 6}` : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE DOWNLOAD MODAL */}
      <AttendanceDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        department={staff.department}
        initialSemester={attSemester}
        students={students}
        dailyAttendance={dailyAttendance}
        batch={staff.ccBatch || '2023-2027'}
      />

      {/* ADD STUDENT MODAL */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        defaultDepartment={staff.department}
        defaultSemester={staff.ccSemester || attSemester || 6}
        defaultBatch={staff.ccBatch || '2023-2027'}
        lockSemester={staff.isCC}
        lockBatch={false}
        creatorRoleLabel={staff.isCC ? `Class Counselor (Sem ${staff.ccSemester || 6})` : 'Faculty Portal'}
        onAddStudent={(newStudent) => {
          onUpdateStudents((prev) => [
            newStudent,
            ...prev.filter((s) => s.registerNumber !== newStudent.registerNumber),
          ]);
        }}
        onAddMultipleStudents={(newStudents) => {
          const newRegNos = new Set(newStudents.map((s) => s.registerNumber));
          onUpdateStudents((prev) => [
            ...newStudents,
            ...prev.filter((s) => !newRegNos.has(s.registerNumber)),
          ]);
        }}
      />
    </div>
  );
};
