import React, { useState } from 'react';
import {
  Printer,
  GraduationCap,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  BookOpen,
  Award,
  Sparkles,
  PieChart,
  BarChart2,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';
import { DailyAttendanceRecord, ExamSchedule, ExamType, Student, AcademicCalendarEvent } from '../types';
import { StudentLogo } from './StudentLogo';

interface StudentPortalProps {
  student: Student;
  exams?: ExamSchedule[];
  dailyAttendance?: DailyAttendanceRecord[];
  academicEvents?: AcademicCalendarEvent[];
  onUpdateStudent?: (updated: Student) => void;
  onLogout: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  exams = [],
  dailyAttendance = [],
}) => {
  const [selectedExam, setSelectedExam] = useState<ExamType>('CAT-1');
  const [selectedSemester, setSelectedSemester] = useState<number>(
    student.currentSemester || 6
  );
  const [activeTab, setActiveTab] = useState<'marks' | 'attendance' | 'performance' | 'upcoming_exams'>('marks');

  // Find corresponding exam record
  const currentRecord = student.examRecords?.find(
    (r) => r.semester === selectedSemester && r.examType === selectedExam
  );

  const handlePrint = () => {
    window.print();
  };

  // Attendance stats
  const att = student.attendance;
  const attPct = att ? att.percentage : 0;
  const isAttEligible = attPct >= 75;

  const applicableExams = exams.filter(
    (e) =>
      (e.department === 'ALL' || e.department === student.department) &&
      e.semester === student.currentSemester
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0B2238] via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-blue-900/50 print:hidden relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Student Profile Photo / Student Logo */}
            <div className="shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 border-2 border-amber-400 p-0.5 shadow-lg overflow-hidden flex items-center justify-center">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <StudentLogo size="custom" className="w-full h-full p-1" />
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-amber-300 font-extrabold uppercase tracking-widest block mb-1">
                STUDENT ACADEMIC PORTAL
              </span>
              <h2 className="text-2xl font-black text-white">{student.name}</h2>
              <p className="text-xs text-blue-200 mt-1">
                Reg No: <span className="font-mono font-bold text-white">{student.registerNumber}</span> • <span className="font-semibold text-white">{student.department}</span>
              </p>
            </div>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 text-center self-start sm:self-auto">
            <span className="text-[10px] text-blue-200 uppercase font-bold block">
              ACADEMIC BATCH
            </span>
            <span className="text-sm font-extrabold text-amber-300">
              {student.batch}
            </span>
          </div>
        </div>
      </div>

      {/* STUDENT NAVIGATION TABS */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200 flex flex-wrap gap-2 print:hidden">
        <button
          onClick={() => setActiveTab('marks')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'marks'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>INTERNAL MARKS</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <PieChart className="w-4 h-4 text-amber-400" />
          <span>ATTENDANCE ({att ? `${att.percentage.toFixed(1)}%` : '100.0%'})</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'performance'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>OVERALL PERFORMANCE</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming_exams')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'upcoming_exams'
              ? 'bg-[#0B2238] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>UPCOMING EXAMS</span>
          {applicableExams.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'upcoming_exams'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-blue-100 text-blue-900'
              }`}
            >
              {applicableExams.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: INTERNAL MARKS */}
      {activeTab === 'marks' && (
        <div className="space-y-4">
          {/* Selector Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 print:hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Select Examination Result:
              </span>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow transition-all cursor-pointer"
                id="print-report-card-btn"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Digital Report Card</span>
              </button>
            </div>

            {/* Exam Type Buttons: Left Side CAT-1,2,3 & Right Side M-1,2,3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Left Side: CAT Assessments */}
              <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/80 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black tracking-wider text-blue-900 uppercase">
                    Continuous Assessment (CAT)
                  </span>
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded">
                    CAT 1 - 3
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['CAT-1', 'CAT-2', 'CAT-3'] as ExamType[]).map((exam) => (
                    <button
                      key={exam}
                      onClick={() => setSelectedExam(exam)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        selectedExam === exam
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-1'
                          : 'bg-white hover:bg-blue-100/60 text-slate-700 border border-slate-200/80'
                      }`}
                      id={`btn-exam-${exam}`}
                    >
                      <FileText className="w-3 h-3 shrink-0" />
                      <span className="truncate">{exam}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Side: Model Examinations */}
              <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/80 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black tracking-wider text-amber-900 uppercase">
                    Model Examinations (M)
                  </span>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                    Model 1 - 3
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['M-1', 'M-2', 'M-3'] as ExamType[]).map((exam) => (
                    <button
                      key={exam}
                      onClick={() => setSelectedExam(exam)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        selectedExam === exam
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm ring-2 ring-amber-500 ring-offset-1'
                          : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-slate-200/80'
                      }`}
                      id={`btn-exam-${exam}`}
                    >
                      <FileText className="w-3 h-3 shrink-0" />
                      <span className="truncate">{exam}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Semester Selector */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Semester:
              </span>
              <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedSemester === sem
                        ? 'bg-[#0B2238] text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-gray-600'
                    }`}
                  >
                    S{sem}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DIGITAL REPORT CARD SHEET (Printable) */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden print:shadow-none print:border-none print:m-0">
            {/* Report Card Header */}
            <div className="bg-[#0B2238] text-white p-6 text-center border-b-4 border-amber-400">
              <div className="flex items-center justify-center gap-2 mb-1">
                <GraduationCap className="w-7 h-7 text-amber-400" />
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-widest text-white">
                  JAYA SAKTHI ENGINEERING COLLEGE
                </h1>
              </div>
              <p className="text-[11px] text-blue-200 uppercase font-semibold tracking-wider">
                Affiliated to Anna University Chennai • Approved by AICTE
              </p>
              <div className="mt-3 inline-block bg-white/10 px-4 py-1.5 rounded-full text-xs font-black tracking-widest text-amber-300 border border-amber-400/30 uppercase">
                {selectedExam === 'CAT-1'
                  ? 'CONTINUOUS ASSESSMENT TEST - 1 (CAT-1) MARKSHEET'
                  : selectedExam === 'CAT-2'
                  ? 'CONTINUOUS ASSESSMENT TEST - 2 (CAT-2) MARKSHEET'
                  : selectedExam === 'CAT-3'
                  ? 'CONTINUOUS ASSESSMENT TEST - 3 (CAT-3) MARKSHEET'
                  : selectedExam === 'M-1'
                  ? 'MODEL EXAM - 1 (M-1) MARKSHEET'
                  : selectedExam === 'M-2'
                  ? 'MODEL EXAM - 2 (M-2) MARKSHEET'
                  : selectedExam === 'M-3'
                  ? 'MODEL EXAM - 3 (M-3) MARKSHEET'
                  : `${selectedExam} MARKSHEET`}
              </div>
            </div>

            {/* Student Profile Info Grid */}
            <div className="p-5 bg-slate-50/80 border-b border-gray-200 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 flex-1">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      REGISTER NUMBER
                    </span>
                    <span className="font-mono font-bold text-blue-700 text-sm">
                      {student.registerNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      STUDENT NAME
                    </span>
                    <span className="font-bold text-gray-900 uppercase">
                      {student.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      DEPARTMENT
                    </span>
                    <span className="font-semibold text-gray-800">
                      {student.department}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      DATE OF BIRTH
                    </span>
                    <span className="font-mono font-medium text-gray-800">
                      {student.dob}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      SEMESTER & YEAR
                    </span>
                    <span className="font-semibold text-gray-800">
                      Semester {selectedSemester} (Year {student.year})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      EXAM STATUS
                    </span>
                    {currentRecord ? (
                      <span
                        className={`inline-flex items-center gap-1 font-extrabold px-2 py-0.5 rounded text-[11px] uppercase ${
                          currentRecord.overallStatus === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {currentRecord.overallStatus === 'PASS' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                        )}
                        <span>{currentRecord.overallStatus}</span>
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        NOT PUBLISHED
                      </span>
                    )}
                  </div>
                </div>

                {/* Photo Thumbnail on Marksheet */}
                <div className="shrink-0 w-20 h-24 border-2 border-slate-300 rounded-lg p-0.5 bg-white shadow-xs overflow-hidden flex flex-col items-center justify-center">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 rounded flex flex-col items-center justify-center p-1">
                      <StudentLogo size="custom" className="w-14 h-14" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Record Content or Not Found State */}
            {currentRecord ? (
              <div>
                {/* Score Metrics Summary */}
                <div className="p-4 bg-white grid grid-cols-3 gap-3 border-b border-gray-200 text-center">
                  <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      TOTAL OBTAINED
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-blue-900 block mt-0.5">
                      {currentRecord.totalObtained} / {currentRecord.maxTotal}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                      PERCENTAGE
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-900 block mt-0.5">
                      {currentRecord.percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-100">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                      OVERALL RESULT
                    </span>
                    <span
                      className={`text-xl sm:text-2xl font-black block mt-0.5 ${
                        currentRecord.overallStatus === 'PASS'
                          ? 'text-emerald-700'
                          : 'text-red-600'
                      }`}
                    >
                      {currentRecord.overallStatus}
                    </span>
                  </div>
                </div>

                {/* Subject Marks Table */}
                <div className="p-5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    SUBJECT MARKS BREAKDOWN
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#0B2238] text-white font-bold uppercase text-[11px] tracking-wider">
                          <th className="py-2.5 px-3 rounded-l-lg">Sub Code</th>
                          <th className="py-2.5 px-3">Subject Name</th>
                          <th className="py-2.5 px-3 text-center">Max</th>
                          <th className="py-2.5 px-3 text-center">Obtained</th>
                          <th className="py-2.5 px-3 text-center">Grade</th>
                          <th className="py-2.5 px-3 text-center rounded-r-lg">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {currentRecord.marks.map((m, idx) => (
                          <tr
                            key={m.subjectCode}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                          >
                            <td className="py-3 px-3 font-mono font-bold text-blue-700">
                              {m.subjectCode}
                            </td>
                            <td className="py-3 px-3 font-semibold text-gray-800">
                              {m.subjectName}
                            </td>
                            <td className="py-3 px-3 text-center text-gray-500 font-mono">
                              {m.maxMarks}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-gray-900 font-mono text-sm">
                              {m.marksObtained}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-extrabold px-2 py-0.5 rounded text-xs inline-block bg-slate-100 text-gray-800 font-mono">
                                {m.grade || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`font-bold text-[11px] uppercase ${
                                  m.status === 'PASS'
                                    ? 'text-emerald-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Result Not Published Yet
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  The results for <span className="font-bold text-gray-800">{selectedExam}</span> in Semester {selectedSemester} have not been entered by your staff.
                </p>
              </div>
            )}

            {/* Digital Verification Footer */}
            <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
              <div>
                <span className="font-semibold block">Office of Controller of Examinations</span>
                <span>Jaya Sakthi Engineering College</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] text-gray-400 block">
                  Published: {currentRecord?.datePublished || 'N/A'}
                </span>
                <span className="text-emerald-600 font-bold">✓ Verified Digital Marksheet</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE PERCENTAGE */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md space-y-6">
          <div>
            <h3 className="text-base font-black text-gray-900">Attendance Percentage & Eligibility</h3>
            <p className="text-xs text-gray-500">Anna University requires a minimum of 75% attendance for examination eligibility.</p>
          </div>

          {att ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gauge Card */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-gray-200 text-center space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">ATTENDANCE RATE</span>
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center rounded-full border-8 border-slate-200 bg-white shadow-inner">
                  <span
                    className={`text-2xl font-black ${
                      isAttEligible ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {att.percentage.toFixed(1)}%
                  </span>
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                    isAttEligible
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isAttEligible ? '✓ ELIGIBLE FOR EXAMS' : '⚠ SHORTAGE OF ATTENDANCE'}
                </span>
              </div>

              {/* Class breakdown */}
              <div className="md:col-span-2 p-5 bg-slate-50 rounded-2xl border border-gray-200 space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase">Class Hours Attendance Summary</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">TOTAL CONDUCTED</span>
                    <span className="text-2xl font-black text-blue-900 block mt-1">{att.totalClasses} Hours</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">CLASSES ATTENDED</span>
                    <span className="text-2xl font-black text-emerald-600 block mt-1">{att.attendedClasses} Hours</span>
                  </div>
                </div>

                {!isAttEligible && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Your attendance is below 75%. Please contact your Head of Department (HOD) regarding condonation rules.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-10 bg-slate-50 rounded-2xl text-center border border-gray-200">
              <PieChart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-bold">Attendance record not published yet.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Staff will update attendance for Semester {selectedSemester}.</p>
            </div>
          )}

          {/* Daily Attendance History Section */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Class Counselor Daily Attendance Log
            </h4>

            {(() => {
              const myLogs = dailyAttendance
                .filter(
                  (r) =>
                    r.department === student.department &&
                    r.semester === student.currentSemester
                )
                .map((r) => {
                  const myRec = r.records.find((rec) => rec.registerNumber === student.registerNumber);
                  return myRec ? { ...r, myStatus: myRec.status, remarks: myRec.remarks } : null;
                })
                .filter(Boolean);

              if (myLogs.length === 0) {
                return (
                  <p className="text-xs text-gray-400 italic">
                    No daily attendance records published by your Class Counselor for this semester yet.
                  </p>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {myLogs.reverse().map((log) => (
                    <div
                      key={log!.id}
                      className="p-3 bg-slate-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-gray-900 block">{log!.date}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Session: {log!.session}</span>
                        {log!.remarks && (
                          <span className="text-[10px] text-gray-600 block italic">{log!.remarks}</span>
                        )}
                      </div>

                      <div>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                            log!.myStatus === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log!.myStatus === 'ABSENT'
                              ? 'bg-red-100 text-red-800'
                              : log!.myStatus === 'LEAVE'
                              ? 'bg-amber-100 text-amber-950 border border-amber-300'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log!.myStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: OVERALL PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Academic Performance Summary</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                History of examination records and performance standing published across semesters.
              </p>
            </div>

            <span className="px-3.5 py-1 bg-amber-50 text-amber-900 text-xs font-black rounded-full border border-amber-200 self-start sm:self-auto">
              Batch: {student.batch}
            </span>
          </div>

          {student.examRecords && student.examRecords.length > 0 ? (
            <div className="space-y-4">
              {/* Summary Metric Stats */}
              {(() => {
                const totalExams = student.examRecords.length;
                const avgPct =
                  student.examRecords.reduce((acc, curr) => acc + curr.percentage, 0) / totalExams;
                const passedExams = student.examRecords.filter((r) => r.overallStatus === 'PASS').length;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                        EXAMINATIONS RECORDED
                      </span>
                      <span className="text-2xl font-black text-blue-950 block mt-1">
                        {totalExams} Exams
                      </span>
                    </div>

                    <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                        CUMULATIVE AVERAGE
                      </span>
                      <span className="text-2xl font-black text-emerald-900 block mt-1">
                        {avgPct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100">
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                        CLEARED ASSESSMENTS
                      </span>
                      <span className="text-2xl font-black text-purple-900 block mt-1">
                        {passedExams} / {totalExams}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Semester Record Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {student.examRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 bg-slate-50/90 hover:bg-slate-50 rounded-2xl border border-gray-200 shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                          Sem {rec.semester}
                        </span>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          {rec.examType}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 mt-2 font-medium">
                        Total Marks: <span className="font-bold text-gray-900 font-mono">{rec.totalObtained} / {rec.maxTotal}</span>
                      </p>
                      <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                        Published: {rec.datePublished || 'Official'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-700 block">
                        {rec.percentage.toFixed(1)}%
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mt-1 ${
                          rec.overallStatus === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {rec.overallStatus === 'PASS' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-600" />
                        )}
                        <span>{rec.overallStatus}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 bg-slate-50/70 rounded-2xl text-center border border-gray-200">
              <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800">No academic examination records found.</p>
              <p className="text-xs text-gray-400 mt-1">Staff will post your semester marks and model exam grades here.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: UPCOMING EXAMS */}
      {activeTab === 'upcoming_exams' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 font-extrabold flex items-center justify-center shadow-inner">
                <Calendar className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Upcoming Examinations Timetable ({applicableExams.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Live official schedule published by Central Exam Cell for {student.department} (Semester {student.currentSemester})
                </p>
              </div>
            </div>

            <span className="px-3.5 py-1.5 bg-blue-50 text-blue-900 text-xs font-black rounded-xl border border-blue-200 self-start sm:self-auto">
              Batch: {student.batch}
            </span>
          </div>

          {applicableExams.length === 0 ? (
            <div className="p-12 bg-slate-50/70 rounded-2xl text-center border border-gray-200 space-y-2">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-800 font-bold">No upcoming exam schedules published yet.</p>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                The Central Exam Cell (COE) will announce the timetable and session timings here once released.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {applicableExams.map((ex) => (
                <div
                  key={ex.id}
                  className="p-5 bg-slate-50/90 hover:bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-[#0B2238] text-amber-300 text-[10px] font-black rounded-lg uppercase tracking-wider">
                        {ex.examType.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-800 text-[11px] font-bold rounded-md border border-purple-200">
                        Session {ex.session}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{ex.examDate}</span>
                    </div>
                  </div>

                  <div className="border-y border-gray-200/70 py-3 space-y-1">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">
                      {ex.subjectCode}
                    </span>
                    <h4 className="font-extrabold text-gray-900 text-sm">{ex.subjectName}</h4>
                    <div className="flex items-center gap-1.5 text-gray-700 font-semibold text-xs pt-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Time: {ex.examTime}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-gray-600 gap-2 pt-0.5">
                    <p>
                      <strong className="text-gray-900">Venue:</strong> {ex.venue || 'Main Exam Hall'}
                    </p>
                    {ex.instructions && (
                      <p className="text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-[10px] font-medium">
                        ⚠️ {ex.instructions}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
