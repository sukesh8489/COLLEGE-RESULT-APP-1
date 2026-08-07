import React, { useState } from 'react';
import { User, ShieldCheck, Lock, Calendar, Key, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { CurrentUser, HODAccount, StaffMember, Student } from '../types';

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
  const [loginType, setLoginType] = useState<'student' | 'staff' | 'admin'>('student');

  // Student Login State
  const [regNo, setRegNo] = useState('');
  const [dob, setDob] = useState('');
  const [studentError, setStudentError] = useState('');

  // Staff / HOD Login State
  const [staffLoginId, setStaffLoginId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffError, setStaffError] = useState('');

  // Admin Login State
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    if (!regNo.trim()) {
      setStudentError('Please enter Register Number');
      return;
    }
    if (!dob) {
      setStudentError('Please select Date of Birth');
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
        studentData: matchedStudent,
      });
    } else {
      setStudentError('Invalid Register Number or Date of Birth. Please check your credentials.');
    }
  };

  const handleStaffHodLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    const cleanId = staffLoginId.trim().toUpperCase();

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
      (h) => h.hodId.trim().toUpperCase() === cleanId && h.password === staffPassword
    );
    if (matchedHod) {
      setStaffError('');
      onLoginSuccess({
        role: 'hod',
        id: matchedHod.hodId,
        name: matchedHod.name,
        department: matchedHod.department,
        hodData: matchedHod,
      });
      return;
    }

    // 2. Check Staff Members
    const matchedStaff = staffMembers.find(
      (s) => s.staffId.trim().toUpperCase() === cleanId && s.password === staffPassword
    );
    if (matchedStaff) {
      setStaffError('');
      onLoginSuccess({
        role: 'staff',
        id: matchedStaff.staffId,
        name: matchedStaff.name,
        department: matchedStaff.department,
        staffData: matchedStaff,
      });
      return;
    }

    setStaffError('Invalid Staff ID / HOD ID or Password. Please check with your HOD / Administrator.');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const cleanId = adminId.trim().toUpperCase();

    if (!cleanId) {
      setAdminError('Please enter Admin Username');
      return;
    }
    if (!adminPassword) {
      setAdminError('Please enter Admin Password');
      return;
    }

    // Check Admin Credentials
    if (
      (cleanId === 'ADMIN' || cleanId === 'KUMAR@1120' || cleanId === 'MAINADMIN') &&
      adminPassword === '1979@jsec_1120'
    ) {
      setAdminError('');
      onLoginSuccess({
        role: 'admin',
        id: 'ADMIN',
        name: 'Main Administrator',
      });
      return;
    }

    setAdminError('Invalid Admin Username or Password.');
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      {/* CARD CONTAINER */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* TOP TAB SWITCHER - 3 SEPARATE TABS */}
        <div className="grid grid-cols-3 bg-slate-100 p-1.5 border-b border-gray-200 gap-1">
          <button
            type="button"
            onClick={() => {
              setLoginType('student');
              setStudentError('');
            }}
            className={`py-2.5 px-2 text-[11px] font-extrabold rounded-2xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'student'
                ? 'bg-white text-blue-900 shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            id="tab-student-login"
          >
            <User className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">STUDENT</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType('staff');
              setStaffError('');
            }}
            className={`py-2.5 px-2 text-[11px] font-extrabold rounded-2xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'staff'
                ? 'bg-[#0B2238] text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            id="tab-staff-login"
          >
            <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">STAFF / HOD</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType('admin');
              setAdminError('');
            }}
            className={`py-2.5 px-2 text-[11px] font-extrabold rounded-2xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
              loginType === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            id="tab-admin-login"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="truncate">ADMIN</span>
          </button>
        </div>

        {/* STUDENT LOGIN FORM */}
        {loginType === 'student' && (
          <form onSubmit={handleStudentLogin} className="p-6 space-y-5">
            <div className="text-center pb-2 border-b border-gray-100">
              <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase block mb-0.5">
                STUDENT ACADEMIC PORTAL
              </span>
              <h3 className="text-lg font-black text-gray-900">
                View Examination Results & Attendance
              </h3>
            </div>

            {studentError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
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
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="Enter Register Number"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white uppercase"
                  id="student-regno-input"
                />
              </div>
            </div>

            {/* Date of Birth Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Date of Birth
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  id="student-dob-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="student-login-submit"
            >
              <span>ACCESS STUDENT PORTAL</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STAFF / HOD LOGIN FORM */}
        {loginType === 'staff' && (
          <form onSubmit={handleStaffHodLogin} className="p-6 space-y-5">
            <div className="text-center pb-2 border-b border-gray-100">
              <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase block mb-0.5">
                ACADEMIC FACULTY & DEPARTMENTS
              </span>
              <h3 className="text-lg font-black text-gray-900">
                Staff & HOD Login
              </h3>
            </div>

            {staffError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{staffError}</span>
              </div>
            )}

            {/* Staff / HOD ID */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Staff ID / HOD ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={staffLoginId}
                  onChange={(e) => setStaffLoginId(e.target.value)}
                  placeholder="Enter Staff ID or HOD ID"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white uppercase"
                  id="staff-id-input"
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
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  id="staff-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#0B2238] hover:bg-slate-900 text-amber-400 font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400/20"
              id="staff-login-submit"
            >
              <span>SIGN IN TO PORTAL</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* SEPARATE ADMIN PORTAL LOGIN FORM */}
        {loginType === 'admin' && (
          <form onSubmit={handleAdminLogin} className="p-6 space-y-5">
            <div className="text-center pb-2 border-b border-gray-100">
              <span className="text-[10px] font-bold tracking-widest text-amber-600 uppercase block mb-0.5">
                EXECUTIVE ADMINISTRATION
              </span>
              <h3 className="text-lg font-black text-gray-900">
                Main Admin Portal
              </h3>
            </div>

            {adminError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{adminError}</span>
              </div>
            )}

            {/* Admin Username */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Admin Username / ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Enter Admin Username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white uppercase"
                  id="admin-id-input"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  id="admin-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="admin-login-submit"
            >
              <span>ACCESS ADMIN PORTAL</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
