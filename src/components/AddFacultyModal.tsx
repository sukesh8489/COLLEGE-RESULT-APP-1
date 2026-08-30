import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Building2,
  Mail,
  Phone,
  Lock,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { StaffMember, Subject, SubjectAssignment } from '../types';
import { DEPARTMENTS } from '../data/mockData';
import { saveStaffInFirestore, saveAssignmentInFirestore } from '../lib/firestoreService';

interface AddFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: string;
  existingStaff: StaffMember[];
  subjects?: Subject[];
  onAddStaff: (newStaff: StaffMember) => void;
  onAddAssignments?: (newAssignments: SubjectAssignment[]) => void;
}

const DESIGNATION_OPTIONS = [
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Senior Lecturer',
  'Head of Department',
  'Lab Instructor',
  'Visiting Faculty',
];

export const AddFacultyModal: React.FC<AddFacultyModalProps> = ({
  isOpen,
  onClose,
  department,
  existingStaff,
  subjects = [],
  onAddStaff,
  onAddAssignments,
}) => {
  if (!isOpen) return null;

  const deptInfo = DEPARTMENTS.find((d) => d.code === department) || {
    code: department,
    name: department,
  };

  // Form State
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [customDesignation, setCustomDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('staff@123');

  // Class Counselor State
  const [isCC, setIsCC] = useState(false);
  const [ccYear, setCcYear] = useState<number>(3);
  const [ccSemester, setCcSemester] = useState<number>(5);
  const [ccBatch, setCcBatch] = useState('2023-2027');

  // Subject Allocation State
  const [selectedSubjectCodes, setSelectedSubjectCodes] = useState<string[]>([]);

  // Status & Progress
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Department subjects available
  const departmentSubjects = subjects.filter((s) => s.department === department);

  const handleStaffIdChange = (val: string) => {
    const clean = val.trim().toUpperCase();
    setStaffId(clean);
    if (!email || email.includes('@jayasakthi.edu')) {
      setEmail(clean ? `${clean.toLowerCase()}@jayasakthi.edu.in` : '');
    }
  };

  const toggleSubjectSelection = (code: string) => {
    setSelectedSubjectCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim() || !name.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please provide both Staff ID and Faculty Name.',
      });
      return;
    }

    const cleanStaffId = staffId.trim().toUpperCase();

    // Check duplicate ID
    if (existingStaff.some((s) => s.staffId.toUpperCase() === cleanStaffId)) {
      setStatusMessage({
        type: 'error',
        text: `Faculty Member with Staff ID "${cleanStaffId}" already exists.`,
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const finalDesignation = designation === 'Other' ? customDesignation.trim() || 'Assistant Professor' : designation;

    const newStaff: StaffMember = {
      staffId: cleanStaffId,
      name: name.trim(),
      password: password.trim() || 'staff@123',
      email: email.trim() || `${cleanStaffId.toLowerCase()}@jayasakthi.edu.in`,
      department,
      designation: finalDesignation,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      isCC,
      ...(isCC
        ? {
            ccYear,
            ccSemester,
            ccBatch: ccBatch.trim() || '2023-2027',
          }
        : {}),
    };

    try {
      // 1. Save Staff to Firestore
      await saveStaffInFirestore(newStaff);
      onAddStaff(newStaff);

      // 2. Save any initially allocated subjects
      if (selectedSubjectCodes.length > 0 && onAddAssignments) {
        const newAssignments: SubjectAssignment[] = selectedSubjectCodes.map((code) => ({
          id: `ASGN-${cleanStaffId}-${code}`,
          staffId: cleanStaffId,
          subjectCode: code,
          semester: subjects.find((s) => s.code === code)?.semester || 1,
          department,
          academicYear: '2026-2027',
        }));

        for (const asgn of newAssignments) {
          await saveAssignmentInFirestore(asgn);
        }
        onAddAssignments(newAssignments);
      }

      setStatusMessage({
        type: 'success',
        text: `Faculty member ${newStaff.name} (${newStaff.staffId}) registered successfully!`,
      });

      // Reset form
      setStaffId('');
      setName('');
      setEmail('');
      setPhone('');
      setPassword('staff@123');
      setIsCC(false);
      setSelectedSubjectCodes([]);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save faculty record to Firestore.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden my-6">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                Faculty Registration
              </span>
              <h2 className="text-xl font-black text-white mt-1">Add Faculty Member</h2>
              <p className="text-xs text-slate-300">
                Register teaching staff and class counselors under <strong>{deptInfo.code} - {deptInfo.name}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* SECTION 1: BASIC DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Faculty Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Faculty Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. R. Karthikeyan"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Staff ID */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Staff / Faculty ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={staffId}
                onChange={(e) => handleStaffIdChange(e.target.value)}
                placeholder="e.g. CSE008 or STF105"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Department (Auto-Assigned) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Department
              </label>
              <div className="w-full bg-indigo-50/70 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-950 flex items-center justify-between">
                <span className="truncate flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  {department} - {deptInfo.name}
                </span>
                <span className="text-[9px] font-black uppercase bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded shrink-0">
                  Auto
                </span>
              </div>
            </div>

            {/* Designation */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Designation <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Award className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {DESIGNATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="Other">Other / Custom...</option>
                </select>
              </div>
            </div>

            {designation === 'Other' && (
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Custom Designation Title
                </label>
                <input
                  type="text"
                  value={customDesignation}
                  onChange={(e) => setCustomDesignation(e.target.value)}
                  placeholder="e.g. Adjunct Professor / Research Fellow"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@jayasakthi.edu.in"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Mobile / Phone */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Default Password */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Portal Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="staff@123"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Default password for initial login. Faculty can change this anytime from their portal.
              </p>
            </div>
          </div>

          {/* SECTION 2: CLASS COUNSELOR (CC) SETTING */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900">Class Counselor (CC) / Incharge</span>
                  <p className="text-[10px] text-slate-500">
                    Grant class counselor privileges to manage batch attendance & daily logs
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCC}
                  onChange={(e) => setIsCC(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {isCC && (
              <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Year</label>
                  <select
                    value={ccYear}
                    onChange={(e) => setCcYear(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Semester</label>
                  <select
                    value={ccSemester}
                    onChange={(e) => setCcSemester(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Sem {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Batch</label>
                  <input
                    type="text"
                    value={ccBatch}
                    onChange={(e) => setCcBatch(e.target.value)}
                    placeholder="2023-2027"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: INITIAL SUBJECT ALLOCATION (OPTIONAL) */}
          {departmentSubjects.length > 0 && (
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Allocate Department Subjects (Optional)</span>
                </span>
                <span className="text-[10px] text-indigo-700 font-bold">
                  {selectedSubjectCodes.length} selected
                </span>
              </div>
              <p className="text-[11px] text-indigo-800">
                Quickly assign teaching subjects now, or configure them later in the Subject Allocation tab.
              </p>
              <div className="max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {departmentSubjects.map((sub) => {
                  const isSelected = selectedSubjectCodes.includes(sub.code);
                  return (
                    <button
                      key={sub.code}
                      type="button"
                      onClick={() => toggleSubjectSelection(sub.code)}
                      className={`px-2.5 py-1.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/80'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="font-bold block truncate">[{sub.code}] {sub.name}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                          Sem {sub.semester} &bull; {sub.credits} Credits
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUBMIT ACTIONS */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'Saving Faculty...' : 'Register Faculty Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
