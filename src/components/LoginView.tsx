import React, { useState } from 'react';
import {
  User,
  Calendar,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Lock,
  UserCheck,
  Building2,
  KeyRound,
} from 'lucide-react';
import { CurrentUser, HODAccount, StaffMember, Student } from '../types';
import { StudentLogo } from './StudentLogo';

interface LoginViewProps {
  students: Student[];
  staffMembers: StaffMember[];
  hods: HODAccount[];
  onLoginSuccess: (user: CurrentUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  students,
  staffMembers,
  hods,
  onLoginSuccess,
}) => {
  const [loginType, setLoginType] = useState<'student' | 'staff' | 'exam_cell'>('student');

  // Student Login State
  const [regNo, setRegNo] = useState('');
  const [dob, setDob] = useState('');
  const [studentError, setStudentError] = useState('');

  // Staff / HOD Login State
  const [staffId, setStaffId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffError, setStaffError] = useState('');

  // Exam Cell Login State
  const [examCellId, setExamCellId] = useState('');
  const [examCellPassword, setExamCellPassword] = useState('');
  const [examCellError, setExamCellError] = useState('');

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    if (!regNo.trim()) {
      setStudentError('Please enter your Register Number');
      return;
    }
    if (!dob) {
      setStudentError('Please select your Date of Birth');
      return;
    }

    const matchedStudent = students.find(
      (s) =>
        s.registerNumber.trim().toUpperCase() === regNo.trim().toUpperCase() &&
        s.dob === dob
    );

    if (matchedStudent) {
      onLoginSuccess({
        role: 'student',
        id: matchedStudent.registerNumber,
        name: matchedStudent.name,
        department: matchedStudent.department,
        photoUrl: matchedStudent.photoUrl,
        studentData: matchedStudent,
      });
    } else {
      setStudentError('Invalid Register Number or Date of Birth. Please check your credentials.');
    }
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    const cleanId = staffId.trim().toUpperCase();
    if (!cleanId) {
      setStaffError('Please enter Staff ID or HOD ID');
      return;
    }
    if (!staffPassword) {
      setStaffError('Please enter Password');
      return;
    }

    // 1. Check HOD Accounts
    const matchedHod = hods.find(
      (h) =>
        h.hodId.toUpperCase() === cleanId &&
        h.password === staffPassword
    );
    if (matchedHod) {
      onLoginSuccess({
        role: 'hod',
        id: matchedHod.hodId,
        name: matchedHod.name,
        department: matchedHod.department,
        photoUrl: matchedHod.photoUrl,
        hodData: matchedHod,
      });
      return;
    }

    // 2. Check Staff Accounts
    const matchedStaff = staffMembers.find(
      (s) =>
        s.staffId.toUpperCase() === cleanId &&
        s.password === staffPassword
    );
    if (matchedStaff) {
      onLoginSuccess({
        role: 'staff',
        id: matchedStaff.staffId,
        name: matchedStaff.name,
        department: matchedStaff.department,
        photoUrl: matchedStaff.photoUrl,
        staffData: matchedStaff,
      });
      return;
    }

    setStaffError('Invalid Staff ID / HOD ID or Password. Please verify your credentials.');
  };

  const handleExamCellLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setExamCellError('');

    const cleanId = examCellId.trim().toUpperCase();
    if (!cleanId && !examCellPassword) {
      // Direct quick login
      onLoginSuccess({
        role: 'exam_cell',
        id: 'EXAM-CELL',
        name: 'Controller of Examinations (COE)',
        department: 'ALL',
      });
      return;
    }

    if (cleanId === 'EXAM-CELL' || cleanId === 'COE' || cleanId === 'ADMIN' || cleanId === 'KUMAR@1120') {
      onLoginSuccess({
        role: 'exam_cell',
        id: 'EXAM-CELL',
        name: 'Controller of Examinations (COE)',
        department: 'ALL',
      });
    } else {
      setExamCellError('Invalid Exam Cell Officer credentials. Use EXAM-CELL or click Quick Access.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      {/* CARD CONTAINER */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* TOP TAB SWITCHER */}
        <div className="grid grid-cols-3 bg-slate-100 p-1.5 border-b border-gray-200 gap-1">
          <button
            type="button"
            onClick={() => {
              setLoginType('student');
              setStudentError('');
            }}
            className={`py-2 px-1 text-[11px] font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'student'
                ? 'bg-white text-blue-900 shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            id="tab-student-login"
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>STUDENT</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType('staff');
              setStaffError('');
            }}
            className={`py-2 px-1 text-[11px] font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'staff'
                ? 'bg-[#0B2238] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            id="tab-staff-login"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>STAFF / HOD</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType('exam_cell');
              setExamCellError('');
            }}
            className={`py-2 px-1 text-[11px] font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'exam_cell'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            id="tab-examcell-login"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-950 shrink-0" />
            <span>EXAM CELL</span>
          </button>
        </div>

        {/* TOP BRAND HEADER */}
        <div className="bg-gradient-to-r from-[#0B2238] to-blue-900 text-white p-6 text-center">
          {loginType === 'student' ? (
            <div className="w-14 h-14 mx-auto mb-2.5 flex items-center justify-center">
              <StudentLogo size="custom" className="w-14 h-14" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-md">
              {loginType === 'staff' ? (
                <UserCheck className="w-6 h-6" />
              ) : (
                <Building2 className="w-6 h-6" />
              )}
            </div>
          )}
          <span className="text-[11px] font-bold tracking-widest text-amber-300 uppercase block mb-0.5">
            Jaya Sakthi Engineering College
          </span>
          <h3 className="text-xl font-black text-white">
            {loginType === 'student'
              ? 'Student Login'
              : loginType === 'staff'
              ? 'Faculty & HOD Portal'
              : 'Central Exam Cell Portal'}
          </h3>
        </div>

        {/* STUDENT LOGIN FORM */}
        {loginType === 'student' ? (
          <form onSubmit={handleStudentLogin} className="p-6 space-y-5">
            {studentError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{studentError}</span>
              </div>
            )}

            {/* Register Number Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Register Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="e.g. 112021104001"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white uppercase tracking-wider"
                  id="student-regno-input"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* DOB Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Date of Birth (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  id="student-dob-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="student-login-submit"
            >
              <span>VIEW STUDENT PORTAL</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : loginType === 'staff' ? (
          /* STAFF / HOD LOGIN FORM */
          <form onSubmit={handleStaffLogin} className="p-6 space-y-5">
            {staffError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{staffError}</span>
              </div>
            )}

            {/* Staff ID / HOD ID */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Staff ID / HOD ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <UserCheck className="w-4 h-4 text-amber-500" />
                </div>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. STF-CSE-01 or HOD-CSE"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B2238] focus:bg-white uppercase tracking-wider"
                  id="staff-id-input"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B2238] focus:bg-white"
                  id="staff-password-input"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#0B2238] hover:bg-slate-950 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="staff-login-submit"
            >
              <span>ACCESS FACULTY / HOD PORTAL</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* EXAM CELL LOGIN FORM */
          <form onSubmit={handleExamCellLogin} className="p-6 space-y-5">
            {examCellError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{examCellError}</span>
              </div>
            )}

            {/* Exam Cell ID */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Exam Cell Officer ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Building2 className="w-4 h-4 text-amber-500" />
                </div>
                <input
                  type="text"
                  value={examCellId}
                  onChange={(e) => setExamCellId(e.target.value)}
                  placeholder="e.g. EXAM-CELL or COE"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white uppercase tracking-wider"
                  id="examcell-id-input"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Access Key / Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={examCellPassword}
                  onChange={(e) => setExamCellPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  id="examcell-password-input"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="examcell-login-submit"
            >
              <span>ACCESS EXAM CELL</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
