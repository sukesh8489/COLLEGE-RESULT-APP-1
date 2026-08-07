import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  UserPlus,
  PlusCircle,
  Trash2,
  BarChart3,
  Download,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  CheckSquare,
  Sparkles,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { CurrentUser, HODAccount, StaffMember, Student, Subject, SubjectAssignment } from '../types';

interface HodPortalProps {
  currentUser: CurrentUser;
  staffMembers: StaffMember[];
  setStaffMembers: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  subjectAssignments: SubjectAssignment[];
  setSubjectAssignments: React.Dispatch<React.SetStateAction<SubjectAssignment[]>>;
  students: Student[];
  onLogout: () => void;
}

export const HodPortal: React.FC<HodPortalProps> = ({
  currentUser,
  staffMembers,
  setStaffMembers,
  subjects,
  setSubjects,
  subjectAssignments,
  setSubjectAssignments,
  students,
}) => {
  const deptCode = currentUser.department || 'CSE';

  const [activeTab, setActiveTab] = useState<'staff' | 'subjects' | 'assignments' | 'reports'>('staff');

  // Filter department specific data
  const deptStaff = staffMembers.filter((s) => s.department === deptCode);
  const deptSubjects = subjects.filter((s) => s.department === deptCode);
  const deptStudents = students.filter((s) => s.department === deptCode);

  // Add Staff State
  const [newStaffId, setNewStaffId] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('fac123');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffDesig, setNewStaffDesig] = useState('Assistant Professor');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [staffMsg, setStaffMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Subject State
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubSem, setNewSubSem] = useState<number>(6);
  const [subMsg, setSubMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Subject State
  const [editingSubjectCode, setEditingSubjectCode] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubSem, setEditSubSem] = useState<number>(1);

  // Subject Assignment State
  const [assignSubCode, setAssignSubCode] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignMsg, setAssignMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle Add Staff
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffMsg(null);

    const staffId = newStaffId.trim().toUpperCase();
    const name = newStaffName.trim();

    if (!staffId || !name) {
      setStaffMsg({ type: 'error', text: 'Staff ID and Name are required.' });
      return;
    }

    if (staffMembers.some((s) => s.staffId === staffId)) {
      setStaffMsg({ type: 'error', text: `Staff ID "${staffId}" already exists.` });
      return;
    }

    const newStaff: StaffMember = {
      staffId,
      name,
      password: newStaffPass,
      department: deptCode,
      email: newStaffEmail.trim() || `${staffId.toLowerCase()}@jayasakthi.edu`,
      designation: newStaffDesig,
      phone: newStaffPhone.trim(),
    };

    setStaffMembers((prev) => [...prev, newStaff]);
    setNewStaffId('');
    setNewStaffName('');
    setNewStaffPass('fac123');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setStaffMsg({ type: 'success', text: `Staff ${name} (${staffId}) added to ${deptCode}!` });
  };

  // Delete Staff
  const handleDeleteStaff = (staffId: string) => {
    if (confirm(`Remove staff member ${staffId} from ${deptCode}?`)) {
      setStaffMembers((prev) => prev.filter((s) => s.staffId !== staffId));
      setSubjectAssignments((prev) => prev.filter((a) => a.staffId !== staffId));
    }
  };

  // Handle Add Subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setSubMsg(null);

    const code = newSubCode.trim().toUpperCase();
    const name = newSubName.trim();

    if (!code || !name) {
      setSubMsg({ type: 'error', text: 'Subject code and name are required.' });
      return;
    }

    if (subjects.some((s) => s.code === code)) {
      setSubMsg({ type: 'error', text: `Subject code "${code}" already exists.` });
      return;
    }

    const newSubject: Subject = {
      code,
      name,
      department: deptCode,
      semester: newSubSem,
      maxMarks: 100,
    };

    setSubjects((prev) => [...prev, newSubject]);
    setNewSubCode('');
    setNewSubName('');
    setSubMsg({ type: 'success', text: `Subject ${name} (${code}) added to Semester ${newSubSem}!` });
  };

  // Delete Subject
  const handleDeleteSubject = (subCode: string) => {
    const subToDelete = subjects.find((s) => s.code === subCode);
    const subLabel = subToDelete ? `"${subToDelete.name}" (${subCode})` : subCode;
    if (confirm(`Are you sure you want to delete subject ${subLabel}? This will also remove any staff assignments for this subject.`)) {
      setSubjects((prev) => prev.filter((s) => s.code !== subCode));
      setSubjectAssignments((prev) => prev.filter((a) => a.subjectCode !== subCode));
      setSubMsg({ type: 'success', text: `Subject ${subCode} deleted successfully.` });
    }
  };

  // Start Edit Subject
  const handleStartEditSubject = (sub: Subject) => {
    setEditingSubjectCode(sub.code);
    setEditSubName(sub.name);
    setEditSubSem(sub.semester);
  };

  // Save Edit Subject
  const handleSaveEditSubject = (subCode: string) => {
    const name = editSubName.trim();
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
            semester: editSubSem,
          };
        }
        return s;
      })
    );

    setSubMsg({ type: 'success', text: `Subject ${subCode} updated successfully!` });
    setEditingSubjectCode(null);
  };

  // Assign Subject to Staff
  const handleAssignSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignMsg(null);

    if (!assignSubCode || !assignStaffId) {
      setAssignMsg({ type: 'error', text: 'Select both subject and staff member.' });
      return;
    }

    const assignmentId = `${deptCode}-${assignSubCode}-${assignStaffId}`;
    if (subjectAssignments.some((a) => a.subjectCode === assignSubCode && a.staffId === assignStaffId)) {
      setAssignMsg({ type: 'error', text: 'Subject already assigned to this staff member.' });
      return;
    }

    const newAssignment: SubjectAssignment = {
      id: assignmentId,
      subjectCode: assignSubCode,
      staffId: assignStaffId,
      department: deptCode,
    };

    setSubjectAssignments((prev) => [...prev, newAssignment]);
    setAssignMsg({ type: 'success', text: `Assigned subject ${assignSubCode} to ${assignStaffId}` });
  };

  // Delete Assignment
  const handleDeleteAssignment = (id: string) => {
    setSubjectAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  // Department Pass Rate
  const deptExamRecords = deptStudents.flatMap((s) => s.examRecords || []);
  const passedCount = deptExamRecords.filter((r) => r.overallStatus === 'PASS').length;
  const deptPassRate = deptExamRecords.length > 0 ? (passedCount / deptExamRecords.length) * 100 : 0;

  // Export Department Report
  const exportDeptCSV = () => {
    if (deptStudents.length === 0) {
      alert('No student records in department.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Register Number,Student Name,Semester,Batch,Attendance %,Exams Taken,Pass Rate %\n';

    deptStudents.forEach((st) => {
      const records = st.examRecords || [];
      const passC = records.filter((r) => r.overallStatus === 'PASS').length;
      const rate = records.length > 0 ? ((passC / records.length) * 100).toFixed(1) : '0.0';
      const att = st.attendance ? `${st.attendance.percentage.toFixed(1)}%` : 'N/A';

      csvContent += `"${st.registerNumber}","${st.name}",${st.currentSemester},"${st.batch}","${att}",${records.length},"${rate}%"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${deptCode}_department_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* HOD HERO BANNER */}
      <div className="bg-gradient-to-r from-[#0B2238] via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-blue-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center font-bold shadow-lg">
              <ShieldCheck className="w-7 h-7 text-[#0B2238]" />
            </div>
            <div>
              <span className="text-xs text-amber-300 font-extrabold uppercase tracking-widest block">
                HEAD OF DEPARTMENT (HOD)
              </span>
              <h2 className="text-2xl font-black text-white">{currentUser.name}</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Managing <span className="font-bold text-amber-300">{deptCode}</span> Department Staff, Subjects & Reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono">
            <span className="text-amber-300 font-bold">Dept Code:</span>
            <span className="text-white font-black">{deptCode}</span>
          </div>
        </div>
      </div>

      {/* DEPARTMENT QUICK METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">FACULTY STAFF</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">{deptStaff.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">SUBJECTS</span>
          <span className="text-2xl font-black text-blue-900 block mt-1">{deptSubjects.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">DEPT STUDENTS</span>
          <span className="text-2xl font-black text-purple-600 block mt-1">{deptStudents.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">DEPT PASS RATE</span>
          <span className="text-2xl font-black text-indigo-700 block mt-1">{deptPassRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('staff')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>DEPARTMENT STAFF ({deptStaff.length})</span>
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
          <span>SUBJECTS ({deptSubjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'assignments'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-amber-400" />
          <span>SUBJECT ASSIGNMENTS</span>
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
          <span>DEPARTMENT REPORTS</span>
        </button>
      </div>

      {/* TAB 1: ADD & MANAGE STAFF */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Staff Form */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-md h-fit space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-gray-900 text-sm">Add Staff to {deptCode}</h3>
            </div>

            {staffMsg && (
              <div
                className={`text-xs p-3 rounded-xl ${
                  staffMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {staffMsg.text}
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Staff ID / Username
                </label>
                <input
                  type="text"
                  value={newStaffId}
                  onChange={(e) => setNewStaffId(e.target.value)}
                  placeholder="e.g. FAC_CSE01"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-mono uppercase text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Full Name (e.g. Dr. V. Ramesh Kumar)
                </label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Dr. V. RAMESH KUMAR"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Designation
                </label>
                <select
                  value={newStaffDesig}
                  onChange={(e) => setNewStaffDesig(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <input
                  type="text"
                  value={newStaffPass}
                  onChange={(e) => setNewStaffPass(e.target.value)}
                  placeholder="fac123"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Email & Phone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="ramesh@jayasakthi.edu"
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow transition-all cursor-pointer"
              >
                + ADD STAFF MEMBER
              </button>
            </form>
          </div>

          {/* Staff List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {deptCode} DEPARTMENT FACULTY MEMBERS ({deptStaff.length})
            </h3>

            {deptStaff.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-semibold">No faculty members added to {deptCode} yet.</p>
                <p className="text-[11px] text-gray-400">Use the form on the left to register staff members.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {deptStaff.map((st) => (
                  <div
                    key={st.staffId}
                    className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm">{st.name}</h4>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold">
                          {st.staffId}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 font-bold">{st.designation}</p>
                      <p className="text-[11px] text-gray-500">{st.email} {st.phone ? `• ${st.phone}` : ''}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400 bg-slate-50 px-2 py-1 rounded border border-gray-200">
                        Pass: {st.password}
                      </span>
                      <button
                        onClick={() => handleDeleteStaff(st.staffId)}
                        className="p-1.5 text-gray-300 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Remove Staff"
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

      {/* TAB 2: SUBJECTS MANAGEMENT */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Subject Form */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-md h-fit space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-gray-900 text-sm">Add Subject to {deptCode}</h3>
            </div>

            {subMsg && (
              <div
                className={`text-xs p-3 rounded-xl ${
                  subMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {subMsg.text}
              </div>
            )}

            <form onSubmit={handleAddSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
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
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Internet Programming"
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Semester
                </label>
                <select
                  value={newSubSem}
                  onChange={(e) => setNewSubSem(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-gray-900"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
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
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {deptCode} CURRICULUM SUBJECTS ({deptSubjects.length})
            </h3>

            {deptSubjects.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center space-y-2">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-600">No subjects added for {deptCode} yet.</p>
                <p className="text-[11px] text-gray-400">Use the form on the left to add subjects to the curriculum.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0B2238] text-white font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3 rounded-l-lg">Sub Code</th>
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3 text-center">Semester</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {deptSubjects.map((sub, idx) => {
                      const isEditing = editingSubjectCode === sub.code;
                      return (
                        <tr key={sub.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{sub.code}</td>
                          <td className="py-2.5 px-3 font-bold text-gray-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editSubName}
                                onChange={(e) => setEditSubName(e.target.value)}
                                className="w-full p-1.5 bg-slate-50 border border-gray-300 rounded text-xs text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                              />
                            ) : (
                              sub.name
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-gray-700">
                            {isEditing ? (
                              <select
                                value={editSubSem}
                                onChange={(e) => setEditSubSem(Number(e.target.value))}
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
                                  onClick={() => handleSaveEditSubject(sub.code)}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer"
                                  title="Save Subject"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSubjectCode(null)}
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
                                  onClick={() => handleStartEditSubject(sub)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all cursor-pointer border border-blue-200"
                                  title="Edit Subject"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubject(sub.code)}
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

      {/* TAB 3: SUBJECT ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignment Form */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-md h-fit space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <CheckSquare className="w-5 h-5 text-purple-600" />
              <h3 className="font-extrabold text-gray-900 text-sm">Assign Subject to Staff</h3>
            </div>

            {assignMsg && (
              <div
                className={`text-xs p-3 rounded-xl ${
                  assignMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {assignMsg.text}
              </div>
            )}

            <form onSubmit={handleAssignSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Select Subject
                </label>
                <select
                  value={assignSubCode}
                  onChange={(e) => setAssignSubCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="">-- Choose Subject --</option>
                  {deptSubjects.map((sub) => (
                    <option key={sub.code} value={sub.code}>
                      {sub.code} - {sub.name} (Sem {sub.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Assign to Staff Member
                </label>
                <select
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {deptStaff.map((st) => (
                    <option key={st.staffId} value={st.staffId}>
                      {st.name} ({st.staffId})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow transition-all cursor-pointer"
              >
                + CONFIRM SUBJECT ASSIGNMENT
              </button>
            </form>
          </div>

          {/* Assignments List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              CURRENT STAFF SUBJECT ALLOCATIONS
            </h3>

            {subjectAssignments.filter((a) => a.department === deptCode).length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
                <CheckSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-semibold">No active subject assignments yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subjectAssignments
                  .filter((a) => a.department === deptCode)
                  .map((asgn) => {
                    const sub = deptSubjects.find((s) => s.code === asgn.subjectCode);
                    const st = deptStaff.find((s) => s.staffId === asgn.staffId);

                    return (
                      <div
                        key={asgn.id}
                        className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                              {asgn.subjectCode}
                            </span>
                            <h4 className="font-bold text-gray-900 text-xs">{sub ? sub.name : 'Subject'}</h4>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Assigned to: <span className="font-bold text-blue-900">{st ? st.name : asgn.staffId}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteAssignment(asgn.id)}
                          className="p-1.5 text-gray-300 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Remove Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DEPARTMENT REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">{deptCode} Department Academic Report</h3>
              <p className="text-xs text-gray-500">Overview of students, attendance percentage, and internal marks</p>
            </div>

            <button
              onClick={exportDeptCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT {deptCode} CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2238] text-white font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3 rounded-l-lg">Reg No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 text-center">Semester</th>
                    <th className="py-2.5 px-3 text-center">Batch</th>
                    <th className="py-2.5 px-3 text-center">Attendance %</th>
                    <th className="py-2.5 px-3 text-center rounded-r-lg">Exam Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {deptStudents.map((st, idx) => (
                    <tr key={st.registerNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{st.registerNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-900">{st.name}</td>
                      <td className="py-2.5 px-3 text-center font-bold">Sem {st.currentSemester}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{st.batch}</td>
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
                          <span className="text-gray-400 text-[10px]">Not Entered</span>
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
        </div>
      )}
    </div>
  );
};
