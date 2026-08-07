import React, { useState } from 'react';
import {
  UserPlus,
  FileCheck,
  Search,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Filter,
  Users,
  Download,
  CalendarCheck,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AttendanceRecord,
  CurrentUser,
  ExamRecord,
  ExamType,
  Student,
  Subject,
  SubjectMark,
} from '../types';

// Auto Grade Helper
export const calculateGradeAndStatus = (obtained: number, max: number = 100) => {
  const pct = (obtained / max) * 100;
  if (pct >= 90) return { grade: 'O', status: 'PASS' as const };
  if (pct >= 80) return { grade: 'A+', status: 'PASS' as const };
  if (pct >= 70) return { grade: 'A', status: 'PASS' as const };
  if (pct >= 60) return { grade: 'B+', status: 'PASS' as const };
  if (pct >= 50) return { grade: 'B', status: 'PASS' as const };
  return { grade: 'U / RA', status: 'FAIL' as const };
};

interface StaffPortalProps {
  currentUser: CurrentUser;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  subjects: Subject[];
  onLogout: () => void;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({
  currentUser,
  students,
  setStudents,
  subjects,
}) => {
  const staffDept = currentUser.department || 'CSE';

  const [activeTab, setActiveTab] = useState<'marks' | 'attendance' | 'students' | 'export'>('marks');

  // Filter department subjects and students
  const deptSubjects = subjects.filter((s) => s.department === staffDept);

  // Marks Entry Form State
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('IAT-1');
  const [selectedSemester, setSelectedSemester] = useState<number>(6);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('');
  const [marksState, setMarksState] = useState<{ [regNo: string]: number }>({});
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  // Attendance Entry Form State
  const [attendanceSem, setAttendanceSem] = useState<number>(6);
  const [totalClassesConducted, setTotalClassesConducted] = useState<number>(60);
  const [attendanceState, setAttendanceState] = useState<{ [regNo: string]: number }>({});
  const [attendanceMsg, setAttendanceMsg] = useState<string | null>(null);

  // Add / Edit Student Form State
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingRegNo, setEditingRegNo] = useState<string | null>(null);
  const [studentRegNo, setStudentRegNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentDob, setStudentDob] = useState('');
  const [studentYear, setStudentYear] = useState<1 | 2 | 3 | 4>(3);
  const [studentSem, setStudentSem] = useState<number>(6);
  const [studentBatch, setStudentBatch] = useState('2021-2025');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentError, setStudentError] = useState('');

  // Filtered students for current selected semester & department
  const filteredStudents = students.filter(
    (s) => s.department === staffDept && s.currentSemester === selectedSemester
  );

  // Real-time Search and Filter State for Marks Navigation
  const [marksSearchQuery, setMarksSearchQuery] = useState('');
  const [marksFilterType, setMarksFilterType] = useState<'all' | 'pending' | 'pass' | 'fail'>('all');

  // Filtered students matching search & filter criteria
  const displayedMarksStudents = filteredStudents.filter((st) => {
    const query = marksSearchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      st.name.toLowerCase().includes(query) ||
      st.registerNumber.toLowerCase().includes(query);

    if (!matchesQuery) return false;

    const currentVal =
      marksState[st.registerNumber] !== undefined
        ? marksState[st.registerNumber]
        : st.examRecords
            ?.find((r) => r.semester === selectedSemester && r.examType === selectedExamType)
            ?.marks.find((m) => m.subjectCode === selectedSubjectCode)?.marksObtained;

    if (marksFilterType === 'pending') {
      return currentVal === undefined || currentVal === null || currentVal === '';
    }
    if (marksFilterType === 'pass') {
      if (currentVal === undefined || currentVal === null || currentVal === '') return false;
      return calculateGradeAndStatus(Number(currentVal)).status === 'PASS';
    }
    if (marksFilterType === 'fail') {
      if (currentVal === undefined || currentVal === null || currentVal === '') return false;
      return calculateGradeAndStatus(Number(currentVal)).status === 'FAIL';
    }

    return true;
  });

  // Filtered subjects for selected semester
  const availableSubjectsForSem = deptSubjects.filter(
    (s) => s.semester === selectedSemester
  );

  // Handle Save Internal Test Marks
  const handleSaveMarks = () => {
    if (!selectedSubjectCode) {
      alert('Please select a subject before saving marks.');
      return;
    }

    const targetSubject = deptSubjects.find((s) => s.code === selectedSubjectCode);
    if (!targetSubject) return;

    setStudents((prevStudents) =>
      prevStudents.map((st) => {
        if (st.department !== staffDept || st.currentSemester !== selectedSemester) {
          return st;
        }

        const markObtained = Number(marksState[st.registerNumber]) || 0;
        const { grade, status } = calculateGradeAndStatus(markObtained, targetSubject.maxMarks);

        const newSubjectMark: SubjectMark = {
          subjectCode: targetSubject.code,
          subjectName: targetSubject.name,
          maxMarks: targetSubject.maxMarks,
          marksObtained: markObtained,
          grade,
          status,
        };

        const examRecordId = `${st.registerNumber}-SEM${selectedSemester}-${selectedExamType}`;
        const existingExamIndex = (st.examRecords || []).findIndex((r) => r.id === examRecordId);

        let updatedExamRecords = [...(st.examRecords || [])];

        if (existingExamIndex >= 0) {
          const record = updatedExamRecords[existingExamIndex];
          const marksList = [...record.marks];
          const existingMarkIdx = marksList.findIndex((m) => m.subjectCode === targetSubject.code);

          if (existingMarkIdx >= 0) {
            marksList[existingMarkIdx] = newSubjectMark;
          } else {
            marksList.push(newSubjectMark);
          }

          const totalObtained = marksList.reduce((acc, m) => acc + m.marksObtained, 0);
          const maxTotal = marksList.reduce((acc, m) => acc + m.maxMarks, 0);
          const percentage = maxTotal > 0 ? (totalObtained / maxTotal) * 100 : 0;
          const overallStatus = marksList.some((m) => m.status === 'FAIL') ? 'FAIL' : 'PASS';

          updatedExamRecords[existingExamIndex] = {
            ...record,
            marks: marksList,
            totalObtained,
            maxTotal,
            percentage,
            overallStatus,
            datePublished: new Date().toISOString().slice(0, 10),
          };
        } else {
          const marksList = [newSubjectMark];
          const totalObtained = markObtained;
          const maxTotal = targetSubject.maxMarks;
          const percentage = (totalObtained / maxTotal) * 100;
          const overallStatus = status;

          updatedExamRecords.push({
            id: examRecordId,
            registerNumber: st.registerNumber,
            semester: selectedSemester,
            examType: selectedExamType,
            academicYear: '2023-2024',
            marks: marksList,
            totalObtained,
            maxTotal,
            percentage,
            overallStatus,
            enteredByStaffId: currentUser.id,
            datePublished: new Date().toISOString().slice(0, 10),
          });
        }

        return { ...st, examRecords: updatedExamRecords };
      })
    );

    setPublishStatus(`Marks for ${targetSubject.code} (${selectedExamType}) saved successfully!`);
    setTimeout(() => setPublishStatus(null), 3000);
  };

  // Handle Save Attendance
  const handleSaveAttendance = () => {
    if (totalClassesConducted <= 0) {
      alert('Total classes conducted must be greater than 0.');
      return;
    }

    setStudents((prev) =>
      prev.map((st) => {
        if (st.department !== staffDept || st.currentSemester !== attendanceSem) {
          return st;
        }

        const attended = Number(attendanceState[st.registerNumber]) || 0;
        const percentage = Math.min(100, Math.max(0, (attended / totalClassesConducted) * 100));

        const attRecord: AttendanceRecord = {
          totalClasses: totalClassesConducted,
          attendedClasses: attended,
          percentage,
          semester: attendanceSem,
          lastUpdated: new Date().toISOString().slice(0, 10),
        };

        return { ...st, attendance: attRecord };
      })
    );

    setAttendanceMsg(`Attendance for Semester ${attendanceSem} updated successfully!`);
    setTimeout(() => setAttendanceMsg(null), 3000);
  };

  // Handle Save Student
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    const cleanRegNo = studentRegNo.trim().toUpperCase();
    const cleanName = studentName.trim();

    if (!cleanRegNo || !cleanName || !studentDob) {
      setStudentError('Register Number, Student Name, and Date of Birth are required.');
      return;
    }

    if (!editingRegNo && students.some((s) => s.registerNumber === cleanRegNo)) {
      setStudentError(`Student with Register Number ${cleanRegNo} already exists.`);
      return;
    }

    if (editingRegNo) {
      // Edit existing student
      setStudents((prev) =>
        prev.map((s) => {
          if (s.registerNumber === editingRegNo) {
            return {
              ...s,
              name: cleanName,
              dob: studentDob,
              year: studentYear,
              currentSemester: studentSem,
              batch: studentBatch,
              email: studentEmail.trim() || `${cleanRegNo}@jayasakthi.edu`,
              phone: studentPhone.trim(),
            };
          }
          return s;
        })
      );
    } else {
      // Create new student
      const newSt: Student = {
        registerNumber: cleanRegNo,
        name: cleanName,
        dob: studentDob,
        department: staffDept,
        year: studentYear,
        currentSemester: studentSem,
        batch: studentBatch,
        email: studentEmail.trim() || `${cleanRegNo}@jayasakthi.edu`,
        phone: studentPhone.trim(),
        examRecords: [],
      };
      setStudents((prev) => [...prev, newSt]);
    }

    // Reset Form
    setIsAddingStudent(false);
    setEditingRegNo(null);
    setStudentRegNo('');
    setStudentName('');
    setStudentDob('');
    setStudentEmail('');
    setStudentPhone('');
  };

  // Start Editing Student
  const startEditStudent = (st: Student) => {
    setEditingRegNo(st.registerNumber);
    setStudentRegNo(st.registerNumber);
    setStudentName(st.name);
    setStudentDob(st.dob);
    setStudentYear(st.year);
    setStudentSem(st.currentSemester);
    setStudentBatch(st.batch);
    setStudentEmail(st.email);
    setStudentPhone(st.phone || '');
    setIsAddingStudent(true);
  };

  // Delete Student
  const handleDeleteStudent = (regNo: string) => {
    if (confirm(`Delete student ${regNo}?`)) {
      setStudents((prev) => prev.filter((s) => s.registerNumber !== regNo));
    }
  };

  // Export Marks as CSV / Excel
  const exportMarksCSV = () => {
    if (filteredStudents.length === 0) {
      alert('No students found for export.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Register Number,Student Name,Department,Semester,Exam Type,Subject Code,Marks Obtained,Grade,Status\n`;

    filteredStudents.forEach((st) => {
      const records = st.examRecords?.filter(
        (r) => r.semester === selectedSemester && r.examType === selectedExamType
      ) || [];

      records.forEach((rec) => {
        rec.marks.forEach((m) => {
          csvContent += `"${st.registerNumber}","${st.name}","${st.department}",${st.currentSemester},"${selectedExamType}","${m.subjectCode}",${m.marksObtained},"${m.grade || '-'}","${m.status}"\n`;
        });
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marks_sem${selectedSemester}_${selectedExamType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* FACULTY HERO HEADER */}
      <div className="bg-gradient-to-r from-[#0B2238] via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-blue-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-emerald-400 text-slate-950 rounded-2xl flex items-center justify-center font-bold shadow-lg">
              <Users className="w-7 h-7 text-[#0B2238]" />
            </div>
            <div>
              <span className="text-xs text-amber-300 font-extrabold uppercase tracking-widest block">
                FACULTY MARKS & ATTENDANCE MANAGEMENT
              </span>
              <h2 className="text-2xl font-black text-white">{currentUser.name}</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Department of <span className="font-bold text-amber-300">{staffDept}</span> • Academic Staff Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono">
            <span className="text-amber-300 font-bold">Staff ID:</span>
            <span className="text-white font-black">{currentUser.id}</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('marks')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'marks'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <FileCheck className="w-4 h-4 text-amber-400" />
          <span>ENTER INTERNAL MARKS</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-amber-400" />
          <span>ENTER ATTENDANCE</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'students'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <UserPlus className="w-4 h-4 text-amber-400" />
          <span>UPDATE STUDENT RECORDS</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'export'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>DOWNLOAD / EXPORT</span>
        </button>
      </div>

      {/* TAB 1: ENTER INTERNAL TEST MARKS */}
      {activeTab === 'marks' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md space-y-5">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(Number(e.target.value));
                  setSelectedSubjectCode('');
                }}
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-900"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Exam Type</label>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value as ExamType)}
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-900"
              >
                <option value="IAT-1">IAT - 1 (Internal Test 1)</option>
                <option value="IAT-2">IAT - 2 (Internal Test 2)</option>
                <option value="MODEL_EXAM">MODEL EXAM</option>
                <option value="SEMESTER">END SEMESTER</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Subject</label>
              <select
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-xs text-blue-900"
              >
                <option value="">-- Choose Subject --</option>
                {availableSubjectsForSem.map((sub) => (
                  <option key={sub.code} value={sub.code}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {publishStatus && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{publishStatus}</span>
            </div>
          )}

          {/* Real-Time Search & Filter Component for Bulk Marks Entry */}
          {filteredStudents.length > 0 && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[240px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={marksSearchQuery}
                  onChange={(e) => setMarksSearchQuery(e.target.value)}
                  placeholder="Quick search student name or register no..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                  id="marks-student-search-input"
                />
                {marksSearchQuery && (
                  <button
                    onClick={() => setMarksSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-1 hidden sm:inline">
                  Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setMarksFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    marksFilterType === 'all'
                      ? 'bg-[#0B2238] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  All ({filteredStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMarksFilterType('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    marksFilterType === 'pending'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setMarksFilterType('pass')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    marksFilterType === 'pass'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Pass
                </button>
                <button
                  type="button"
                  onClick={() => setMarksFilterType('fail')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    marksFilterType === 'fail'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Fail
                </button>
              </div>
            </div>
          )}

          {/* Marks Table */}
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-gray-200">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-bold">No students registered in {staffDept} for Semester {selectedSemester}.</p>
              <p className="text-[11px] text-gray-400 mt-1">Add students using the "Update Student Records" tab above.</p>
            </div>
          ) : displayedMarksStudents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-gray-200 space-y-2">
              <Search className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-600 font-bold">
                No students match search query "{marksSearchQuery}" with filter "{marksFilterType}".
              </p>
              <button
                onClick={() => {
                  setMarksSearchQuery('');
                  setMarksFilterType('all');
                }}
                className="text-xs text-blue-600 hover:underline font-extrabold cursor-pointer"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0B2238] text-white font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3 rounded-l-lg">Reg No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3 text-center">Semester</th>
                      <th className="py-2.5 px-3 text-center">Marks Obtained (Out of 100)</th>
                      <th className="py-2.5 px-3 text-center rounded-r-lg">Calculated Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {displayedMarksStudents.map((st, idx) => {
                      const currentVal =
                        marksState[st.registerNumber] !== undefined
                          ? marksState[st.registerNumber]
                          : st.examRecords
                              ?.find((r) => r.semester === selectedSemester && r.examType === selectedExamType)
                              ?.marks.find((m) => m.subjectCode === selectedSubjectCode)?.marksObtained || '';

                      const calc = calculateGradeAndStatus(Number(currentVal) || 0);

                      return (
                        <tr key={st.registerNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">{st.registerNumber}</td>
                          <td className="py-3 px-3 font-bold text-gray-900">{st.name}</td>
                          <td className="py-3 px-3 text-center text-gray-600 font-bold">Sem {st.currentSemester}</td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={currentVal}
                              onChange={(e) =>
                                setMarksState((prev) => ({
                                  ...prev,
                                  [st.registerNumber]: Math.min(100, Math.max(0, Number(e.target.value))),
                                }))
                              }
                              placeholder="0-100"
                              className="w-24 text-center py-1.5 px-2 bg-slate-50 border border-gray-300 rounded-lg font-mono font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                            />
                          </td>
                          <td className="py-3 px-3 text-center font-bold">
                            <span
                              className={`px-2.5 py-1 rounded text-xs inline-block font-mono ${
                                calc.status === 'PASS'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}
                            >
                              Grade {calc.grade} ({calc.status})
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveMarks}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE & PUBLISH MARKS</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ENTER ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Select Semester</label>
              <select
                value={attendanceSem}
                onChange={(e) => setAttendanceSem(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-900"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                Total Classes Conducted
              </label>
              <input
                type="number"
                min="1"
                value={totalClassesConducted}
                onChange={(e) => setTotalClassesConducted(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-900"
              />
            </div>
          </div>

          {attendanceMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{attendanceMsg}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0B2238] text-white font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3 rounded-l-lg">Reg No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3 text-center">Attended Classes</th>
                  <th className="py-2.5 px-3 text-center">Total Conducted</th>
                  <th className="py-2.5 px-3 text-center rounded-r-lg">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {students
                  .filter((s) => s.department === staffDept && s.currentSemester === attendanceSem)
                  .map((st, idx) => {
                    const attendedVal =
                      attendanceState[st.registerNumber] !== undefined
                        ? attendanceState[st.registerNumber]
                        : st.attendance?.attendedClasses ?? 0;

                    const pct = totalClassesConducted > 0 ? (Number(attendedVal) / totalClassesConducted) * 100 : 0;

                    return (
                      <tr key={st.registerNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-3 px-3 font-mono font-bold text-blue-700">{st.registerNumber}</td>
                        <td className="py-3 px-3 font-bold text-gray-900">{st.name}</td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={totalClassesConducted}
                            value={attendedVal}
                            onChange={(e) =>
                              setAttendanceState((prev) => ({
                                ...prev,
                                [st.registerNumber]: Math.min(totalClassesConducted, Math.max(0, Number(e.target.value))),
                              }))
                            }
                            className="w-20 text-center py-1.5 px-2 bg-slate-50 border border-gray-300 rounded-lg font-mono font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-gray-500">
                          / {totalClassesConducted}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          <span
                            className={`px-2.5 py-1 rounded text-xs inline-block font-mono ${
                              pct >= 75
                                ? 'bg-emerald-100 text-emerald-800'
                                : pct >= 65
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {pct.toFixed(1)}% {pct < 75 ? '(Shortage Warning)' : ''}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveAttendance}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>SAVE ATTENDANCE RECORDS</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: UPDATE STUDENT RECORDS */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-gray-900 text-sm">
              {staffDept} Students Directory ({students.filter((s) => s.department === staffDept).length})
            </h3>

            <button
              onClick={() => {
                setIsAddingStudent(true);
                setEditingRegNo(null);
                setStudentRegNo('');
                setStudentName('');
                setStudentDob('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow transition-all cursor-pointer"
            >
              + ADD NEW STUDENT
            </button>
          </div>

          {/* Add / Edit Student Form Modal or Banner */}
          {isAddingStudent && (
            <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="font-extrabold text-gray-900 text-sm">
                  {editingRegNo ? `Edit Student (${editingRegNo})` : 'Add New Student Record'}
                </h4>
                <button
                  onClick={() => setIsAddingStudent(false)}
                  className="text-xs text-gray-400 hover:text-gray-700 font-bold"
                >
                  Cancel
                </button>
              </div>

              {studentError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                  {studentError}
                </div>
              )}

              <form onSubmit={handleSaveStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 uppercase block mb-1">Register Number</label>
                  <input
                    type="text"
                    disabled={!!editingRegNo}
                    value={studentRegNo}
                    onChange={(e) => setStudentRegNo(e.target.value)}
                    placeholder="e.g. 211419104001"
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-mono uppercase text-gray-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 uppercase block mb-1">Student Full Name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. RAJESH KUMAR K"
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 uppercase block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={studentDob}
                    onChange={(e) => setStudentDob(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 uppercase block mb-1">Batch</label>
                  <input
                    type="text"
                    value={studentBatch}
                    onChange={(e) => setStudentBatch(e.target.value)}
                    placeholder="2021-2025"
                    className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-gray-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 uppercase block mb-1">Year & Semester</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={studentYear}
                      onChange={(e) => setStudentYear(Number(e.target.value) as 1 | 2 | 3 | 4)}
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold"
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                      <option value={4}>Year 4</option>
                    </select>

                    <select
                      value={studentSem}
                      onChange={(e) => setStudentSem(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Sem {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 uppercase block mb-1">Email & Phone</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="rajesh@jayasakthi.edu"
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                    <input
                      type="text"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="+91 91234 56789"
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow cursor-pointer"
                  >
                    {editingRegNo ? 'UPDATE STUDENT DETAILS' : 'SAVE NEW STUDENT'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Student Table */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B2238] text-white font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3 rounded-l-lg">Reg No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">DOB</th>
                    <th className="py-2.5 px-3 text-center">Year / Sem</th>
                    <th className="py-2.5 px-3 text-center">Batch</th>
                    <th className="py-2.5 px-3 text-center rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {students
                    .filter((s) => s.department === staffDept)
                    .map((st, idx) => (
                      <tr key={st.registerNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{st.registerNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">{st.name}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-600">{st.dob}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-700">Yr {st.year} (Sem {st.currentSemester})</td>
                        <td className="py-2.5 px-3 text-center font-mono">{st.batch}</td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => startEditStudent(st)}
                              className="p-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-blue-700 transition-colors cursor-pointer"
                              title="Edit Student"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(st.registerNumber)}
                              className="p-1.5 bg-slate-100 hover:bg-red-600 hover:text-white rounded-lg text-gray-400 transition-colors cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXPORT MARKS & REPORTS */}
      {activeTab === 'export' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md space-y-4">
          <h3 className="font-extrabold text-gray-900 text-sm">Download Academic Marks & Attendance Reports</h3>
          <p className="text-xs text-gray-500">Download formatted Excel/CSV files or print digital marksheets</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                <FileSpreadsheet className="w-5 h-5" />
                <span>Export Marks to Excel / CSV</span>
              </div>
              <p className="text-xs text-emerald-700">
                Download full subject-wise marks breakdown for Semester {selectedSemester} ({selectedExamType}) as a structured CSV file.
              </p>
              <button
                onClick={exportMarksCSV}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                DOWNLOAD EXCEL / CSV REPORT
              </button>
            </div>

            <div className="p-5 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm">
                <Printer className="w-5 h-5" />
                <span>Print Digital Marksheets (PDF)</span>
              </div>
              <p className="text-xs text-blue-800">
                Generate official Anna University affiliated print-ready marksheets for students.
              </p>
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-[#0B2238] hover:bg-slate-900 text-amber-400 font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer border border-amber-400/20"
              >
                PRINT CURRENT MARKSHEETS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
