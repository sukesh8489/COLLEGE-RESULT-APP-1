import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Award,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FileSpreadsheet,
  Calculator,
  User,
  Lock,
  Unlock,
  Eye,
} from 'lucide-react';
import { EntryPermissionPolicy, ExamRecord, ExamType, Student, Subject, SubjectMark } from '../types';
import { checkMarksEntryPermission } from '../utils/permissionUtils';

interface AdminMarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  subjects: Subject[];
  onSaveStudent: (updatedStudent: Student) => Promise<void> | void;
  entryPolicy?: EntryPermissionPolicy;
  userRole?: 'hod' | 'staff' | 'exam_cell' | 'admin';
}

export const AdminMarksModal: React.FC<AdminMarksModalProps> = ({
  isOpen,
  onClose,
  student,
  subjects,
  onSaveStudent,
  entryPolicy,
  userRole = 'hod',
}) => {
  if (!isOpen || !student) return null;

  const [selectedSem, setSelectedSem] = useState<number>(student.currentSemester || 1);
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('CAT-1');
  const [academicYear, setAcademicYear] = useState<string>(student.batch || '2023-2027');
  const [subjectMarks, setSubjectMarks] = useState<SubjectMark[]>([]);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Permission Check: View-only by default for HOD & Staff unless Exam Cell has granted an active window rule or global access
  const marksPermission = useMemo(() => {
    if (userRole === 'exam_cell' || userRole === 'admin') {
      return {
        isAllowed: true,
        status: 'OPEN' as const,
        reason: 'Exam Cell administrator has full editing access.',
      };
    }
    return checkMarksEntryPermission(
      entryPolicy,
      selectedExamType,
      student.department,
      selectedSem,
      'ALL'
    );
  }, [entryPolicy, userRole, selectedExamType, student.department, selectedSem]);

  const canEdit = marksPermission.isAllowed;

  // Relevant subjects for this student's department and selected semester
  const deptSubjects = subjects.filter(
    (s) => s.department === student.department && s.semester === selectedSem
  );

  // Load existing exam record or populate default subject marks
  useEffect(() => {
    setSaveMsg(null);
    const existing = student.examRecords?.find(
      (r) => r.semester === selectedSem && r.examType === selectedExamType
    );

    const isCat = selectedExamType.startsWith('CAT');
    const defaultMax = isCat ? 50 : 100;

    if (existing && existing.marks && existing.marks.length > 0) {
      const marksWithMax = existing.marks.map((m) => ({
        ...m,
        maxMarks: isCat ? 50 : (m.maxMarks || defaultMax),
      }));
      setSubjectMarks(marksWithMax);
      setAcademicYear(existing.academicYear || student.batch || '2023-2027');
    } else {
      // Pre-fill from curriculum subjects for this sem & dept
      if (deptSubjects.length > 0) {
        const initial = deptSubjects.map((s) => ({
          subjectCode: s.code,
          subjectName: s.name,
          maxMarks: isCat ? 50 : (s.maxMarks || defaultMax),
          marksObtained: 0,
          status: 'PASS' as const,
        }));
        setSubjectMarks(initial);
      } else {
        // Default sample if no curriculum subject exists yet
        setSubjectMarks([
          {
            subjectCode: `${student.department}${selectedSem}01`,
            subjectName: 'Core Subject 1',
            maxMarks: defaultMax,
            marksObtained: 0,
            status: 'PASS',
          },
        ]);
      }
    }
  }, [student, selectedSem, selectedExamType, subjects]);

  const handleUpdateMark = (
    index: number,
    field: keyof SubjectMark,
    value: string | number
  ) => {
    setSubjectMarks((prev) => {
      const next = [...prev];
      const target = { ...next[index] };

      if (field === 'marksObtained') {
        const num = Math.max(0, Math.min(Number(value) || 0, target.maxMarks));
        target.marksObtained = num;
        target.status = num >= target.maxMarks * 0.5 ? 'PASS' : 'FAIL';
      } else if (field === 'maxMarks') {
        const num = Math.max(1, Number(value) || 100);
        target.maxMarks = num;
        target.status = target.marksObtained >= num * 0.5 ? 'PASS' : 'FAIL';
      } else if (field === 'status') {
        target.status = value as 'PASS' | 'FAIL' | 'ABSENT';
        if (value === 'ABSENT') {
          target.marksObtained = 0;
        }
      } else if (field === 'subjectCode' || field === 'subjectName') {
        (target[field] as string) = String(value);
      }

      next[index] = target;
      return next;
    });
  };

  const handleAddSubjectRow = () => {
    setSubjectMarks((prev) => [
      ...prev,
      {
        subjectCode: `${student.department}E${prev.length + 1}`,
        subjectName: 'New Elective / Subject',
        maxMarks: 100,
        marksObtained: 0,
        status: 'PASS',
      },
    ]);
  };

  const handleRemoveSubjectRow = (index: number) => {
    setSubjectMarks((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const totalObtained = subjectMarks.reduce((acc, curr) => acc + (curr.marksObtained || 0), 0);
  const maxTotal = subjectMarks.reduce((acc, curr) => acc + (curr.maxMarks || 100), 0);
  const percentage = maxTotal > 0 ? (totalObtained / maxTotal) * 100 : 0;
  const hasFailures = subjectMarks.some((m) => m.status === 'FAIL' || m.status === 'ABSENT');
  const overallStatus: 'PASS' | 'FAIL' = !hasFailures && percentage >= 50 ? 'PASS' : 'FAIL';

  const handleSaveMarks = async () => {
    if (subjectMarks.length === 0) {
      setSaveMsg({ type: 'error', text: 'Please add at least one subject to save marks.' });
      return;
    }

    setIsSaving(true);
    setSaveMsg(null);

    const examRecordId = `${student.registerNumber}-SEM${selectedSem}-${selectedExamType}`;

    const newRecord: ExamRecord = {
      id: examRecordId,
      registerNumber: student.registerNumber,
      semester: selectedSem,
      examType: selectedExamType,
      academicYear,
      marks: subjectMarks,
      totalObtained,
      maxTotal,
      percentage: Number(percentage.toFixed(2)),
      overallStatus,
      enteredByStaffId: 'EXAM_CELL',
      datePublished: new Date().toISOString(),
    };

    const existingRecords = student.examRecords || [];
    const otherRecords = existingRecords.filter(
      (r) => !(r.semester === selectedSem && r.examType === selectedExamType)
    );

    const updatedStudent: Student = {
      ...student,
      examRecords: [newRecord, ...otherRecords],
    };

    try {
      await onSaveStudent(updatedStudent);
      setSaveMsg({
        type: 'success',
        text: `Marks for ${selectedExamType} (Sem ${selectedSem}) successfully saved & published by Exam Cell!`,
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err?.message || 'Failed to save marks.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#0B2238] via-slate-900 to-blue-950 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center font-bold shadow-md">
              <Award className="w-6 h-6 text-[#0B2238]" />
            </div>
            <div>
              <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest block">
                EXAM CELL MARKS & ASSESSMENT CONTROLLER
              </span>
              <h3 className="text-lg font-black text-white">
                Academic Evaluation: {student.name}
              </h3>
              <p className="text-xs text-blue-200 font-mono">
                {student.registerNumber} • {student.department} • Year {student.year} (Sem {student.currentSemester})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* PERMISSION STATUS BANNER */}
          {canEdit ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-emerald-900">
                <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">Marks Entry Window Active: </span>
                  <span className="text-emerald-800">You have editing authorization for {selectedExamType} (Sem {selectedSem}).</span>
                </div>
              </div>
              {marksPermission.timeRemaining && (
                <span className="text-[11px] font-bold font-mono text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-lg shrink-0">
                  {marksPermission.timeRemaining}
                </span>
              )}
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-amber-950">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">View-Only Mode (Default): </span>
                  <span className="text-amber-800">
                    {marksPermission.reason || 'Marks editing is locked by default. Exam Cell Admin permission is required.'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-lg shrink-0 border border-amber-200 flex items-center gap-1.5 self-start sm:self-auto">
                <Eye className="w-3.5 h-3.5" />
                <span>Read-Only View</span>
              </span>
            </div>
          )}

          {saveMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                saveMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {saveMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{saveMsg.text}</span>
            </div>
          )}

          {/* CONTROLS BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Semester
              </label>
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem} {sem === student.currentSemester ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Examination Type
              </label>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value as ExamType)}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="CAT-1">CAT-1 (Continuous Assessment Test 1)</option>
                <option value="CAT-2">CAT-2 (Continuous Assessment Test 2)</option>
                <option value="CAT-3">CAT-3 (Continuous Assessment Test 3)</option>
                <option value="M-1">Model-1 (Model Examination 1)</option>
                <option value="M-2">Model-2 (Model Examination 2)</option>
                <option value="M-3">Model-3 (Model Examination 3)</option>
                <option value="MODEL_EXAM">Model Examination</option>
                <option value="SEMESTER">Anna Univ / Semester Exam</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Batch / Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                disabled={!canEdit}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g. 2023-2027"
                className={`w-full p-2 rounded-xl font-semibold border ${
                  !canEdit
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600'
                }`}
              />
            </div>
          </div>

          {/* MARKS ENTRY TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Subject Marks & Grade Register</span>
                <span className="text-[11px] font-normal text-slate-500">({subjectMarks.length} Courses)</span>
              </h4>

              {canEdit && (
                <button
                  type="button"
                  onClick={handleAddSubjectRow}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[10px]">
                    <th className="p-3">Subject Code</th>
                    <th className="p-3">Subject Title</th>
                    <th className="p-3 text-center w-24">Max Marks</th>
                    <th className="p-3 text-center w-28">Obtained</th>
                    <th className="p-3 text-center w-24">Status</th>
                    {canEdit && <th className="p-3 text-center w-12">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectMarks.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="p-6 text-center text-slate-400 italic">
                        No subject marks recorded for Semester {selectedSem} ({selectedExamType}).
                      </td>
                    </tr>
                  ) : (
                    subjectMarks.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2.5">
                          {canEdit ? (
                            <input
                              type="text"
                              value={row.subjectCode}
                              onChange={(e) => handleUpdateMark(idx, 'subjectCode', e.target.value.toUpperCase())}
                              className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 uppercase focus:bg-white focus:ring-1 focus:ring-blue-600"
                              placeholder="e.g. CS8691"
                            />
                          ) : (
                            <span className="font-mono font-bold text-slate-900 px-1">{row.subjectCode}</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {canEdit ? (
                            <input
                              type="text"
                              value={row.subjectName}
                              onChange={(e) => handleUpdateMark(idx, 'subjectName', e.target.value)}
                              className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-600"
                              placeholder="Subject Title"
                            />
                          ) : (
                            <span className="font-medium text-slate-800 px-1">{row.subjectName}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {canEdit ? (
                            <input
                              type="number"
                              value={row.maxMarks}
                              onChange={(e) => handleUpdateMark(idx, 'maxMarks', e.target.value)}
                              min="1"
                              max="100"
                              className="w-20 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-600"
                            />
                          ) : (
                            <span className="font-bold text-slate-600">{row.maxMarks}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {canEdit ? (
                            <input
                              type="number"
                              value={row.marksObtained}
                              onChange={(e) => handleUpdateMark(idx, 'marksObtained', e.target.value)}
                              min="0"
                              max={row.maxMarks}
                              disabled={row.status === 'ABSENT'}
                              className={`w-20 p-1.5 border rounded-lg text-center font-black ${
                                row.status === 'ABSENT'
                                  ? 'bg-slate-100 text-slate-400 border-slate-200'
                                  : row.marksObtained >= row.maxMarks * 0.5
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-black'
                                  : 'bg-rose-50 text-rose-900 border-rose-300 font-black'
                              }`}
                            />
                          ) : (
                            <span
                              className={`inline-block px-3 py-1 rounded-lg font-black text-xs ${
                                row.status === 'ABSENT'
                                  ? 'bg-slate-100 text-slate-500'
                                  : row.marksObtained >= row.maxMarks * 0.5
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {row.status === 'ABSENT' ? 'ABS' : row.marksObtained}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {canEdit ? (
                            <select
                              value={row.status}
                              onChange={(e) => handleUpdateMark(idx, 'status', e.target.value)}
                              className={`p-1.5 rounded-lg font-bold text-[11px] border cursor-pointer ${
                                row.status === 'PASS'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : row.status === 'FAIL'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                            >
                              <option value="PASS">PASS</option>
                              <option value="FAIL">FAIL</option>
                              <option value="ABSENT">ABSENT</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                row.status === 'PASS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.status === 'FAIL'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {row.status}
                            </span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSubjectRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove subject"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LIVE SUMMARY BANNER */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-6 text-center sm:text-left">
              <div>
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">
                  Total Marks
                </span>
                <span className="text-xl font-black text-white">
                  {totalObtained} / {maxTotal}
                </span>
              </div>
              <div className="border-l border-white/20 pl-6">
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">
                  Aggregate Percentage
                </span>
                <span className="text-xl font-black text-amber-300">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="border-l border-white/20 pl-6">
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">
                  Result Status
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-md font-black text-xs ${
                    overallStatus === 'PASS'
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {overallStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {canEdit ? 'Cancel' : 'Close View'}
              </button>
              {canEdit ? (
                <button
                  type="button"
                  onClick={handleSaveMarks}
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>{isSaving ? 'Saving...' : 'Save & Publish Result'}</span>
                </button>
              ) : (
                <div className="px-3.5 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-xl font-bold text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editing Locked (View Only)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
