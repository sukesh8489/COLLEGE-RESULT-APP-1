import React, { useState } from 'react';
import {
  Building2,
  Users,
  UserCheck,
  GraduationCap,
  PlusCircle,
  Trash2,
  BarChart3,
  Download,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  BookOpen,
  Award,
  Sparkles,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { DepartmentInfo, HODAccount, StaffMember, Student, Subject } from '../types';

interface AdminPortalProps {
  departments: DepartmentInfo[];
  setDepartments: React.Dispatch<React.SetStateAction<DepartmentInfo[]>>;
  hods: HODAccount[];
  setHods: React.Dispatch<React.SetStateAction<HODAccount[]>>;
  staffMembers: StaffMember[];
  students: Student[];
  subjects: Subject[];
  setSubjects?: React.Dispatch<React.SetStateAction<Subject[]>>;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  departments,
  setDepartments,
  hods,
  setHods,
  staffMembers,
  students,
  subjects,
  setSubjects,
}) => {
  const [activeTab, setActiveTab] = useState<'departments' | 'hods' | 'subjects' | 'reports' | 'global'>('departments');

  // New Department Form State
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [deptMessage, setDeptMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New HOD Form State
  const [newHodId, setNewHodId] = useState('');
  const [newHodName, setNewHodName] = useState('');
  const [newHodPass, setNewHodPass] = useState('hod123');
  const [newHodDept, setNewHodDept] = useState(departments[0]?.code || '');
  const [newHodEmail, setNewHodEmail] = useState('');
  const [newHodPhone, setNewHodPhone] = useState('');
  const [hodMessage, setHodMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Global Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Admin Subject Form State
  const [adminSubDept, setAdminSubDept] = useState(departments[0]?.code || '');
  const [adminSubCode, setAdminSubCode] = useState('');
  const [adminSubName, setAdminSubName] = useState('');
  const [adminSubSem, setAdminSubSem] = useState<number>(1);
  const [adminSubMsg, setAdminSubMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Subject Filter & Edit State
  const [adminSubFilterDept, setAdminSubFilterDept] = useState<string>('ALL');
  const [adminEditingSubCode, setAdminEditingSubCode] = useState<string | null>(null);
  const [adminEditSubName, setAdminEditSubName] = useState('');
  const [adminEditSubSem, setAdminEditSubSem] = useState<number>(1);

  const handleAdminAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setSubjects) return;
    setAdminSubMsg(null);

    const code = adminSubCode.trim().toUpperCase();
    const name = adminSubName.trim();
    const dept = adminSubDept || departments[0]?.code;

    if (!dept) {
      setAdminSubMsg({ type: 'error', text: 'Please select a department.' });
      return;
    }
    if (!code || !name) {
      setAdminSubMsg({ type: 'error', text: 'Subject code and title are required.' });
      return;
    }

    if (subjects.some((s) => s.code === code)) {
      setAdminSubMsg({ type: 'error', text: `Subject code "${code}" already exists.` });
      return;
    }

    const newSubject: Subject = {
      code,
      name,
      department: dept,
      semester: adminSubSem,
      maxMarks: 100,
    };

    setSubjects((prev) => [...prev, newSubject]);
    setAdminSubCode('');
    setAdminSubName('');
    setAdminSubMsg({ type: 'success', text: `Subject "${name}" (${code}) added to ${dept}!` });
  };

  const handleAdminDeleteSubject = (subCode: string) => {
    if (!setSubjects) return;
    const subToDelete = subjects.find((s) => s.code === subCode);
    const label = subToDelete ? `"${subToDelete.name}" (${subCode})` : subCode;
    if (confirm(`Delete subject ${label}?`)) {
      setSubjects((prev) => prev.filter((s) => s.code !== subCode));
      setAdminSubMsg({ type: 'success', text: `Subject ${subCode} deleted successfully.` });
    }
  };

  const handleAdminStartEditSubject = (sub: Subject) => {
    setAdminEditingSubCode(sub.code);
    setAdminEditSubName(sub.name);
    setAdminEditSubSem(sub.semester);
  };

  const handleAdminSaveEditSubject = (subCode: string) => {
    if (!setSubjects) return;
    const name = adminEditSubName.trim();
    if (!name) {
      alert('Subject title cannot be empty.');
      return;
    }

    setSubjects((prev) =>
      prev.map((s) => {
        if (s.code === subCode) {
          return {
            ...s,
            name,
            semester: adminEditSubSem,
          };
        }
        return s;
      })
    );

    setAdminSubMsg({ type: 'success', text: `Subject ${subCode} updated successfully!` });
    setAdminEditingSubCode(null);
  };

  // Add Department Handler
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    setDeptMessage(null);

    const code = newDeptCode.trim().toUpperCase();
    const name = newDeptName.trim();

    if (!code || !name) {
      setDeptMessage({ type: 'error', text: 'Department code and name are required.' });
      return;
    }

    if (departments.some((d) => d.code === code)) {
      setDeptMessage({ type: 'error', text: `Department code "${code}" already exists.` });
      return;
    }

    const newDept: DepartmentInfo = {
      code,
      name,
      description: '',
    };

    setDepartments((prev) => [...prev, newDept]);
    setNewDeptCode('');
    setNewDeptName('');
    setDeptMessage({ type: 'success', text: `Department "${name}" (${code}) added successfully!` });
  };

  // Delete Department Handler
  const handleDeleteDepartment = (code: string) => {
    if (confirm(`Are you sure you want to remove department ${code}?`)) {
      setDepartments((prev) => prev.filter((d) => d.code !== code));
      setHods((prev) => prev.filter((h) => h.department !== code));
    }
  };

  // Add HOD Handler
  const handleAddHod = (e: React.FormEvent) => {
    e.preventDefault();
    setHodMessage(null);

    const hodId = newHodId.trim().toUpperCase();
    const name = newHodName.trim();

    if (!hodId || !name || !newHodPass) {
      setHodMessage({ type: 'error', text: 'HOD ID, Name and Password are required.' });
      return;
    }

    if (hods.some((h) => h.hodId.toUpperCase() === hodId)) {
      setHodMessage({ type: 'error', text: `HOD account with ID "${hodId}" already exists.` });
      return;
    }

    const newHod: HODAccount = {
      hodId,
      name,
      password: newHodPass,
      department: newHodDept,
      email: newHodEmail.trim() || `${hodId.toLowerCase()}@jayasakthi.edu`,
      phone: newHodPhone.trim(),
    };

    setHods((prev) => [...prev, newHod]);
    setNewHodId('');
    setNewHodName('');
    setNewHodPass('hod123');
    setNewHodEmail('');
    setNewHodPhone('');
    setHodMessage({ type: 'success', text: `HOD Account created for ${name} (${newHodDept})!` });
  };

  // Delete HOD Handler
  const handleDeleteHod = (hodId: string) => {
    if (confirm(`Remove HOD Account ${hodId}?`)) {
      setHods((prev) => prev.filter((h) => h.hodId !== hodId));
    }
  };

  // College Statistics
  const totalStudentsCount = students.length;
  const totalStaffCount = staffMembers.length;
  const totalHodsCount = hods.length;
  const totalDeptsCount = departments.length;

  // Calculate Overall College Pass Rate
  const allExamRecords = students.flatMap((s) => s.examRecords || []);
  const totalExamsPublished = allExamRecords.length;
  const totalPassedExams = allExamRecords.filter((r) => r.overallStatus === 'PASS').length;
  const collegePassRate = totalExamsPublished > 0 ? (totalPassedExams / totalExamsPublished) * 100 : 0;

  // Export College Report as CSV
  const exportCollegeReportCSV = () => {
    if (students.length === 0) {
      alert('No student records available to export.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Register Number,Student Name,Department,Year,Semester,Batch,Email,Attendance %,Total Exams,Pass Rate %\n';

    students.forEach((st) => {
      const records = st.examRecords || [];
      const passCount = records.filter((r) => r.overallStatus === 'PASS').length;
      const rate = records.length > 0 ? ((passCount / records.length) * 100).toFixed(1) : '0.0';
      const att = st.attendance ? `${st.attendance.percentage.toFixed(1)}%` : 'N/A';

      csvContent += `"${st.registerNumber}","${st.name}","${st.department}",${st.year},${st.currentSemester},"${st.batch}","${st.email}","${att}",${records.length},"${rate}%"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `college_academic_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ADMIN HERO HEADER */}
      <div className="bg-gradient-to-r from-[#0B2238] via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-blue-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center font-bold shadow-lg">
              <ShieldCheck className="w-7 h-7 text-[#0B2238]" />
            </div>
            <div>
              <span className="text-xs text-amber-300 font-extrabold uppercase tracking-widest block">
                EXECUTIVE ADMINISTRATION
              </span>
              <h2 className="text-2xl font-black text-white">Main Administrator Portal</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Complete control over Departments, HOD Accounts, Staff & College-wide Performance Reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono">
            <span className="text-amber-300 font-bold">Admin ID:</span>
            <span className="text-white font-black">ADMIN</span>
          </div>
        </div>
      </div>

      {/* ADMIN STATS SUMMARY BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">DEPARTMENTS</span>
          <span className="text-2xl font-black text-blue-900 block mt-1">{totalDeptsCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">HOD ACCOUNTS</span>
          <span className="text-2xl font-black text-amber-600 block mt-1">{totalHodsCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">STAFF MEMBERS</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">{totalStaffCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">TOTAL STUDENTS</span>
          <span className="text-2xl font-black text-purple-600 block mt-1">{totalStudentsCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">COLLEGE PASS RATE</span>
          <span className="text-2xl font-black text-indigo-700 block mt-1">{collegePassRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('departments')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-400" />
          <span>DEPARTMENTS ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hods')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'hods'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-400" />
          <span>HOD ACCOUNTS ({hods.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>CURRICULUM SUBJECTS ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span>COLLEGE REPORTS</span>
        </button>

        <button
          onClick={() => setActiveTab('global')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'global'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <Search className="w-4 h-4 text-amber-400" />
          <span>ALL RECORDS OVERVIEW</span>
        </button>
      </div>

      {/* TAB 1: DEPARTMENTS MANAGEMENT */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Department Form */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-md h-fit space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-gray-900 text-sm">Add New Department</h3>
            </div>

            {deptMessage && (
              <div
                className={`text-xs p-3 rounded-xl ${
                  deptMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {deptMessage.text}
              </div>
            )}

            <form onSubmit={handleAddDepartment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Department Code (e.g. CSE, AIDS)
                </label>
                <input
                  type="text"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="e.g. AIDS"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-mono uppercase text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Full Department Name
                </label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence and Data Science"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow transition-all cursor-pointer"
              >
                + CREATE DEPARTMENT
              </button>
            </form>
          </div>

          {/* Departments List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              ACTIVE COLLEGE DEPARTMENTS ({departments.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {departments.map((dept) => {
                const deptHod = hods.find((h) => h.department === dept.code);
                const deptStaffCount = staffMembers.filter((s) => s.department === dept.code).length;
                const deptStudentCount = students.filter((s) => s.department === dept.code).length;

                return (
                  <div
                    key={dept.code}
                    className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-black text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 inline-block mb-1">
                          {dept.code}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm leading-tight">{dept.name}</h4>
                        {dept.description ? (
                          <p className="text-[11px] text-gray-500 mt-0.5">{dept.description}</p>
                        ) : null}
                      </div>

                      <button
                        onClick={() => handleDeleteDepartment(dept.code)}
                        className="text-gray-300 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 text-center text-[11px]">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold block uppercase">HOD</span>
                        <span className="font-bold text-gray-800 truncate block">
                          {deptHod ? deptHod.name.split(' ')[0] : 'Not Set'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold block uppercase">STAFF</span>
                        <span className="font-bold text-emerald-700">{deptStaffCount}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold block uppercase">STUDENTS</span>
                        <span className="font-bold text-purple-700">{deptStudentCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOD ACCOUNTS MANAGEMENT */}
      {activeTab === 'hods' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create HOD Form */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-md h-fit space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <UserCheck className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-gray-900 text-sm">Create HOD Account</h3>
            </div>

            {hodMessage && (
              <div
                className={`text-xs p-3 rounded-xl ${
                  hodMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {hodMessage.text}
              </div>
            )}

            <form onSubmit={handleAddHod} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Department
                </label>
                <select
                  value={newHodDept}
                  onChange={(e) => setNewHodDept(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {departments.length === 0 ? (
                    <option value="">-- No Departments Available (Add Dept First) --</option>
                  ) : (
                    departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  HOD ID / Username
                </label>
                <input
                  type="text"
                  value={newHodId}
                  onChange={(e) => setNewHodId(e.target.value)}
                  placeholder="e.g. HOD_CSE"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-mono uppercase text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  HOD Name (e.g. Dr. A. Vimal)
                </label>
                <input
                  type="text"
                  value={newHodName}
                  onChange={(e) => setNewHodName(e.target.value)}
                  placeholder="e.g. Dr. A. VIMAL KUMAR"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <input
                  type="text"
                  value={newHodPass}
                  onChange={(e) => setNewHodPass(e.target.value)}
                  placeholder="hod123"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={newHodEmail}
                  onChange={(e) => setNewHodEmail(e.target.value)}
                  placeholder="hod.cse@jayasakthi.edu"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0B2238] hover:bg-slate-900 text-amber-400 font-extrabold rounded-xl shadow transition-all cursor-pointer border border-amber-400/30"
              >
                + CREATE HOD ACCOUNT
              </button>
            </form>
          </div>

          {/* HOD Accounts List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              ACTIVE DEPARTMENT HODs ({hods.length})
            </h3>

            {hods.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
                <UserCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-semibold">No HOD accounts created yet.</p>
                <p className="text-[11px] text-gray-400">Use the form on the left to add HOD accounts for departments.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {hods.map((hod) => (
                  <div
                    key={hod.hodId}
                    className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm">
                        {hod.department}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-sm">{hod.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-gray-700 px-2 py-0.5 rounded font-mono font-bold">
                            {hod.hodId}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{hod.email} {hod.phone ? `• ${hod.phone}` : ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-400 bg-slate-50 px-2 py-1 rounded border border-gray-200">
                        Pass: {hod.password}
                      </span>
                      <button
                        onClick={() => handleDeleteHod(hod.hodId)}
                        className="p-1.5 text-gray-300 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete HOD"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: CURRICULUM SUBJECTS MANAGEMENT */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Subject Form */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-md h-fit space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-gray-900 text-sm">Add New Subject</h3>
            </div>

            {adminSubMsg && (
              <div
                className={`text-xs p-3 rounded-xl ${
                  adminSubMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {adminSubMsg.text}
              </div>
            )}

            <form onSubmit={handleAdminAddSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Department
                </label>
                <select
                  value={adminSubDept}
                  onChange={(e) => setAdminSubDept(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={adminSubCode}
                  onChange={(e) => setAdminSubCode(e.target.value)}
                  placeholder="e.g. CS8651"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-mono uppercase text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Subject Title
                </label>
                <input
                  type="text"
                  value={adminSubName}
                  onChange={(e) => setAdminSubName(e.target.value)}
                  placeholder="e.g. Internet Programming"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Semester
                </label>
                <select
                  value={adminSubSem}
                  onChange={(e) => setAdminSubSem(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-gray-900"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Sem {sem}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow transition-all cursor-pointer"
              >
                + ADD SUBJECT
              </button>
            </form>
          </div>

          {/* Subjects List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                CURRICULUM SUBJECTS ({subjects.filter((s) => adminSubFilterDept === 'ALL' || s.department === adminSubFilterDept).length})
              </h3>

              {/* Department Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setAdminSubFilterDept('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    adminSubFilterDept === 'ALL'
                      ? 'bg-[#0B2238] text-white'
                      : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                  }`}
                >
                  ALL
                </button>
                {departments.map((d) => (
                  <button
                    key={d.code}
                    onClick={() => setAdminSubFilterDept(d.code)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      adminSubFilterDept === d.code
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.code}
                  </button>
                ))}
              </div>
            </div>

            {subjects.filter((s) => adminSubFilterDept === 'ALL' || s.department === adminSubFilterDept).length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center space-y-2">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-600">No subjects found.</p>
                <p className="text-[11px] text-gray-400">Use the form on the left to add subjects to the college curriculum.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0B2238] text-white font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3 rounded-l-lg">Dept</th>
                      <th className="py-2.5 px-3">Sub Code</th>
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3 text-center">Semester</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {subjects
                      .filter((s) => adminSubFilterDept === 'ALL' || s.department === adminSubFilterDept)
                      .map((sub, idx) => {
                        const isEditing = adminEditingSubCode === sub.code;
                        return (
                          <tr key={sub.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-extrabold text-[10px]">
                                {sub.department}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{sub.code}</td>
                            <td className="py-2.5 px-3 font-bold text-gray-900">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={adminEditSubName}
                                  onChange={(e) => setAdminEditSubName(e.target.value)}
                                  className="w-full p-1.5 bg-slate-50 border border-gray-300 rounded text-xs text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                />
                              ) : (
                                sub.name
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-gray-700">
                              {isEditing ? (
                                <select
                                  value={adminEditSubSem}
                                  onChange={(e) => setAdminEditSubSem(Number(e.target.value))}
                                  className="p-1 bg-slate-50 border border-gray-300 rounded text-xs font-bold text-gray-900"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                    <option key={sem} value={sem}>
                                      Sem {sem}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                `Sem ${sub.semester}`
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAdminSaveEditSubject(sub.code)}
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer"
                                    title="Save Subject"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAdminEditingSubCode(null)}
                                    className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAdminStartEditSubject(sub)}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all cursor-pointer border border-blue-200"
                                    title="Edit Subject"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdminDeleteSubject(sub.code)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer border border-red-200"
                                    title="Delete Subject"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COLLEGE-WIDE REPORTS & ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900">College Academic Reports & Analytics</h3>
              <p className="text-xs text-gray-500">Comprehensive performance stats across all engineering departments</p>
            </div>

            <button
              onClick={exportCollegeReportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT COLLEGE EXCEL / CSV</span>
            </button>
          </div>

          {/* Department Performance Matrix */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-md space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              DEPARTMENT PERFORMANCE COMPARISON
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2238] text-white font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3 rounded-l-lg">Dept Code</th>
                    <th className="py-2.5 px-3">Department Name</th>
                    <th className="py-2.5 px-3 text-center">HOD Assigned</th>
                    <th className="py-2.5 px-3 text-center">Staff Count</th>
                    <th className="py-2.5 px-3 text-center">Students</th>
                    <th className="py-2.5 px-3 text-center">Exams Published</th>
                    <th className="py-2.5 px-3 text-center rounded-r-lg">Pass Rate %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {departments.map((d, idx) => {
                    const deptHod = hods.find((h) => h.department === d.code);
                    const deptStaff = staffMembers.filter((s) => s.department === d.code).length;
                    const deptStudents = students.filter((s) => s.department === d.code);
                    const deptRecords = deptStudents.flatMap((s) => s.examRecords || []);
                    const passCount = deptRecords.filter((r) => r.overallStatus === 'PASS').length;
                    const passRate = deptRecords.length > 0 ? (passCount / deptRecords.length) * 100 : 0;

                    return (
                      <tr key={d.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="py-3 px-3 font-mono font-bold text-blue-700">{d.code}</td>
                        <td className="py-3 px-3 font-bold text-gray-900">{d.name}</td>
                        <td className="py-3 px-3 text-center">
                          {deptHod ? (
                            <span className="text-emerald-700 font-bold">{deptHod.name}</span>
                          ) : (
                            <span className="text-gray-400 italic">Not Assigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">{deptStaff}</td>
                        <td className="py-3 px-3 text-center font-bold text-purple-700">{deptStudents.length}</td>
                        <td className="py-3 px-3 text-center font-mono">{deptRecords.length}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-black px-2.5 py-1 rounded text-xs ${
                              passRate >= 75
                                ? 'bg-emerald-100 text-emerald-800'
                                : passRate >= 50
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {passRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL SEARCH & OVERVIEW */}
      {activeTab === 'global' && (
        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">All Students Directory</h3>
              <p className="text-xs text-gray-500">Quickly search and view any student across all college departments</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Reg No or Name..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-gray-700 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3 rounded-l-lg">Reg No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Dept</th>
                  <th className="py-2.5 px-3 text-center">Year / Sem</th>
                  <th className="py-2.5 px-3 text-center">Attendance</th>
                  <th className="py-2.5 px-3 text-center rounded-r-lg">Exam Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {students
                  .filter(
                    (s) =>
                      s.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.department.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((st, idx) => (
                    <tr key={st.registerNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{st.registerNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-900">{st.name}</td>
                      <td className="py-2.5 px-3 font-semibold">{st.department}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600">Yr {st.year} (Sem {st.currentSemester})</td>
                      <td className="py-2.5 px-3 text-center">
                        {st.attendance ? (
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              st.attendance.percentage >= 75
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {st.attendance.percentage.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">N/A</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-900">
                        {st.examRecords?.length || 0} Records
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
