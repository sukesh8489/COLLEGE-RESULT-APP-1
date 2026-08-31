import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  ClipboardList,
  Sparkles,
  PlusCircle,
  FileSpreadsheet,
  Upload,
  Trash2,
} from 'lucide-react';
import {
  DepartmentInfo,
  HODAccount,
  StaffMember,
  Student,
  Subject,
  ExamSchedule,
  DailyAttendanceRecord,
} from '../types';
import {
  initializeWholeCollegeStructure,
  saveHodInFirestore,
  saveStaffInFirestore,
  saveStudentInFirestore,
  saveMultipleStudentsInFirestore,
  clearAllStudentsInFirestore,
} from '../lib/firestoreService';
import { DEPARTMENTS } from '../data/mockData';

interface DatabaseControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentInfo[];
  hods: HODAccount[];
  staffMembers: StaffMember[];
  students: Student[];
  subjects: Subject[];
  exams: ExamSchedule[];
  dailyAttendance: DailyAttendanceRecord[];
}

export const DatabaseControlModal: React.FC<DatabaseControlModalProps> = ({
  isOpen,
  onClose,
  departments,
  hods,
  staffMembers,
  students,
  subjects,
  exams,
  dailyAttendance,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'initialize' | 'quick-add' | 'bulk-import'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Add State
  const [addType, setAddType] = useState<'hod' | 'staff' | 'student'>('hod');

  // HOD Form
  const [hodName, setHodName] = useState('');
  const [hodId, setHodId] = useState('HOD-CSE');
  const [hodPassword, setHodPassword] = useState('CSE@1120');
  const [hodDept, setHodDept] = useState('CSE');
  const [hodEmail, setHodEmail] = useState('');

  // Staff Form
  const [staffName, setStaffName] = useState('');
  const [staffId, setStaffId] = useState('STF-CSE-01');
  const [staffPassword, setStaffPassword] = useState('STAFF@1120');
  const [staffDept, setStaffDept] = useState('CSE');
  const [staffDesignation, setStaffDesignation] = useState('Associate Professor');
  const [staffEmail, setStaffEmail] = useState('');
  const [isCC, setIsCC] = useState(false);
  const [ccSem, setCcSem] = useState(6);
  const [ccYear, setCcYear] = useState(3);
  const [ccBatch, setCcBatch] = useState('2023-2027');

  // Student Form
  const [studRegNo, setStudRegNo] = useState('112021104001');
  const [studName, setStudName] = useState('');
  const [studDob, setStudDob] = useState('2004-05-15');
  const [studDept, setStudDept] = useState('CSE');
  const [studYear, setStudYear] = useState(3);
  const [studSem, setStudSem] = useState(6);
  const [studBatch, setStudBatch] = useState('2023-2027');
  const [studEmail, setStudEmail] = useState('');
  const [studPhone, setStudPhone] = useState('');

  // Bulk Import State
  const [csvText, setCsvText] = useState('');
  const [bulkDept, setBulkDept] = useState('CSE');
  const [bulkSem, setBulkSem] = useState(6);
  const [bulkYear, setBulkYear] = useState(3);
  const [bulkBatch, setBulkBatch] = useState('2023-2027');

  if (!isOpen) return null;

  const handleInitializeStructure = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      await initializeWholeCollegeStructure();
      setStatusMessage({
        type: 'success',
        text: 'College structure initialized! All 11 engineering departments, comprehensive 8-semester subjects, and academic calendar are ready.',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to initialize college structure.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateHod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hodName || !hodId || !hodPassword) {
      setStatusMessage({ type: 'error', text: 'Please provide Name, HOD ID and Password.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const newHod: HODAccount = {
        hodId: hodId.trim().toUpperCase(),
        password: hodPassword,
        name: hodName.trim(),
        email: hodEmail.trim() || `${hodId.toLowerCase()}@jayasakthi.edu.in`,
        department: hodDept,
      };
      await saveHodInFirestore(newHod);
      setStatusMessage({ type: 'success', text: `HOD Account "${newHod.name}" (${newHod.department}) created successfully!` });
      setHodName('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save HOD.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffId || !staffPassword) {
      setStatusMessage({ type: 'error', text: 'Please provide Name, Staff ID and Password.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const newStaff: StaffMember = {
        staffId: staffId.trim().toUpperCase(),
        password: staffPassword,
        name: staffName.trim(),
        email: staffEmail.trim() || `${staffId.toLowerCase()}@jayasakthi.edu.in`,
        department: staffDept,
        designation: staffDesignation,
        isCC,
        ccSemester: isCC ? ccSem : undefined,
        ccYear: isCC ? ccYear : undefined,
        ccBatch: isCC ? ccBatch : undefined,
      };
      await saveStaffInFirestore(newStaff);
      setStatusMessage({ type: 'success', text: `Faculty Staff "${newStaff.name}" (${newStaff.department}) created successfully!` });
      setStaffName('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save Staff.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studName || !studRegNo || !studDob) {
      setStatusMessage({ type: 'error', text: 'Please provide Student Name, Register Number and Date of Birth.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const newStudent: Student = {
        registerNumber: studRegNo.trim().toUpperCase(),
        name: studName.trim(),
        dob: studDob,
        department: studDept,
        year: (Math.min(Math.max(Number(studYear), 1), 4) as 1 | 2 | 3 | 4),
        currentSemester: Number(studSem),
        batch: studBatch,
        email: studEmail.trim() || `${studRegNo.toLowerCase()}@student.jayasakthi.edu.in`,
        phone: studPhone.trim(),
        attendance: {
          totalClasses: 120,
          attendedClasses: 110,
          percentage: 91.6,
          semester: Number(studSem),
          lastUpdated: new Date().toISOString().split('T')[0],
        },
        examRecords: [],
      };
      await saveStudentInFirestore(newStudent);
      setStatusMessage({ type: 'success', text: `Student "${newStudent.name}" (${newStudent.registerNumber}) registered successfully!` });
      setStudName('');
      setStudRegNo('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save Student.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkImportStudents = async () => {
    if (!csvText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please paste student rows in the text box.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const lines = csvText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const parsedStudents: Student[] = [];

      for (const line of lines) {
        // Expected format: RegNo, Name, DOB (YYYY-MM-DD), [Dept], [Email], [Phone]
        // or tab-separated
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        const regNo = parts[0]?.trim().toUpperCase();
        const name = parts[1]?.trim();
        const dob = parts[2]?.trim() || '2004-01-01';
        const dept = parts[3]?.trim().toUpperCase() || bulkDept;
        const email = parts[4]?.trim() || `${regNo.toLowerCase()}@student.jayasakthi.edu.in`;
        const phone = parts[5]?.trim() || '';

        if (regNo && name) {
          parsedStudents.push({
            registerNumber: regNo,
            name,
            dob,
            department: dept,
            year: (Math.min(Math.max(bulkYear, 1), 4) as 1 | 2 | 3 | 4),
            currentSemester: bulkSem,
            batch: bulkBatch,
            email,
            phone,
            attendance: {
              totalClasses: 100,
              attendedClasses: 92,
              percentage: 92.0,
              semester: bulkSem,
              lastUpdated: new Date().toISOString().split('T')[0],
            },
            examRecords: [],
          });
        }
      }

      if (parsedStudents.length === 0) {
        setStatusMessage({ type: 'error', text: 'Could not parse any valid student records from the input.' });
        setIsProcessing(false);
        return;
      }

      await saveMultipleStudentsInFirestore(parsedStudents);
      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${parsedStudents.length} students into ${bulkDept} (Semester ${bulkSem})!`,
      });
      setCsvText('');
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err?.message || 'Bulk import failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearStudents = async () => {
    if (!window.confirm('Are you sure you want to permanently clear ALL students from the Firestore database?')) {
      return;
    }
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      await clearAllStudentsInFirestore();
      setStatusMessage({
        type: 'success',
        text: 'All student documents have been permanently removed from the Firestore database.',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to clear students.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B2238] text-white p-5 sm:p-6 flex items-center justify-between border-b border-blue-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-wide">College Database Management</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Firestore
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Centralized database control for Jaya Sakthi Engineering College across all departments &amp; branches
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => { setActiveTab('overview'); setStatusMessage(null); }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Database Overview</span>
          </button>
          <button
            onClick={() => { setActiveTab('initialize'); setStatusMessage(null); }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'initialize' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Whole-College Setup</span>
          </button>
          <button
            onClick={() => { setActiveTab('quick-add'); setStatusMessage(null); }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'quick-add' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Register Accounts</span>
          </button>
          <button
            onClick={() => { setActiveTab('bulk-import'); setStatusMessage(null); }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'bulk-import' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Bulk CSV Import</span>
          </button>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div
            className={`p-3.5 mx-6 mt-4 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in duration-200 shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Live College Statistics</h4>
                <p className="text-xs text-slate-500">Live records connected to your Firestore Database</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase">Departments</span>
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{departments.length || DEPARTMENTS.length}</div>
                  <span className="text-[10px] text-slate-500">Across College</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase">HODs</span>
                    <Users className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{hods.length}</div>
                  <span className="text-[10px] text-slate-500">Department Heads</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase">Faculty</span>
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{staffMembers.length}</div>
                  <span className="text-[10px] text-slate-500">Teaching Staff</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase">Students</span>
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{students.length}</div>
                  <span className="text-[10px] text-slate-500">Enrolled Students</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase">Subjects</span>
                    <BookOpen className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{subjects.length}</div>
                  <span className="text-[10px] text-slate-500">Anna Univ Curriculum</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase">Exam Schedules</span>
                    <ClipboardList className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{exams.length}</div>
                  <span className="text-[10px] text-slate-500">Timetables Published</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase">Attendance Logs</span>
                    <Calendar className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{dailyAttendance.length}</div>
                  <span className="text-[10px] text-slate-500">Daily Class Sessions</span>
                </div>
              </div>

              {/* Supported College Departments List */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                <h5 className="text-xs font-black text-blue-900 uppercase tracking-wider mb-2">
                  Integrated College Engineering Branches
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {DEPARTMENTS.map((dept) => (
                    <span
                      key={dept.code}
                      className="px-2.5 py-1 bg-white text-blue-950 font-bold text-[11px] rounded-lg border border-blue-200 shadow-2xs"
                    >
                      {dept.code} &bull; {dept.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Student Database Maintenance Action */}
              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h5 className="text-xs font-black text-rose-950 uppercase tracking-wider">
                    Student Records Clean Up
                  </h5>
                  <p className="text-xs text-rose-800/80 mt-0.5">
                    Clear all enrolled students ({students.length} current) from the live Firestore database.
                  </p>
                </div>
                <button
                  onClick={handleClearStudents}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>CLEAR ALL STUDENTS</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: WHOLE-COLLEGE INITIALIZER */}
          {activeTab === 'initialize' && (
            <div className="space-y-6">
              <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-950">Initialize Whole College Academic Framework</h4>
                    <p className="text-xs text-amber-900/80 leading-relaxed">
                      This will automatically seed all 11 Engineering Departments, Anna University Regulation syllabus &amp; subjects (Semesters 1–8), and Official Academic Calendar milestones directly into your Firestore database.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">What will be initialized:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900">11 Departments</div>
                    <p className="text-slate-500 text-[11px]">CSE, AIDS, IT, ECE, EEE, MECH, CIVIL, BIO-TECH, BIO-MED, PHARMA, S&amp;H</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900">Complete 8-Sem Syllabus</div>
                    <p className="text-slate-500 text-[11px]">Core Theory, Engineering Science, Lab Practicals, and Electives</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900">Academic Milestones</div>
                    <p className="text-slate-500 text-[11px]">IAT-1, IAT-2, Model Exams, University Timetable deadlines</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleInitializeStructure}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-[#0B2238] hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
                  <span>INITIALIZE WHOLE COLLEGE FRAMEWORK</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: QUICK REGISTER ACCOUNTS */}
          {activeTab === 'quick-add' && (
            <div className="space-y-6">
              {/* Selector */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
                <button
                  type="button"
                  onClick={() => setAddType('hod')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                    addType === 'hod' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Create HOD Account
                </button>
                <button
                  type="button"
                  onClick={() => setAddType('staff')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                    addType === 'staff' ? 'bg-[#0B2238] text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Create Staff / Faculty
                </button>
                <button
                  type="button"
                  onClick={() => setAddType('student')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                    addType === 'student' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Register Student
                </button>
              </div>

              {/* HOD FORM */}
              {addType === 'hod' && (
                <form onSubmit={handleCreateHod} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Department</label>
                      <select
                        value={hodDept}
                        onChange={(e) => {
                          setHodDept(e.target.value);
                          setHodId(`HOD-${e.target.value}`);
                          setHodPassword(`${e.target.value}@1120`);
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">HOD Full Name</label>
                      <input
                        type="text"
                        value={hodName}
                        onChange={(e) => setHodName(e.target.value)}
                        placeholder="Dr. K. Ramesh"
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">HOD Login ID</label>
                      <input
                        type="text"
                        value={hodId}
                        onChange={(e) => setHodId(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Password</label>
                      <input
                        type="text"
                        value={hodPassword}
                        onChange={(e) => setHodPassword(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                  >
                    SAVE HOD TO DATABASE
                  </button>
                </form>
              )}

              {/* STAFF FORM */}
              {addType === 'staff' && (
                <form onSubmit={handleCreateStaff} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Department</label>
                      <select
                        value={staffDept}
                        onChange={(e) => {
                          setStaffDept(e.target.value);
                          setStaffId(`STF-${e.target.value}-01`);
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Faculty Name</label>
                      <input
                        type="text"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="Dr. R. Rajesh Kumar"
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Staff ID</label>
                      <input
                        type="text"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Password</label>
                      <input
                        type="text"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Designation</label>
                      <select
                        value={staffDesignation}
                        onChange={(e) => setStaffDesignation(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="Professor">Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Lab Instructor">Lab Instructor</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="isCC-check"
                        checked={isCC}
                        onChange={(e) => setIsCC(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm"
                      />
                      <label htmlFor="isCC-check" className="text-xs font-bold text-slate-800">
                        Assign as Class Counselor (CC)
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-[#0B2238] hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                  >
                    SAVE FACULTY TO DATABASE
                  </button>
                </form>
              )}

              {/* STUDENT FORM */}
              {addType === 'student' && (
                <form onSubmit={handleCreateStudent} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Register Number</label>
                      <input
                        type="text"
                        value={studRegNo}
                        onChange={(e) => setStudRegNo(e.target.value)}
                        placeholder="112021104001"
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Student Full Name</label>
                      <input
                        type="text"
                        value={studName}
                        onChange={(e) => setStudName(e.target.value)}
                        placeholder="Aarav Sharma"
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Date of Birth (Password)</label>
                      <input
                        type="date"
                        value={studDob}
                        onChange={(e) => setStudDob(e.target.value)}
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Department</label>
                      <select
                        value={studDept}
                        onChange={(e) => setStudDept(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Semester &amp; Year</label>
                      <select
                        value={studSem}
                        onChange={(e) => {
                          const s = Number(e.target.value);
                          setStudSem(s);
                          setStudYear(Math.ceil(s / 2));
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Semester {s} (Year {Math.ceil(s / 2)})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Batch</label>
                      <input
                        type="text"
                        value={studBatch}
                        onChange={(e) => setStudBatch(e.target.value)}
                        placeholder="2023-2027"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                  >
                    REGISTER STUDENT IN DATABASE
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: BULK CSV IMPORT */}
          {activeTab === 'bulk-import' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Bulk Student Enrollment</h4>
                <p className="text-xs text-slate-500">
                  Paste rows directly from Excel or Google Sheets (columns: Register No, Full Name, DOB in YYYY-MM-DD)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Department</label>
                  <select
                    value={bulkDept}
                    onChange={(e) => setBulkDept(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Semester</label>
                  <select
                    value={bulkSem}
                    onChange={(e) => {
                      const s = Number(e.target.value);
                      setBulkSem(s);
                      setBulkYear(Math.ceil(s / 2));
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s} (Year {Math.ceil(s / 2)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Batch</label>
                  <input
                    type="text"
                    value={bulkBatch}
                    onChange={(e) => setBulkBatch(e.target.value)}
                    placeholder="2023-2027"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Paste CSV / Tab-Separated Student Data:
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={6}
                  placeholder={`112021104001, Aarav Sharma, 2004-05-15\n112021104002, Bhavna Ramesh, 2004-08-20\n112021104003, Charan Raj, 2003-12-10`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleBulkImportStudents}
                  disabled={isProcessing || !csvText.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>IMPORT ALL STUDENTS TO FIRESTORE</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Jaya Sakthi Engineering College &bull; Academic Enterprise Database
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
