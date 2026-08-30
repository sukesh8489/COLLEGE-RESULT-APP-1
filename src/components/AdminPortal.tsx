import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  UserCheck,
  GraduationCap,
  TrendingUp,
  PlusCircle,
  Trash2,
  Search,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  KeyRound,
  Mail,
  Phone,
  Briefcase,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Award,
} from 'lucide-react';
import {
  CurrentUser,
  DepartmentInfo,
  DegreeType,
  HODAccount,
  StaffMember,
  Student,
  Subject,
} from '../types';
import {
  saveDepartmentInFirestore,
  deleteDepartmentFromFirestore,
  saveHodInFirestore,
  deleteHodFromFirestore,
  saveStaffInFirestore,
  deleteStaffFromFirestore,
  saveSubjectInFirestore,
  deleteSubjectFromFirestore,
} from '../lib/firestoreService';

interface AdminPortalProps {
  departments: DepartmentInfo[];
  hods: HODAccount[];
  staff: StaffMember[];
  students: Student[];
  subjects: Subject[];
  marks?: any[];
  currentUser?: CurrentUser;
  onAddDepartment?: (dept: DepartmentInfo) => void;
  onDeleteDepartment?: (code: string) => void;
  onAddHod?: (hod: HODAccount) => void;
  onDeleteHod?: (id: string) => void;
  onAddStaff?: (staff: StaffMember) => void;
  onDeleteStaff?: (id: string) => void;
  onAddStudent?: (student: Student) => void;
  onAddSubject?: (subj: Subject) => void;
  onDeleteSubject?: (code: string) => void;
  onDeleteUser?: (id: string, type: 'hod' | 'staff' | 'student') => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  departments = [],
  hods = [],
  staff = [],
  students = [],
  subjects = [],
  currentUser,
  onAddDepartment,
  onDeleteDepartment,
  onAddHod,
  onDeleteHod,
  onAddStaff,
  onDeleteStaff,
  onAddSubject,
  onDeleteSubject,
}) => {
  // Active subtab inside Admin Portal
  const [activeSubTab, setActiveSubTab] = useState<
    'departments' | 'hods' | 'subjects' | 'reports' | 'overview'
  >('departments');

  // Delete Confirmation Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'department' | 'hod' | 'staff' | 'subject';
    id: string;
    name: string;
    extraInfo?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State: Add Department
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDegree, setDeptDegree] = useState<DegreeType>('B.E');
  const [deptMessage, setDeptMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State: Account Provisioning Selector (HOD vs Staff)
  const [accountRole, setAccountRole] = useState<'hod' | 'staff'>('hod');

  // Form State: Add HOD Account
  const [hodId, setHodId] = useState('');
  const [hodName, setHodName] = useState('');
  const [hodPassword, setHodPassword] = useState('hod@123');
  const [hodEmail, setHodEmail] = useState('');
  const [hodPhone, setHodPhone] = useState('');
  const [hodDept, setHodDept] = useState(departments[0]?.code || 'CSE');

  // Form State: Add Staff / Faculty Account
  const [staffId, setStaffId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffPassword, setStaffPassword] = useState('staff@123');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffDept, setStaffDept] = useState(departments[0]?.code || 'CSE');
  const [staffDesignation, setStaffDesignation] = useState('Assistant Professor');
  const [staffIsCC, setStaffIsCC] = useState(false);
  const [staffCcYear, setStaffCcYear] = useState<number>(1);
  const [staffCcSem, setStaffCcSem] = useState<number>(1);
  const [staffCcBatch, setStaffCcBatch] = useState('2023-2027');

  // Feedback Message for HOD & Staff Form
  const [accountMessage, setAccountMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter State for HOD & Staff List View
  const [facultyFilterType, setFacultyFilterType] = useState<'all' | 'hod' | 'staff'>('all');
  const [facultyFilterDept, setFacultyFilterDept] = useState<string | 'all'>('all');
  const [facultySearchTerm, setFacultySearchTerm] = useState('');

  // Form State: Add Curriculum Subject
  const [subjCode, setSubjCode] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjDept, setSubjDept] = useState(departments[0]?.code || 'CSE');
  const [subjSem, setSubjSem] = useState(1);
  const [subjMessage, setSubjMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subject Table Filter State (List View by Semester)
  const [subjectFilterSem, setSubjectFilterSem] = useState<number>(1);
  const [subjectFilterDept, setSubjectFilterDept] = useState<string | 'all'>('all');
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

  // Filter Configured Subjects by Selected Semester, Department, and Search query
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSem = Number(s.semester) === Number(subjectFilterSem);
      const matchesDept = subjectFilterDept === 'all' || s.department === subjectFilterDept;
      const q = subjectSearchQuery.trim().toLowerCase();
      const matchesQuery = !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.department.toLowerCase().includes(q);
      return matchesSem && matchesDept && matchesQuery;
    });
  }, [subjects, subjectFilterSem, subjectFilterDept, subjectSearchQuery]);

  // Global search filter for Overview
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate Overall College Pass Rate
  const collegePassRate = useMemo(() => {
    let totalExamRecords = 0;
    let passedExamRecords = 0;

    students.forEach((st) => {
      st.examRecords?.forEach((rec) => {
        totalExamRecords++;
        if (rec.overallStatus === 'PASS') {
          passedExamRecords++;
        }
      });
    });

    if (totalExamRecords === 0) return '100.0%';
    return ((passedExamRecords / totalExamRecords) * 100).toFixed(1) + '%';
  }, [students]);

  // Handle Add Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = deptCode.trim().toUpperCase();
    const cleanName = deptName.trim();

    if (!cleanCode || !cleanName) {
      setDeptMessage({ type: 'error', text: 'Please enter department code and name.' });
      return;
    }

    if (departments.some((d) => d.code.toUpperCase() === cleanCode)) {
      setDeptMessage({ type: 'error', text: `Department "${cleanCode}" already exists.` });
      return;
    }

    const newDept: DepartmentInfo = {
      code: cleanCode,
      name: cleanName,
      degree: deptDegree,
    };

    try {
      await saveDepartmentInFirestore(newDept);
      if (onAddDepartment) onAddDepartment(newDept);
      setDeptCode('');
      setDeptName('');
      setDeptMessage({ type: 'success', text: `Department "${cleanCode}" created successfully!` });
      setTimeout(() => setDeptMessage(null), 3500);
    } catch (err: any) {
      setDeptMessage({ type: 'error', text: err?.message || 'Failed to create department.' });
    }
  };

  // Perform Confirmed Deletion
  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);

    try {
      if (deleteConfirmTarget.type === 'department') {
        await deleteDepartmentFromFirestore(deleteConfirmTarget.id);
        if (onDeleteDepartment) onDeleteDepartment(deleteConfirmTarget.id);
        setDeptMessage({
          type: 'success',
          text: `Department "${deleteConfirmTarget.id}" deleted successfully.`,
        });
        setTimeout(() => setDeptMessage(null), 3500);
      } else if (deleteConfirmTarget.type === 'hod') {
        await deleteHodFromFirestore(deleteConfirmTarget.id);
        if (onDeleteHod) onDeleteHod(deleteConfirmTarget.id);
        setAccountMessage({
          type: 'success',
          text: `HOD account "${deleteConfirmTarget.id}" deleted successfully.`,
        });
        setTimeout(() => setAccountMessage(null), 3500);
      } else if (deleteConfirmTarget.type === 'staff') {
        await deleteStaffFromFirestore(deleteConfirmTarget.id);
        if (onDeleteStaff) onDeleteStaff(deleteConfirmTarget.id);
        setAccountMessage({
          type: 'success',
          text: `Staff account "${deleteConfirmTarget.id}" deleted successfully.`,
        });
        setTimeout(() => setAccountMessage(null), 3500);
      } else if (deleteConfirmTarget.type === 'subject') {
        await deleteSubjectFromFirestore(deleteConfirmTarget.id);
        if (onDeleteSubject) onDeleteSubject(deleteConfirmTarget.id);
        setSubjMessage({
          type: 'success',
          text: `Subject "${deleteConfirmTarget.id}" deleted successfully.`,
        });
        setTimeout(() => setSubjMessage(null), 3500);
      }
    } catch (err: any) {
      console.error('Error during deletion:', err);
      if (deleteConfirmTarget.type === 'department') {
        setDeptMessage({ type: 'error', text: `Failed to delete department: ${err?.message || 'Unknown error'}` });
      } else if (deleteConfirmTarget.type === 'hod' || deleteConfirmTarget.type === 'staff') {
        setAccountMessage({ type: 'error', text: `Failed to delete ${deleteConfirmTarget.type}: ${err?.message || 'Unknown error'}` });
      } else if (deleteConfirmTarget.type === 'subject') {
        setSubjMessage({ type: 'error', text: `Failed to delete subject: ${err?.message || 'Unknown error'}` });
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmTarget(null);
    }
  };

  // Handle Create HOD
  const handleCreateHod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hodId.trim() || !hodName.trim() || !hodDept) {
      setAccountMessage({ type: 'error', text: 'Please fill in all HOD details.' });
      return;
    }

    const cleanId = hodId.trim().toUpperCase();

    // Check if ID already exists
    if (hods.some((h) => h.hodId.toUpperCase() === cleanId)) {
      setAccountMessage({ type: 'error', text: `HOD ID "${cleanId}" already exists.` });
      return;
    }

    const newHod: HODAccount = {
      hodId: cleanId,
      name: hodName.trim(),
      password: hodPassword || 'hod@123',
      email: hodEmail.trim() || `${cleanId.toLowerCase()}@jayasakthi.edu`,
      phone: hodPhone.trim() || undefined,
      department: hodDept,
    };

    try {
      await saveHodInFirestore(newHod);
      if (onAddHod) onAddHod(newHod);
      setHodId('');
      setHodName('');
      setHodEmail('');
      setHodPhone('');
      setAccountMessage({ type: 'success', text: `HOD Account (${newHod.name} - ${newHod.department}) created successfully!` });
      setTimeout(() => setAccountMessage(null), 4000);
    } catch (err: any) {
      setAccountMessage({ type: 'error', text: err?.message || 'Failed to create HOD account.' });
    }
  };

  // Handle Create Staff / Faculty Member
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim() || !staffName.trim() || !staffDept) {
      setAccountMessage({ type: 'error', text: 'Please fill in required faculty details.' });
      return;
    }

    const cleanId = staffId.trim().toUpperCase();

    // Check if ID already exists
    if (staff.some((s) => s.staffId.toUpperCase() === cleanId)) {
      setAccountMessage({ type: 'error', text: `Staff ID "${cleanId}" already exists.` });
      return;
    }

    const newStaff: StaffMember = {
      staffId: cleanId,
      name: staffName.trim(),
      password: staffPassword || 'staff@123',
      email: staffEmail.trim() || `${cleanId.toLowerCase()}@jayasakthi.edu`,
      phone: staffPhone.trim() || undefined,
      department: staffDept,
      designation: staffDesignation.trim() || 'Assistant Professor',
      isCC: staffIsCC,
      ccYear: staffIsCC ? staffCcYear : undefined,
      ccSemester: staffIsCC ? staffCcSem : undefined,
      ccBatch: staffIsCC ? staffCcBatch.trim() : undefined,
    };

    try {
      await saveStaffInFirestore(newStaff);
      if (onAddStaff) onAddStaff(newStaff);
      setStaffId('');
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setStaffIsCC(false);
      setAccountMessage({
        type: 'success',
        text: `Staff Account (${newStaff.name} - ${newStaff.department}) created successfully!`,
      });
      setTimeout(() => setAccountMessage(null), 4000);
    } catch (err: any) {
      setAccountMessage({ type: 'error', text: err?.message || 'Failed to create Staff account.' });
    }
  };

  // Handle Create Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjCode.trim() || !subjName.trim()) {
      setSubjMessage({ type: 'error', text: 'Please enter subject code and name.' });
      return;
    }

    const newSubj: Subject = {
      code: subjCode.trim().toUpperCase(),
      name: subjName.trim(),
      department: subjDept,
      semester: subjSem,
      maxMarks: 100,
      credits: 3,
    };

    try {
      await saveSubjectInFirestore(newSubj);
      if (onAddSubject) onAddSubject(newSubj);
      setSubjCode('');
      setSubjName('');
      setSubjectFilterSem(subjSem); // Automatically switch view to the added semester
      setSubjMessage({ type: 'success', text: `Subject ${newSubj.code} added to Semester ${subjSem}!` });
      setTimeout(() => setSubjMessage(null), 3500);
    } catch (err: any) {
      setSubjMessage({ type: 'error', text: err?.message || 'Failed to create subject.' });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE ADMINISTRATION HEADER BANNER (MATCHES SCREENSHOT) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#0c1427] via-[#101b3b] to-[#0c1427] p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl text-white relative overflow-hidden space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Yellow Building / Central Admin Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <Building2 className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <div className="text-amber-400 font-extrabold text-[11px] tracking-widest uppercase flex items-center gap-1.5">
                <span>Executive Administration</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Main Administrator Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-normal">
                Complete control over Departments, HOD Accounts, Staff &amp; College-wide Performance Reports
              </p>
            </div>
          </div>
        </div>

        {/* Dark Pill Badge: Admin ID */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-2.5 inline-flex items-center gap-2 max-w-sm shadow-inner">
          <span className="text-amber-400 font-bold text-xs">Admin ID:</span>
          <span className="text-white font-black text-xs tracking-wider">
            {currentUser?.id || 'ADMIN'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS & METRICS CARDS (MATCHES SCREENSHOT) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* 2x2 Grid for the top 4 counts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* 1. Departments */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm text-center space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Departments
            </span>
            <div className="text-3xl sm:text-4xl font-black text-blue-900">
              {departments.length}
            </div>
          </div>

          {/* 2. HOD Accounts */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm text-center space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              HOD Accounts
            </span>
            <div className="text-3xl sm:text-4xl font-black text-amber-600">
              {hods.length}
            </div>
          </div>

          {/* 3. Staff Members */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm text-center space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Staff Members
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-700">
              {staff.length}
            </div>
          </div>

          {/* 4. Total Students */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm text-center space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Students
            </span>
            <div className="text-3xl sm:text-4xl font-black text-indigo-900">
              {students.length}
            </div>
          </div>
        </div>

        {/* Full-width College Pass Rate Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm text-center space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
            College Pass Rate
          </span>
          <div className="text-3xl sm:text-4xl font-black text-blue-600">
            {collegePassRate}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-NAVIGATION PILLS (MATCHES SCREENSHOT) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* Pill 1: Departments */}
          <button
            type="button"
            onClick={() => setActiveSubTab('departments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'departments'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeSubTab === 'departments' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Departments ({departments.length})</span>
          </button>

          {/* Pill 2: HOD & Staff Accounts */}
          <button
            type="button"
            onClick={() => setActiveSubTab('hods')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'hods'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${activeSubTab === 'hods' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>HOD &amp; Staff Accounts ({hods.length + staff.length})</span>
          </button>

          {/* Pill 3: Curriculum Subjects */}
          <button
            type="button"
            onClick={() => setActiveSubTab('subjects')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'subjects'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeSubTab === 'subjects' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Curriculum Subjects ({subjects.length})</span>
          </button>

          {/* Pill 4: College Reports */}
          <button
            type="button"
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'reports'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeSubTab === 'reports' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>College Reports</span>
          </button>

          {/* Pill 5: All Records Overview */}
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Search className={`w-4 h-4 ${activeSubTab === 'overview' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>All Records Overview</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ACTIVE SUB-TAB CONTENT */}
      {/* ========================================================================= */}

      {/* TAB A: DEPARTMENTS (MATCHES SCREENSHOT FORM) */}
      {activeSubTab === 'departments' && (
        <div className="space-y-6">
          {/* Add New Department Form Card (EXACT MATCH TO SCREENSHOT) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Add New Department
              </h2>
            </div>

            {deptMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  deptMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {deptMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{deptMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              {/* Field 1: Department Code */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Department Code (e.g. CSE, AIDS)
                </label>
                <input
                  type="text"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                  placeholder="E.G.  AIDS"
                  required
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
              </div>

              {/* Field 2: Full Department Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Full Department Name
                </label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence and Data Science"
                  required
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
                />
              </div>

              {/* Field 3: Degree Program */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Degree Category
                </label>
                <div className="grid grid-cols-2 gap-2 max-w-xs">
                  <button
                    type="button"
                    onClick={() => setDeptDegree('B.E')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer border ${
                      deptDegree === 'B.E'
                        ? 'bg-blue-900 text-white border-blue-950 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    B.E Program
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeptDegree('B.Tech')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer border ${
                      deptDegree === 'B.Tech'
                        ? 'bg-blue-900 text-white border-blue-950 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    B.Tech Program
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>+ Create Department</span>
              </button>
            </form>
          </div>

          {/* List of Registered Departments */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Configured Academic Departments ({departments.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Categorized by Bachelor of Technology (B.Tech) and Bachelor of Engineering (B.E) programs
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold bg-teal-50 text-teal-900 border border-teal-200 px-2.5 py-1 rounded-lg">
                  {departments.filter((d) => (d.degree || (['AIDS', 'PHARMA', 'BIO-TECH'].includes(d.code) ? 'B.Tech' : 'B.E')) === 'B.Tech').length} B.Tech Programs
                </span>
                <span className="text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {departments.filter((d) => (d.degree || (['AIDS', 'PHARMA', 'BIO-TECH'].includes(d.code) ? 'B.Tech' : 'B.E')) === 'B.E').length} B.E Programs
                </span>
              </div>
            </div>

            {/* Two Column Layout: Left Side B.Tech & Right Side B.E */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: B.Tech. (Bachelor of Technology) */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-teal-50/40 border border-teal-200/60">
                <div className="flex items-center justify-between pb-2 border-b border-teal-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-700" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-teal-950">
                      B.Tech. Programs (Bachelor of Technology)
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 font-mono">
                    {departments.filter((d) => (d.degree || (['AIDS', 'PHARMA', 'BIO-TECH'].includes(d.code) ? 'B.Tech' : 'B.E')) === 'B.Tech').length} Depts
                  </span>
                </div>

                <div className="space-y-3">
                  {departments
                    .filter((d) => (d.degree || (['AIDS', 'PHARMA', 'BIO-TECH'].includes(d.code) ? 'B.Tech' : 'B.E')) === 'B.Tech')
                    .map((d) => {
                      const deptHods = hods.filter((h) => h.department === d.code);
                      const deptStaff = staff.filter((s) => s.department === d.code);
                      const deptStudents = students.filter((st) => st.department === d.code);

                      return (
                        <div
                          key={d.code}
                          className="p-4 rounded-2xl border border-teal-100 bg-white hover:border-teal-300 transition-all space-y-3 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-teal-900 bg-teal-100 px-2 py-0.5 rounded-md">
                                  {d.code}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-700 text-white">
                                  B.Tech
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 leading-snug">
                                {d.name}
                              </h5>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirmTarget({
                                  type: 'department',
                                  id: d.code,
                                  name: d.name,
                                  extraInfo: `Degree: B.Tech | Enrolled Students: ${deptStudents.length}`,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title={`Delete Department ${d.code}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-center pt-2 border-t border-teal-50 text-[11px]">
                            <div className="bg-slate-50 py-1 rounded-lg">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">HODs</span>
                              <span className="font-bold text-slate-800">{deptHods.length}</span>
                            </div>
                            <div className="bg-slate-50 py-1 rounded-lg">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Faculty</span>
                              <span className="font-bold text-slate-800">{deptStaff.length}</span>
                            </div>
                            <div className="bg-slate-50 py-1 rounded-lg">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Students</span>
                              <span className="font-bold text-slate-800">{deptStudents.length}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {departments.filter((d) => (d.degree || (['AIDS', 'PHARMA', 'BIO-TECH'].includes(d.code) ? 'B.Tech' : 'B.E')) === 'B.Tech').length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No B.Tech departments configured</p>
                  )}
                </div>
              </div>

              {/* Right Column: B.E. (Bachelor of Engineering) */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-950">
                      B.E. Programs (Bachelor of Engineering)
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {departments.filter((d) => (d.degree || (['AIDS', 'PHARMA', 'BIO-TECH'].includes(d.code) ? 'B.Tech' : 'B.E')) === 'B.E').length} Depts
                  </span>
                </div>

                <div className="space-y-3">
                  {departments
                    .filter((d) => (d.degree || (['AIDS', 'PHARMA', 'BIO-TECH'].includes(d.code) ? 'B.Tech' : 'B.E')) === 'B.E')
                    .map((d) => {
                      const deptHods = hods.filter((h) => h.department === d.code);
                      const deptStaff = staff.filter((s) => s.department === d.code);
                      const deptStudents = students.filter((st) => st.department === d.code);

                      return (
                        <div
                          key={d.code}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all space-y-3 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md">
                                  {d.code}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900 text-white">
                                  B.E
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 leading-snug">
                                {d.name}
                              </h5>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirmTarget({
                                  type: 'department',
                                  id: d.code,
                                  name: d.name,
                                  extraInfo: `Degree: B.E | Enrolled Students: ${deptStudents.length}`,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title={`Delete Department ${d.code}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-center pt-2 border-t border-slate-100 text-[11px]">
                            <div className="bg-slate-50 py-1 rounded-lg">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">HODs</span>
                              <span className="font-bold text-slate-800">{deptHods.length}</span>
                            </div>
                            <div className="bg-slate-50 py-1 rounded-lg">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Faculty</span>
                              <span className="font-bold text-slate-800">{deptStaff.length}</span>
                            </div>
                            <div className="bg-slate-50 py-1 rounded-lg">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Students</span>
                              <span className="font-bold text-slate-800">{deptStudents.length}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {departments.filter((d) => (d.degree || (['AIDS', 'PHARMA', 'BIO-TECH'].includes(d.code) ? 'B.Tech' : 'B.E')) === 'B.E').length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No B.E departments configured</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: HOD & STAFF ACCOUNTS */}
      {activeSubTab === 'hods' && (
        <div className="space-y-6">
          {/* Account Provisioning Card with Role Selector */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Provision Academic &amp; Faculty Accounts
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Select the role below to configure login credentials and department assignments
                  </p>
                </div>
              </div>

              {/* Quick Counter Badges */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                  {hods.length} HODs
                </span>
                <span className="text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {staff.length} Staff
                </span>
              </div>
            </div>

            {/* Role Selection Option: HOD vs Staff */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                1. Select Account Role to Add:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Head of Department (HOD) */}
                <button
                  type="button"
                  onClick={() => {
                    setAccountRole('hod');
                    setAccountMessage(null);
                  }}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                    accountRole === 'hod'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition ${
                        accountRole === 'hod'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black tracking-tight text-slate-900">
                        <span>Head of Department (HOD)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        accountRole === 'hod'
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {accountRole === 'hod' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>

                {/* Option 2: Faculty */}
                <button
                  type="button"
                  onClick={() => {
                    setAccountRole('staff');
                    setAccountMessage(null);
                  }}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                    accountRole === 'staff'
                      ? 'bg-blue-900/10 border-blue-900 text-blue-950 ring-2 ring-blue-900/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition ${
                        accountRole === 'staff'
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black tracking-tight text-slate-900">
                        <span>Faculty</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        accountRole === 'staff'
                          ? 'border-blue-900 bg-blue-900'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {accountRole === 'staff' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Notification alert banner */}
            {accountMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                  accountMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {accountMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{accountMessage.text}</span>
              </div>
            )}

            {/* FORM 1: IF HOD IS SELECTED */}
            {accountRole === 'hod' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Enter Details for New Department HOD:
                  </h3>
                </div>

                <form onSubmit={handleCreateHod} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field 1: HOD User ID */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      HOD User ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={hodId}
                      onChange={(e) => setHodId(e.target.value.toUpperCase())}
                      placeholder="e.g. HOD_CSE or HOD_AIDS"
                      required
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Field 2: Faculty Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Faculty / HOD Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={hodName}
                      onChange={(e) => setHodName(e.target.value)}
                      placeholder="e.g. Dr. K. Ramesh, M.E., Ph.D."
                      required
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Field 3: Department */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Department Assignment <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={hodDept}
                      onChange={(e) => setHodDept(e.target.value)}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {departments.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field 4: Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      value={hodEmail}
                      onChange={(e) => setHodEmail(e.target.value)}
                      placeholder="e.g. hod.cse@jayasakthi.edu"
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Field 5: Default Password */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Default Login Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={hodPassword}
                      onChange={(e) => setHodPassword(e.target.value)}
                      placeholder="hod@123"
                      required
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 font-mono focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Field 6: Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={hodPhone}
                      onChange={(e) => setHodPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create &amp; Provision HOD Account</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* FORM 2: IF STAFF IS SELECTED */}
            {accountRole === 'staff' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-900"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Enter Details for New Faculty :
                  </h3>
                </div>

                <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field 1: Staff ID */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Faculty / Staff ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                      placeholder="e.g. STAFF_CSE01 or FAC101"
                      required
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  {/* Field 2: Staff Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Staff / Faculty Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="e.g. Prof. A. Suresh, M.E."
                      required
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  {/* Field 3: Department */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Department Assignment <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={staffDept}
                      onChange={(e) => setStaffDept(e.target.value)}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    >
                      {departments.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field 4: Academic Designation */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Designation
                    </label>
                    <select
                      value={staffDesignation}
                      onChange={(e) => setStaffDesignation(e.target.value)}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    >
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                    </select>
                  </div>

                  {/* Field 5: Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="e.g. suresh.cse@jayasakthi.edu"
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  {/* Field 6: Default Password */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Default Login Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="staff@123"
                      required
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 font-mono focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  {/* Field 7: Contact Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43211"
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  {/* Field 8: Class Counselor (CC) Assignment Box */}
                  <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={staffIsCC}
                        onChange={(e) => setStaffIsCC(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-900 focus:ring-blue-900 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Assign as Class Counselor (CC) / Year In-charge
                      </span>
                    </label>

                    {staffIsCC && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Academic Year
                          </label>
                          <select
                            value={staffCcYear}
                            onChange={(e) => setStaffCcYear(Number(e.target.value))}
                            className="w-full mt-1 py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                          >
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            <option value={3}>3rd Year</option>
                            <option value={4}>4th Year</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            In-charge Semester
                          </label>
                          <select
                            value={staffCcSem}
                            onChange={(e) => setStaffCcSem(Number(e.target.value))}
                            className="w-full mt-1 py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                              <option key={s} value={s}>
                                Semester {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Batch / Section
                          </label>
                          <input
                            type="text"
                            value={staffCcBatch}
                            onChange={(e) => setStaffCcBatch(e.target.value)}
                            placeholder="e.g. 2023-2027"
                            className="w-full mt-1 py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create &amp; Provision Staff Account</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* List of Registered Accounts: HODs & Staff */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Registered Faculty &amp; HOD Directory
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manage login accounts, department credentials, and counselor assignments
                </p>
              </div>

              {/* Filter Tabs: All / HODs / Staff */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFacultyFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    facultyFilterType === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({hods.length + staff.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFacultyFilterType('hod')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    facultyFilterType === 'hod'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>HODs ({hods.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFacultyFilterType('staff')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    facultyFilterType === 'staff'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-900" />
                  <span>Staff ({staff.length})</span>
                </button>
              </div>
            </div>

            {/* Search and Department Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={facultySearchTerm}
                  onChange={(e) => setFacultySearchTerm(e.target.value)}
                  placeholder="Search by name, ID, email, or designation..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={facultyFilterDept}
                  onChange={(e) => setFacultyFilterDept(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                >
                  <option value="all">All Departments ({departments.length})</option>
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Grid for Accounts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Render HODs if included in filter */}
              {(facultyFilterType === 'all' || facultyFilterType === 'hod') &&
                hods
                  .filter((h) => {
                    const matchesDept = facultyFilterDept === 'all' || h.department === facultyFilterDept;
                    const q = facultySearchTerm.trim().toLowerCase();
                    const matchesQuery =
                      !q ||
                      h.name.toLowerCase().includes(q) ||
                      h.hodId.toLowerCase().includes(q) ||
                      h.email.toLowerCase().includes(q) ||
                      h.department.toLowerCase().includes(q);
                    return matchesDept && matchesQuery;
                  })
                  .map((h) => (
                    <div
                      key={`hod-${h.hodId}`}
                      className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/30 space-y-2.5 flex flex-col justify-between hover:shadow-xs transition"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                              {h.department}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded">
                              HOD
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirmTarget({
                                type: 'hod',
                                id: h.hodId,
                                name: h.name,
                                extraInfo: `Department: ${h.department}`,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title={`Delete HOD ${h.hodId}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{h.name}</h4>
                          <p className="text-[11px] text-slate-500 font-mono">User ID: {h.hodId}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-amber-200/60 space-y-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{h.email}</span>
                        </div>
                        {h.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{h.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

              {/* Render Staff if included in filter */}
              {(facultyFilterType === 'all' || facultyFilterType === 'staff') &&
                staff
                  .filter((s) => {
                    const matchesDept = facultyFilterDept === 'all' || s.department === facultyFilterDept;
                    const q = facultySearchTerm.trim().toLowerCase();
                    const matchesQuery =
                      !q ||
                      s.name.toLowerCase().includes(q) ||
                      s.staffId.toLowerCase().includes(q) ||
                      s.email.toLowerCase().includes(q) ||
                      s.department.toLowerCase().includes(q) ||
                      (s.designation && s.designation.toLowerCase().includes(q));
                    return matchesDept && matchesQuery;
                  })
                  .map((s) => (
                    <div
                      key={`staff-${s.staffId}`}
                      className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/30 space-y-2.5 flex flex-col justify-between hover:shadow-xs transition"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-black text-blue-900 bg-blue-200/80 px-2 py-0.5 rounded">
                              {s.department}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-900 text-white px-2 py-0.5 rounded">
                              STAFF
                            </span>
                            {s.isCC && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded">
                                CC: Sem {s.ccSemester || s.ccYear || 1}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirmTarget({
                                type: 'staff',
                                id: s.staffId,
                                name: s.name,
                                extraInfo: `Department: ${s.department} • Role: ${s.designation || 'Staff'}`,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title={`Delete Staff ${s.staffId}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                          <p className="text-[11px] text-blue-900 font-medium">{s.designation || 'Faculty Member'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">Staff ID: {s.staffId}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-blue-200/60 space-y-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{s.email}</span>
                        </div>
                        {s.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
            </div>

            {/* Empty state */}
            {((facultyFilterType === 'hod' && hods.length === 0) ||
              (facultyFilterType === 'staff' && staff.length === 0) ||
              (hods.length === 0 && staff.length === 0)) && (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No accounts found</p>
                <p className="text-[11px] text-slate-400">
                  Use the form above to provision HOD or Faculty accounts
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB C: CURRICULUM SUBJECTS */}
      {activeSubTab === 'subjects' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <PlusCircle className="w-5 h-5 text-blue-900" />
              <h2 className="text-base font-bold text-slate-900">
                Register Curriculum Course / Subject
              </h2>
            </div>

            {subjMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  subjMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {subjMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{subjMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubject} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Course Code
                </label>
                <input
                  id="admin-course-code-input"
                  type="text"
                  value={subjCode}
                  onChange={(e) => setSubjCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CS8691"
                  required
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Course Name / Title
                </label>
                <input
                  type="text"
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence"
                  required
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Department
                </label>
                <select
                  value={subjDept}
                  onChange={(e) => setSubjDept(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                >
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Semester (1 - 8)
                </label>
                <select
                  value={subjSem}
                  onChange={(e) => setSubjSem(Number(e.target.value))}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition"
                >
                  + Add Course to Curriculum
                </button>
              </div>
            </form>
          </div>

          {/* Subjects Section with Semester List View */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            {/* Header with Title and Right-Side Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-900" />
                  <span>Configured Subjects</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                    Semester {subjectFilterSem} &bull; {filteredSubjects.length} Courses
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a semester on the left and filter by department on the right to manage curriculum.
                </p>
              </div>

              {/* Right Side Controls: Department Selection Dropdown & Search Box */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Department Selection Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                  <label htmlFor="admin-dept-filter-select" className="text-xs font-bold text-slate-600 shrink-0">
                    Dept:
                  </label>
                  <select
                    id="admin-dept-filter-select"
                    value={subjectFilterDept}
                    onChange={(e) => setSubjectFilterDept(e.target.value)}
                    className="py-1 px-2 rounded-lg text-xs font-bold text-slate-800 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-900 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={subjectSearchQuery}
                    onChange={(e) => setSubjectSearchQuery(e.target.value)}
                    placeholder={`Search Sem ${subjectFilterSem}...`}
                    className="pl-8 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none w-44"
                  />
                  {subjectSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSubjectSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* List View Layout: Semester List on Left / Table on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Semester List View (Even Semesters on Left, Odd Semesters on Right) */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-900" />
                    Semester List
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">8 Semesters</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/80">
                  {/* Left Column: Odd Semesters (1, 3, 5, 7) */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center py-1 bg-slate-200/70 rounded-lg">
                      Odd Semesters
                    </div>
                    {[1, 3, 5, 7].map((semNum) => {
                      const countForSem = subjects.filter((s) => Number(s.semester) === semNum).length;
                      const isSelected = subjectFilterSem === semNum;
                      return (
                        <button
                          key={semNum}
                          type="button"
                          onClick={() => setSubjectFilterSem(semNum)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                            isSelected
                              ? 'bg-blue-900 text-white shadow-sm ring-1 ring-blue-900'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center text-[10px] font-mono font-bold ${
                                isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              S{semNum}
                            </span>
                            <span className="truncate text-[11px]">Sem {semNum}</span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                              isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {countForSem}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column: Even Semesters (2, 4, 6, 8) */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center py-1 bg-slate-200/70 rounded-lg">
                      Even Semesters
                    </div>
                    {[2, 4, 6, 8].map((semNum) => {
                      const countForSem = subjects.filter((s) => Number(s.semester) === semNum).length;
                      const isSelected = subjectFilterSem === semNum;
                      return (
                        <button
                          key={semNum}
                          type="button"
                          onClick={() => setSubjectFilterSem(semNum)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                            isSelected
                              ? 'bg-blue-900 text-white shadow-sm ring-1 ring-blue-900'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center text-[10px] font-mono font-bold ${
                                isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              S{semNum}
                            </span>
                            <span className="truncate text-[11px]">Sem {semNum}</span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                              isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {countForSem}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Subjects Table for Selected Semester (Right Side) */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-3">
                {filteredSubjects.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-slate-300 rounded-2xl bg-slate-50/50 space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-800">
                      No subjects configured for Semester {subjectFilterSem}
                      {subjectFilterDept !== 'all' ? ` in ${subjectFilterDept}` : ''}
                    </h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Use the registration form above to add courses for Semester {subjectFilterSem}
                      {subjectFilterDept !== 'all' ? ` in ${subjectFilterDept}` : ''}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubjSem(subjectFilterSem);
                        if (subjectFilterDept !== 'all') {
                          setSubjDept(subjectFilterDept);
                        }
                        const el = document.getElementById('admin-course-code-input');
                        if (el) el.focus();
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-950 transition cursor-pointer"
                    >
                      + Add Course for Semester {subjectFilterSem}
                      {subjectFilterDept !== 'all' ? ` (${subjectFilterDept})` : ''}
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-3 px-3.5">Course Code</th>
                          <th className="py-3 px-3.5">Subject Name / Title</th>
                          <th className="py-3 px-3.5">Department</th>
                          <th className="py-3 px-3.5 text-center">Semester</th>
                          <th className="py-3 px-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium bg-white">
                        {filteredSubjects.map((s) => (
                          <tr key={s.code} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3.5 font-mono font-bold text-blue-900">{s.code}</td>
                            <td className="py-3 px-3.5 text-slate-900 font-semibold">{s.name}</td>
                            <td className="py-3 px-3.5 text-slate-700">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                                {s.department}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 font-bold text-[11px] border border-blue-200">
                                Semester {s.semester}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmTarget({
                                    type: 'subject',
                                    id: s.code,
                                    name: s.name,
                                    extraInfo: `Dept: ${s.department} | Sem ${s.semester}`,
                                  })
                                }
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                title={`Delete Subject ${s.code}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB D: COLLEGE REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Institutional Academic Performance Reports
              </h2>
              <p className="text-xs text-slate-500">
                High-level metrics across all departments, batches, and examination cycles
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d) => {
              const deptStudents = students.filter((s) => s.department === d.code);
              let totalExams = 0;
              let passedExams = 0;
              deptStudents.forEach((st) => {
                st.examRecords?.forEach((rec) => {
                  totalExams++;
                  if (rec.overallStatus === 'PASS') passedExams++;
                });
              });
              const passPct = totalExams > 0 ? ((passedExams / totalExams) * 100).toFixed(1) : '100.0';

              return (
                <div key={d.code} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-xs">
                      {d.code}
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      {passPct}% Pass
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{d.name}</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200">
                    <div className="text-slate-600">
                      Enrolled: <strong className="text-slate-900">{deptStudents.length}</strong>
                    </div>
                    <div className="text-slate-600">
                      Staff: <strong className="text-slate-900">{staff.filter((s) => s.department === d.code).length}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB E: ALL RECORDS OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Institutional Directory &amp; All Records
              </h2>
              <p className="text-xs text-slate-500">
                Global search across Students, Faculty, HODs, and Subjects
              </p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any name, ID, code..."
                className="w-full py-2 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Students ({students.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {students
                .filter((st) =>
                  !searchTerm ||
                  st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  st.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  st.department.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((st) => (
                  <div key={st.registerNumber} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{st.registerNumber}</span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                        {st.department} &bull; Sem {st.currentSemester}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800">{st.name}</p>
                    <p className="text-[11px] text-slate-500">{st.email}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DEDICATED DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-black text-slate-900">
                  Delete {deleteConfirmTarget.type === 'department' ? 'Academic Department' : deleteConfirmTarget.type === 'hod' ? 'HOD Account' : deleteConfirmTarget.type === 'staff' ? 'Faculty / Staff Account' : 'Curriculum Subject'}?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This action will permanently delete{' '}
                  <strong className="text-slate-900 font-bold">
                    {deleteConfirmTarget.name} ({deleteConfirmTarget.id})
                  </strong>{' '}
                  from the system database.
                </p>
                {deleteConfirmTarget.extraInfo && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    {deleteConfirmTarget.extraInfo}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setDeleteConfirmTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl text-[11px] text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Are you sure? Any associated data or curriculum references linked directly to this {deleteConfirmTarget.type} will be affected.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : `Confirm Delete`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminPortal;
