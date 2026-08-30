import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Users,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  GraduationCap,
  Mail,
  Phone,
  Hash,
  User,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Student } from '../types';
import { DEPARTMENTS } from '../data/mockData';
import { saveStudentInFirestore, saveMultipleStudentsInFirestore } from '../lib/firestoreService';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDepartment?: string;
  defaultSemester?: number;
  defaultBatch?: string;
  lockSemester?: boolean;
  lockBatch?: boolean;
  onAddStudent: (newStudent: Student) => void;
  onAddMultipleStudents?: (newStudents: Student[]) => void;
  creatorRoleLabel?: string; // e.g. "HOD Portal" | "Faculty Portal" | "Class Counselor"
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  defaultDepartment = 'CSE',
  defaultSemester = 1,
  defaultBatch = '2023-2027',
  lockSemester = false,
  lockBatch = false,
  onAddStudent,
  onAddMultipleStudents,
  creatorRoleLabel = 'College Portal',
}) => {
  if (!isOpen) return null;

  const [entryMode, setEntryMode] = useState<'single' | 'bulk'>('single');

  const assignedDepartment = defaultDepartment || 'CSE';
  const deptInfo = DEPARTMENTS.find((d) => d.code === assignedDepartment) || {
    code: assignedDepartment,
    name: assignedDepartment,
  };

  // Single Student Form State
  const [name, setName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [dob, setDob] = useState('');
  const [semester, setSemester] = useState<number>(defaultSemester);
  const [year, setYear] = useState<1 | 2 | 3 | 4>(
    (Math.ceil(defaultSemester / 2) as 1 | 2 | 3 | 4) || 1
  );
  const [batch, setBatch] = useState(defaultBatch);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Bulk Import State
  const [csvText, setCsvText] = useState('');
  const [bulkSemester, setBulkSemester] = useState<number>(defaultSemester);
  const [bulkBatch, setBulkBatch] = useState(defaultBatch);

  // Status & Progress
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-sync semester with year
  const handleSemesterChange = (newSem: number) => {
    if (lockSemester) return;
    setSemester(newSem);
    const calculatedYear = Math.min(Math.max(Math.ceil(newSem / 2), 1), 4) as 1 | 2 | 3 | 4;
    setYear(calculatedYear);
  };

  const handleYearChange = (newYear: 1 | 2 | 3 | 4) => {
    if (lockSemester) return;
    setYear(newYear);
    // If current semester doesn't match the new year, set default semester for that year
    const minSem = (newYear - 1) * 2 + 1;
    const maxSem = newYear * 2;
    if (semester < minSem || semester > maxSem) {
      setSemester(minSem);
    }
  };

  // Auto-generate suggested email on RegNo change
  const handleRegNoChange = (val: string) => {
    const cleanVal = val.trim().toUpperCase();
    setRegisterNumber(cleanVal);
    if (!email || email.includes('@student.jayasakthi.edu.in')) {
      setEmail(cleanVal ? `${cleanVal.toLowerCase()}@student.jayasakthi.edu.in` : '');
    }
  };

  // Handle Single Student Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !registerNumber.trim() || !dob) {
      setStatusMessage({
        type: 'error',
        text: 'Please provide Student Name, Register Number, and Date of Birth.',
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    const totalClasses = 120;
    const attendedClasses = 110;

    const finalSemester = lockSemester ? defaultSemester : semester;
    const finalYear = lockSemester
      ? ((Math.min(Math.max(Math.ceil(defaultSemester / 2), 1), 4) as 1 | 2 | 3 | 4) || 1)
      : year;

    const newStudent: Student = {
      registerNumber: registerNumber.trim().toUpperCase(),
      name: name.trim(),
      dob,
      department: assignedDepartment,
      year: finalYear,
      currentSemester: finalSemester,
      batch: batch.trim() || defaultBatch || '2023-2027',
      email: email.trim() || `${registerNumber.trim().toLowerCase()}@student.jayasakthi.edu.in`,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      attendance: {
        totalClasses,
        attendedClasses,
        percentage: Math.round((attendedClasses / totalClasses) * 100),
        semester: finalSemester,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      examRecords: [],
    };

    try {
      await saveStudentInFirestore(newStudent);
      onAddStudent(newStudent);
      setStatusMessage({
        type: 'success',
        text: `Student ${newStudent.name} (${newStudent.registerNumber}) added successfully!`,
      });

      // Reset fields for next entry
      setName('');
      setRegisterNumber('');
      setDob('');
      setEmail('');
      setPhone('');
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save student record to Firestore.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Bulk Import
  const handleBulkSubmit = async () => {
    if (!csvText.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please paste student records in the text area below.',
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const lines = csvText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const parsedStudents: Student[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip header line if detected
        if (i === 0 && (line.toLowerCase().includes('reg') || line.toLowerCase().includes('register'))) {
          continue;
        }

        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        const regNo = parts[0]?.trim().toUpperCase();
        const studName = parts[1]?.trim();
        const studDob = parts[2]?.trim() || '2004-01-01';
        
        // Flexibly detect if semester is column 3 or column 4
        let studSem = lockSemester ? defaultSemester : bulkSemester;
        let studBatch = lockBatch ? defaultBatch : bulkBatch;
        let studEmail = '';
        let studPhone = '';

        if (!lockSemester) {
          if (parts[3] && !isNaN(Number(parts[3].trim())) && Number(parts[3].trim()) >= 1 && Number(parts[3].trim()) <= 8) {
            studSem = Number(parts[3].trim());
            studBatch = parts[4]?.trim() || bulkBatch;
            studEmail = parts[5]?.trim() || '';
            studPhone = parts[6]?.trim() || '';
          } else {
            studSem = parts[4] && !isNaN(Number(parts[4].trim())) ? Number(parts[4].trim()) : bulkSemester;
            studBatch = parts[5]?.trim() || bulkBatch;
            studEmail = parts[6]?.trim() || '';
            studPhone = parts[7]?.trim() || '';
          }
        } else {
          // If semester is locked (e.g. CC adding for their class only), ignore any other semester column
          studSem = defaultSemester;
          studBatch = (parts[3] && isNaN(Number(parts[3])) ? parts[3]?.trim() : parts[4]?.trim()) || defaultBatch || '2023-2027';
          studEmail = parts[5]?.trim() || '';
          studPhone = parts[6]?.trim() || '';
        }

        if (!studEmail && regNo) {
          studEmail = `${regNo.toLowerCase()}@student.jayasakthi.edu.in`;
        }

        if (regNo && studName) {
          const studYear = (Math.min(Math.max(Math.ceil(studSem / 2), 1), 4) as 1 | 2 | 3 | 4) || 1;
          parsedStudents.push({
            registerNumber: regNo,
            name: studName,
            dob: studDob,
            department: assignedDepartment,
            year: studYear,
            currentSemester: studSem,
            batch: studBatch,
            email: studEmail,
            ...(studPhone ? { phone: studPhone } : {}),
            attendance: {
              totalClasses: 120,
              attendedClasses: 110,
              percentage: 91.6,
              semester: studSem,
              lastUpdated: new Date().toISOString().split('T')[0],
            },
            examRecords: [],
          });
        }
      }

      if (parsedStudents.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'No valid student records could be parsed. Check the format: RegNo, Name, DOB (YYYY-MM-DD).',
        });
        setIsProcessing(false);
        return;
      }

      await saveMultipleStudentsInFirestore(parsedStudents);
      if (onAddMultipleStudents) {
        onAddMultipleStudents(parsedStudents);
      } else {
        parsedStudents.forEach((st) => onAddStudent(st));
      }

      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${parsedStudents.length} students into the database!`,
      });
      setCsvText('');
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to complete bulk student import.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B2238] via-slate-900 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-black shadow-inner">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  {creatorRoleLabel}
                </span>
                <span className="text-xs text-blue-200 font-medium">Student Registration</span>
              </div>
              <h3 className="text-lg font-black text-white">Enroll New Student</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUB-HEADER / MODE SELECTOR */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => setEntryMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                entryMode === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Single Entry</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('bulk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                entryMode === 'bulk'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk CSV / Excel</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Default Password is DOB (YYYY-MM-DD)
          </span>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-4">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
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

          {entryMode === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Register Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Register Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={registerNumber}
                      onChange={(e) => handleRegNoChange(e.target.value)}
                      placeholder="e.g. 311521104001"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Student Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aravind Kumar S"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Date of Birth (Password) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Date of Birth (DOB / Login Password) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Department (Auto-Assigned) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Department / Branch
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-3" />
                    <div className="w-full bg-blue-50/70 border border-blue-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-blue-950 flex items-center justify-between">
                      <span className="truncate">{assignedDepartment} - {deptInfo.name}</span>
                      <span className="text-[9px] font-black uppercase bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded ml-2 shrink-0">
                        Auto
                      </span>
                    </div>
                  </div>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Current Semester {lockSemester ? <span className="text-blue-600 font-normal">(Locked)</span> : <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    {lockSemester ? (
                      <div className="w-full bg-blue-50/70 border border-blue-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-blue-950 flex items-center justify-between">
                        <span>Semester {defaultSemester} (Year {Math.ceil(defaultSemester / 2)})</span>
                        <span className="text-[9px] font-black uppercase bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded ml-2 shrink-0">
                          CC Class Only
                        </span>
                      </div>
                    ) : (
                      <select
                        value={semester}
                        onChange={(e) => handleSemesterChange(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s} (Year {Math.ceil(s / 2)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Year & Batch */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Year</label>
                    {lockSemester ? (
                      <div className="w-full bg-blue-50/70 border border-blue-200 rounded-xl px-2.5 py-2 text-xs font-bold text-blue-950">
                        Year {Math.ceil(defaultSemester / 2)}
                      </div>
                    ) : (
                      <select
                        value={year}
                        onChange={(e) => handleYearChange(Number(e.target.value) as 1 | 2 | 3 | 4)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Batch</label>
                    <input
                      type="text"
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      placeholder="2023-2027"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Student Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@jayasakthi.edu.in"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Phone / Mobile (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>{isProcessing ? 'Saving to Database...' : 'Register Student'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* BULK IMPORT TAB */
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs space-y-1.5 text-blue-950">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                  <span>Bulk Student Import Guide (Department: {assignedDepartment})</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Paste rows copied from Microsoft Excel or CSV. All imported students will automatically be registered under <strong>{assignedDepartment} - {deptInfo.name}</strong>.
                </p>
                <code className="block bg-white p-2 rounded-lg text-[10px] font-mono border border-blue-200 text-slate-800">
                  RegisterNo, FullName, DOB (YYYY-MM-DD), [Semester], [Batch], [Email], [Phone]
                </code>
                <p className="text-[10px] text-blue-700 italic">
                  Example: 311523104001, Priya Dharshini, 2005-04-12, 6, 2023-2027
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Department (Auto-Assigned)
                  </label>
                  <div className="w-full bg-blue-50/70 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-950 flex items-center justify-between">
                    <span className="truncate">{assignedDepartment}</span>
                    <span className="text-[9px] font-black uppercase bg-blue-200/80 text-blue-900 px-1.5 py-0.5 rounded shrink-0">
                      Auto
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Default Semester {lockSemester ? <span className="text-blue-600 font-normal">(Locked)</span> : ''}
                  </label>
                  {lockSemester ? (
                    <div className="w-full bg-blue-50/70 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-950 flex items-center justify-between">
                      <span>Semester {defaultSemester}</span>
                      <span className="text-[9px] font-black uppercase bg-blue-200/80 text-blue-900 px-1.5 py-0.5 rounded shrink-0">
                        CC Class
                      </span>
                    </div>
                  ) : (
                    <select
                      value={bulkSemester}
                      onChange={(e) => setBulkSemester(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Default Batch
                  </label>
                  <input
                    type="text"
                    value={bulkBatch}
                    onChange={(e) => setBulkBatch(e.target.value)}
                    placeholder="2023-2027"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Paste CSV / Excel Data
                </label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="311523104001, Priya Dharshini, 2005-04-12, CSE, 6&#10;311523104002, Rajesh Kannan, 2005-08-20, CSE, 6"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={isProcessing || !csvText.trim()}
                  className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{isProcessing ? 'Importing...' : 'Import Students'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
