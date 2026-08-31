import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  ClipboardList,
  Search,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  UserCheck,
  Plus,
  UserPlus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Download,
  Filter,
  X,
  Eye,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  AcademicCalendarEvent,
  CurrentUser,
  DailyAttendanceRecord,
  EntryPermissionPolicy,
  ExamSchedule,
  ExamType,
  HODAccount,
  StaffMember,
  Student,
  Subject,
  SubjectAssignment,
} from '../types';
import { saveSubjectInFirestore, deleteSubjectFromFirestore, saveStaffInFirestore, saveStudentInFirestore } from '../lib/firestoreService';
import { checkMarksEntryPermission } from '../utils/permissionUtils';
import { AdminMarksModal } from './AdminMarksModal';
import { AttendanceDownloadModal } from './AttendanceDownloadModal';
import { AddStudentModal } from './AddStudentModal';
import { AddFacultyModal } from './AddFacultyModal';

interface HodPortalProps {
  currentUser: CurrentUser;
  hods: HODAccount[];
  staffMembers: StaffMember[];
  onUpdateStaff: (updater: (prev: StaffMember[]) => StaffMember[]) => void;
  students: Student[];
  onUpdateStudents: (updater: (prev: Student[]) => Student[]) => void;
  subjects: Subject[];
  onUpdateSubjects: (updater: (prev: Subject[]) => Subject[]) => void;
  subjectAssignments: SubjectAssignment[];
  onUpdateAssignments: (updater: (prev: SubjectAssignment[]) => SubjectAssignment[]) => void;
  dailyAttendance: DailyAttendanceRecord[];
  exams: ExamSchedule[];
  academicEvents: AcademicCalendarEvent[];
  entryPolicy?: EntryPermissionPolicy;
  onLogout: () => void;
}

export const HodPortal: React.FC<HodPortalProps> = ({
  currentUser,
  hods,
  staffMembers,
  onUpdateStaff,
  students,
  onUpdateStudents,
  subjects,
  onUpdateSubjects,
  subjectAssignments,
  onUpdateAssignments,
  dailyAttendance,
  exams,
  academicEvents,
  entryPolicy,
  onLogout,
}) => {
  // Find logged in HOD
  const hod =
    hods.find((h) => h.hodId === currentUser.id) ||
    currentUser.hodData || {
      hodId: currentUser.id,
      name: currentUser.name,
      department: currentUser.department || 'CSE',
      email: 'hod@jayasakthi.edu.in',
      password: '',
    };

  const [activeTab, setActiveTab] = useState<'faculty' | 'students' | 'marks' | 'attendance' | 'subjects' | 'profile'>('faculty');

  // Student filtering in HOD department
  const [studentSemesterFilter, setStudentSemesterFilter] = useState<number>(0);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState<Student | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [editingCCStaff, setEditingCCStaff] = useState<StaffMember | null>(null);
  const [ccFormSemester, setCcFormSemester] = useState<number>(6);
  const [ccFormBatch, setCcFormBatch] = useState<string>('2023-2027');

  // Filter department datasets
  const deptFaculty = useMemo(() => {
    return staffMembers.filter((s) => s.department === hod.department);
  }, [staffMembers, hod.department]);

  const deptStudents = useMemo(() => {
    return students.filter((st) => st.department === hod.department);
  }, [students, hod.department]);

  // Filter Department Subjects by Semester
  const [subjectSemFilter, setSubjectSemFilter] = useState<number>(1);

  const deptSubjects = useMemo(() => {
    return subjects.filter((s) => s.department === hod.department);
  }, [subjects, hod.department]);

  const filteredDeptSubjects = useMemo(() => {
    return deptSubjects.filter((s) => {
      return Number(s.semester) === Number(subjectSemFilter);
    });
  }, [deptSubjects, subjectSemFilter]);

  const deptAttendanceRecords = useMemo(() => {
    return dailyAttendance.filter((r) => r.department === hod.department);
  }, [dailyAttendance, hod.department]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return deptStudents.filter((st) => {
      const matchSem = studentSemesterFilter === 0 || st.currentSemester === studentSemesterFilter;
      const matchSearch =
        st.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        st.registerNumber.includes(studentSearchTerm);
      return matchSem && matchSearch;
    });
  }, [deptStudents, studentSemesterFilter, studentSearchTerm]);

  // Dept Average Attendance
  const avgAttendance = useMemo(() => {
    if (deptStudents.length === 0) return 90;
    const sum = deptStudents.reduce((acc, st) => acc + (st.attendance?.percentage || 90), 0);
    return Number((sum / deptStudents.length).toFixed(1));
  }, [deptStudents]);

  // Subject assignment handler for HOD
  const handleAssignSubject = (subjectCode: string, staffId: string) => {
    onUpdateAssignments((prev) => {
      const filtered = prev.filter((a) => a.subjectCode !== subjectCode);
      if (!staffId) return filtered;
      const newAssignment: SubjectAssignment = {
        id: `ASGN-${subjectCode}-${staffId}`,
        subjectCode,
        staffId,
        department: hod.department,
      };
      return [...filtered, newAssignment];
    });
  };

  // Add/Delete Subject State
  const [showAddSubjModal, setShowAddSubjModal] = useState(false);
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjSem, setNewSubjSem] = useState<number>(1);
  const [newSubjCredits, setNewSubjCredits] = useState<number>(3);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjCode.trim() || !newSubjName.trim()) return;
    const newSubject: Subject = {
      code: newSubjCode.trim().toUpperCase(),
      name: newSubjName.trim(),
      department: hod.department,
      semester: newSubjSem,
      credits: newSubjCredits,
      maxMarks: 100,
    };
    try {
      await saveSubjectInFirestore(newSubject);
      onUpdateSubjects((prev) => [...prev.filter((s) => s.code !== newSubject.code), newSubject]);
      setNewSubjCode('');
      setNewSubjName('');
      setShowAddSubjModal(false);
    } catch (err: any) {
      console.error('Error creating subject:', err);
    }
  };

  const handleDeleteSubject = async (code: string) => {
    try {
      await deleteSubjectFromFirestore(code);
      onUpdateSubjects((prev) => prev.filter((s) => s.code !== code));
    } catch (err: any) {
      console.error('Error deleting subject:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ========================================================================= */}
      {/* HOD HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0B2238] via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div>
              {hod.photoUrl ? (
                <img
                  src={hod.photoUrl}
                  alt={hod.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
                  {hod.name.charAt(0)}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  HEAD OF THE DEPARTMENT (HOD)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/30 text-blue-200 uppercase tracking-wider border border-blue-400/30">
                  DEPT: {hod.department}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {hod.name}
              </h1>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Head & Academic Incharge &bull; Department of {hod.department} &bull; ID: {hod.hodId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10 text-right">
              <div className="text-[10px] uppercase font-bold text-amber-300">Dept Faculty</div>
              <div className="text-base font-black text-white">{deptFaculty.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10 text-right">
              <div className="text-[10px] uppercase font-bold text-amber-300">Enrolled Students</div>
              <div className="text-base font-black text-white">{deptStudents.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10 text-right">
              <div className="text-[10px] uppercase font-bold text-amber-300">Avg Attendance</div>
              <div className="text-base font-black text-emerald-400">{avgAttendance}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB NAVIGATION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'faculty', label: 'Department Faculty', icon: Users, badge: `${deptFaculty.length}` },
          { id: 'students', label: 'Students Directory', icon: GraduationCap, badge: `${deptStudents.length}` },
          { id: 'marks', label: 'Internal Marks Moderation', icon: Award },
          { id: 'attendance', label: 'Daily Attendance Audit', icon: ClipboardList, badge: `${deptAttendanceRecords.length}` },
          { id: 'subjects', label: 'Curriculum & Allocation', icon: BookOpen, badge: `${deptSubjects.length}` },
          { id: 'profile', label: 'HOD Profile', icon: UserCheck },
        ].map((tab) => {
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
      {/* TAB 1: FACULTY DIRECTORY & SUBJECT ALLOCATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Department Faculty Members & Subject Allocations</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff allocations, class counselor designations, and teaching workloads for {hod.department}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowAddFacultyModal(true)}
                className="px-3.5 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Add Faculty</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('subjects')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Allocate Subjects</span>
              </button>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200">
                {deptFaculty.length} Faculty Members
              </span>
            </div>
          </div>

          {deptFaculty.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-3">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Faculty Registered Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No faculty members are currently listed under {hod.department}. Click below to add teaching staff and class counselors.
              </p>
              <button
                type="button"
                onClick={() => setShowAddFacultyModal(true)}
                className="mt-2 px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>+ Add First Faculty Member</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deptFaculty.map((staff) => {
                const handledSubjects = subjectAssignments
                  .filter((a) => a.staffId === staff.staffId)
                  .map((a) => a.subjectCode);

                const assignedSubjectObjects = subjects.filter((s) => handledSubjects.includes(s.code));

                return (
                  <div
                    key={staff.staffId}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center font-bold text-sm shadow shrink-0">
                          {staff.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{staff.name}</h3>
                          <p className="text-xs text-slate-500">{staff.designation}</p>
                          <span className="text-[10px] font-mono text-slate-400">{staff.staffId}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Counselor Role:</span>
                          {staff.isCC ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              CC (Sem {staff.ccSemester || 6})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Subject Staff
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Email:</span>
                          <span className="font-mono text-slate-800 truncate max-w-[160px]">{staff.email}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Phone:</span>
                          <span className="font-mono text-slate-800">{staff.phone || '+91 94441 55667'}</span>
                        </div>
                      </div>

                      {/* ASSIGNED SUBJECTS BADGES */}
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-700 uppercase">Assigned Subjects</span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                            {handledSubjects.length}
                          </span>
                        </div>
                        {assignedSubjectObjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedSubjectObjects.map((sub) => (
                              <span
                                key={sub.code}
                                className="text-[10px] font-bold bg-white text-indigo-900 px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs"
                                title={sub.name}
                              >
                                [{sub.code}] Sem {sub.semester}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 italic flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> No subjects allocated
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-2 border-t border-slate-200/80 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCCStaff(staff);
                            setCcFormSemester(staff.ccSemester || 6);
                            setCcFormBatch(staff.ccBatch || '2023-2027');
                          }}
                          className={`py-1.5 font-bold text-xs rounded-xl transition cursor-pointer text-center ${
                            staff.isCC
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {staff.isCC ? 'Edit CC Assignment' : 'Assign as CC'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('subjects')}
                          className="py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition cursor-pointer text-center"
                        >
                          Subjects &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDENTS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span>Department Students Directory</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enrolled students in {hod.department} with attendance & exam standing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200">
                {filteredStudents.length} Students
              </span>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(true)}
                className="px-3.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>+ Add Student</span>
              </button>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Filter by Semester</label>
              <select
                value={studentSemesterFilter}
                onChange={(e) => setStudentSemesterFilter(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value={0}>All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s} (Year {Math.ceil(s / 2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Search Student</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  placeholder="Search by Register Number or Name..."
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
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Recorded Exams</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st, idx) => {
                  const attPct = st.attendance?.percentage || 90;
                  return (
                    <tr key={st.registerNumber} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{st.registerNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{st.name}</td>
                      <td className="py-3 px-4 font-mono">Sem {st.currentSemester}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            attPct < 75
                              ? 'bg-rose-100 text-rose-800'
                              : attPct < 85
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {attPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {st.examRecords?.length || 0} Exams
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(() => {
                          const canEditMarks = checkMarksEntryPermission(
                            entryPolicy,
                            'CAT-1',
                            hod.department,
                            st.currentSemester,
                            'ALL'
                          ).isAllowed;

                          return (
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForMarks(st)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                canEditMarks
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              }`}
                              title={
                                canEditMarks
                                  ? 'Exam Cell permission active: Click to view and edit student marks'
                                  : 'Default view-only mode: Click to view student marks (editing locked)'
                              }
                            >
                              {canEditMarks ? (
                                <>
                                  <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>View / Edit Marks</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>View Marks</span>
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INTERNAL MARKS MODERATION */}
      {/* ========================================================================= */}
      {activeTab === 'marks' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Internal Assessment Moderation & Marks Audit</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review published IAT-1, IAT-2, and Model exam marks across {hod.department} courses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deptSubjects.map((sub) => {
              const studentsInSem = deptStudents.filter((s) => s.currentSemester === sub.semester);
              const scoredCount = studentsInSem.filter((s) =>
                s.examRecords?.some((r) => r.marks?.some((m) => m.subjectCode === sub.code))
              ).length;

              return (
                <div
                  key={sub.code}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        SEM {sub.semester} &bull; {sub.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{sub.name}</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                      {scoredCount} / {studentsInSem.length} Scored
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: `${studentsInSem.length > 0 ? (scoredCount / studentsInSem.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DAILY ATTENDANCE AUDIT */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <span>Department Daily Class Attendance Logs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time records submitted by class counselors and course faculty.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Download Attendance Report</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Faculty Incharge</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-center">OD / Leave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptAttendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                      No daily attendance logs submitted yet for {hod.department}.
                    </td>
                  </tr>
                ) : (
                  deptAttendanceRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{rec.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                          {rec.session}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">Sem {rec.semester}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{rec.markedByStaffName || rec.markedByStaffId}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">{rec.presentCount}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-700">{rec.absentCount}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600">
                        {(rec.odCount || 0) + (rec.leaveCount || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CURRICULUM & SUBJECT ALLOCATION */}
      {/* ========================================================================= */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Department Curriculum & Faculty Allocation</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage {hod.department} department subjects and assign them to faculty members.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200">
                {deptSubjects.length} Courses
              </span>
              <button
                type="button"
                onClick={() => setShowAddSubjModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Subject</span>
              </button>
            </div>
          </div>

          {/* ALLOCATION STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">Total Department Courses</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{deptSubjects.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-slate-400 opacity-60" />
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800">Faculty Allocated</span>
                <p className="text-xl font-bold text-emerald-950 mt-0.5">
                  {
                    deptSubjects.filter((sub) =>
                      subjectAssignments.some((a) => a.subjectCode === sub.code && a.staffId)
                    ).length
                  }
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-800">Unallocated Courses</span>
                <p className="text-xl font-bold text-amber-950 mt-0.5">
                  {
                    deptSubjects.filter(
                      (sub) => !subjectAssignments.some((a) => a.subjectCode === sub.code && a.staffId)
                    ).length
                  }
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-500 opacity-80" />
            </div>
          </div>

          {/* SEMESTER FILTER LIST */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Select Semester:
              </span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Semester {subjectSemFilter} ({filteredDeptSubjects.length} Courses)
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
                const semCount = deptSubjects.filter((sub) => Number(sub.semester) === s).length;
                const isSelected = subjectSemFilter === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubjectSemFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Semester {s}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {semCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredDeptSubjects.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-300 rounded-3xl bg-slate-50/50 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">
                No subjects in {hod.department} for Semester {subjectSemFilter}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add courses for Semester {subjectSemFilter} using the button below.
              </p>
              <button
                type="button"
                onClick={() => {
                  setNewSubjSem(subjectSemFilter);
                  setShowAddSubjModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject for Sem {subjectSemFilter}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Course Code</th>
                    <th className="py-3 px-4">Course Title</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4">Max Marks</th>
                    <th className="py-3 px-4 min-w-[220px]">Allocated Faculty Member</th>
                    <th className="py-3 px-4 text-center">Allocation Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeptSubjects.map((sub) => {
                    const assignment = subjectAssignments.find((a) => a.subjectCode === sub.code);
                    const assignedStaffId = assignment ? assignment.staffId : '';
                    const assignedStaff = deptFaculty.find((f) => f.staffId === assignedStaffId);

                    return (
                      <tr key={sub.code} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-900">{sub.code}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{sub.name}</td>
                        <td className="py-3 px-4 font-mono">Sem {sub.semester}</td>
                        <td className="py-3 px-4 font-mono">{sub.maxMarks || 100} M</td>
                        <td className="py-3 px-4">
                          <select
                            value={assignedStaffId}
                            onChange={(e) => handleAssignSubject(sub.code, e.target.value)}
                            className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              assignedStaffId
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 focus:ring-2 focus:ring-emerald-500'
                                : 'bg-amber-50 border-amber-300 text-amber-950 focus:ring-2 focus:ring-amber-500'
                            }`}
                          >
                            <option value="">-- Select Faculty / Unassigned --</option>
                            {deptFaculty.map((f) => (
                              <option key={f.staffId} value={f.staffId}>
                                {f.name} ({f.designation})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {assignedStaff ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Assigned to {assignedStaff.name.split(' ')[0]}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                              Unallocated
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(sub.code)}
                            title="Delete subject"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD SUBJECT MODAL FOR HOD */}
      {showAddSubjModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Add Course to {hod.department} Curriculum</h4>
              </div>
              <button
                onClick={() => setShowAddSubjModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS8691"
                  value={newSubjCode}
                  onChange={(e) => setNewSubjCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Semester</label>
                <select
                  value={newSubjSem}
                  onChange={(e) => setNewSubjSem(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSubjModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSubjCode.trim() || !newSubjName.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: HOD PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="text-center pb-4 border-b border-slate-100">
            <div className="w-20 h-20 rounded-full mx-auto overflow-hidden border-4 border-amber-400 shadow-md mb-3 flex items-center justify-center bg-slate-900 text-white font-black text-2xl">
              {hod.photoUrl ? (
                <img src={hod.photoUrl} alt={hod.name} className="w-full h-full object-cover" />
              ) : (
                hod.name.charAt(0)
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{hod.name}</h2>
            <p className="text-xs text-slate-500 font-mono">{hod.hodId} &bull; Head of {hod.department}</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-bold text-slate-900">{hod.department}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Email Address</span>
              <span className="font-bold text-slate-900 font-mono">{hod.email}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Contact Phone</span>
              <span className="font-bold text-slate-900 font-mono">{hod.phone || '+91 98401 23456'}</span>
            </div>
          </div>
        </div>
      )}

      {/* MARKS MODAL */}
      {selectedStudentForMarks && (
        <AdminMarksModal
          isOpen={!!selectedStudentForMarks}
          onClose={() => setSelectedStudentForMarks(null)}
          student={selectedStudentForMarks}
          subjects={subjects}
          entryPolicy={entryPolicy}
          userRole="hod"
          onSaveStudent={async (updated) => {
            await saveStudentInFirestore(updated).catch((err) => console.error(err));
            onUpdateStudents((prev) =>
              prev.map((s) => (s.registerNumber === updated.registerNumber ? updated : s))
            );
            setSelectedStudentForMarks(null);
          }}
        />
      )}

      {/* ATTENDANCE DOWNLOAD MODAL */}
      <AttendanceDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        department={hod.department}
        initialSemester={studentSemesterFilter || 6}
        students={deptStudents}
        dailyAttendance={deptAttendanceRecords}
      />

      {/* ADD STUDENT MODAL */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        defaultDepartment={hod.department}
        defaultSemester={studentSemesterFilter > 0 ? studentSemesterFilter : 1}
        creatorRoleLabel="HOD Portal"
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

      {/* ADD FACULTY MODAL */}
      <AddFacultyModal
        isOpen={showAddFacultyModal}
        onClose={() => setShowAddFacultyModal(false)}
        department={hod.department}
        existingStaff={staffMembers}
        subjects={subjects}
        onAddStaff={(newStaff) => {
          onUpdateStaff((prev) => [
            newStaff,
            ...prev.filter((s) => s.staffId !== newStaff.staffId),
          ]);
        }}
        onAddAssignments={(newAssignments) => {
          onUpdateAssignments((prev) => [
            ...newAssignments,
            ...prev.filter(
              (a) =>
                !newAssignments.some(
                  (na) => na.staffId === a.staffId && na.subjectCode === a.subjectCode
                )
            ),
          ]);
        }}
      />

      {/* CLASS COUNSELOR (CC) ASSIGNMENT MODAL */}
      {editingCCStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center shadow">
                  {editingCCStaff.name.charAt(0)}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2 py-0.5 rounded-full text-white">
                    HOD Counselor Designation
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{editingCCStaff.name}</h3>
                  <p className="text-xs text-indigo-200 font-mono">{editingCCStaff.staffId} &bull; {editingCCStaff.designation}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCCStaff(null)}
                className="p-1 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed">
                Assigning a faculty member as <strong>Class Counselor (CC)</strong> activates the CC portal view and authorizes daily attendance entry and mentorship tracking for their designated batch.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Assigned Semester
                </label>
                <select
                  value={ccFormSemester}
                  onChange={(e) => setCcFormSemester(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s} (Year {Math.ceil(s / 2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Assigned Batch
                </label>
                <input
                  type="text"
                  value={ccFormBatch}
                  onChange={(e) => setCcFormBatch(e.target.value)}
                  placeholder="e.g. 2023-2027"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...editingCCStaff,
                      isCC: true,
                      ccSemester: ccFormSemester,
                      ccBatch: ccFormBatch,
                    };
                    saveStaffInFirestore(updated).catch(console.error);
                    onUpdateStaff((prev) =>
                      prev.map((s) => (s.staffId === editingCCStaff.staffId ? updated : s))
                    );
                    setEditingCCStaff(null);
                  }}
                  className="flex-1 py-2.5 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save as Class Counselor (CC)
                </button>

                {editingCCStaff.isCC && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...editingCCStaff,
                        isCC: false,
                        ccSemester: undefined,
                      };
                      saveStaffInFirestore(updated).catch(console.error);
                      onUpdateStaff((prev) =>
                        prev.map((s) => (s.staffId === editingCCStaff.staffId ? updated : s))
                      );
                      setEditingCCStaff(null);
                    }}
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Remove CC Role
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
