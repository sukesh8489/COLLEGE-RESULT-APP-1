import React, { useRef } from 'react';
import {
  X,
  Printer,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Award,
  User,
} from 'lucide-react';
import { ExamSchedule, ExamType, Student } from '../types';
import { StudentLogo } from './StudentLogo';

interface AdminHallTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  exams: ExamSchedule[];
}

export const AdminHallTicketModal: React.FC<AdminHallTicketModalProps> = ({
  isOpen,
  onClose,
  student,
  exams,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !student) return null;

  // Filter exams for this student's department and semester
  const relevantExams = exams.filter(
    (ex) =>
      (ex.department === 'ALL' || ex.department === student.department) &&
      ex.semester === student.currentSemester
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* MODAL ACTION BAR */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-white">
              Official Examination Hall Ticket & Admit Card
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow transition-transform transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Hall Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE HALL TICKET SHEET */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50" ref={printAreaRef}>
          <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm max-w-2xl mx-auto space-y-6 text-slate-900 print:border-none print:shadow-none print:p-0">
            {/* INSTITUTION HEADER */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <GraduationCap className="w-7 h-7 text-[#0B2238]" />
                <h1 className="text-xl font-black tracking-tight text-[#0B2238] uppercase">
                  Jaya Sakthi Engineering College
                </h1>
              </div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
                Approved by AICTE, New Delhi • Affiliated to Anna University, Chennai
              </p>
              <div className="pt-2">
                <span className="inline-block px-4 py-1 bg-slate-900 text-amber-300 text-xs font-black rounded-full uppercase tracking-widest">
                  OFFICIAL EXAMINATION HALL TICKET / ADMIT CARD
                </span>
              </div>
            </div>

            {/* CANDIDATE INFO SECTION */}
            <div className="flex items-start justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Candidate Name
                  </span>
                  <span className="font-black text-slate-900 text-sm">{student.name}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Register Number
                  </span>
                  <span className="font-mono font-black text-blue-900 text-sm">
                    {student.registerNumber}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Department
                  </span>
                  <span className="font-bold text-slate-900">{student.department}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Year / Semester
                  </span>
                  <span className="font-bold text-slate-900">
                    Year {student.year} (Sem {student.currentSemester})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Batch
                  </span>
                  <span className="font-bold text-slate-900">{student.batch}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Attendance Status
                  </span>
                  <span className="font-bold text-emerald-800">
                    {student.attendance ? `${student.attendance.percentage.toFixed(1)}% Eligible` : 'Eligible'}
                  </span>
                </div>
              </div>

              {/* CANDIDATE PHOTO BOX */}
              <div className="w-24 h-28 border-2 border-slate-300 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 flex flex-col items-center justify-center w-full h-full">
                    <StudentLogo size="custom" className="w-14 h-14" />
                    <span className="text-[8px] block mt-1 font-bold text-amber-300">STUDENT BADGE</span>
                  </div>
                )}
              </div>
            </div>

            {/* TIMETABLE SECTION */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-900" />
                <span>Scheduled Examinations & Timetable</span>
              </h3>

              {relevantExams.length > 0 ? (
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300">Date & Session</th>
                      <th className="p-2 border-r border-slate-300">Sub Code</th>
                      <th className="p-2 border-r border-slate-300">Subject Title</th>
                      <th className="p-2 border-r border-slate-300">Exam Type</th>
                      <th className="p-2 text-center">Hall / Invigilator Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {relevantExams.map((ex, idx) => (
                      <tr key={ex.id || idx}>
                        <td className="p-2 border-r border-slate-300 font-semibold text-[11px]">
                          <div>{ex.examDate}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {ex.session} ({ex.examTime})
                          </div>
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono font-bold text-blue-900">
                          {ex.subjectCode}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-medium">
                          {ex.subjectName}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-semibold text-[11px] text-slate-700">
                          {ex.examType}
                        </td>
                        <td className="p-2 text-center text-[10px] text-slate-400 italic">
                          {ex.venue || 'Main Hall'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">
                  No active timetable entries published yet for Sem {student.currentSemester} ({student.department}).
                </div>
              )}
            </div>

            {/* INSTRUCTIONS */}
            <div className="text-[10px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <strong className="text-slate-800 uppercase block font-black">
                Important Instructions:
              </strong>
              <p>1. Candidates must carry this Hall Ticket along with College ID card to the exam hall.</p>
              <p>2. Electronic gadgets, smartwatches, and programmable calculators are strictly prohibited.</p>
              <p>3. Candidates must be seated in their designated exam hall 15 minutes before commencement.</p>
            </div>

            {/* SIGNATURE SECTION */}
            <div className="pt-8 flex items-end justify-between text-center text-xs text-slate-800">
              <div>
                <div className="w-36 border-b-2 border-slate-900 pb-1 mb-1"></div>
                <span className="font-bold text-[11px] uppercase">Candidate Signature</span>
              </div>

              <div>
                <div className="w-36 border-b-2 border-slate-900 pb-1 mb-1"></div>
                <span className="font-bold text-[11px] uppercase">Class Counselor</span>
              </div>

              <div>
                <div className="w-44 border-b-2 border-slate-900 pb-1 mb-1 font-mono font-bold text-[10px] text-blue-900">
                  SEAL & SIGNATURE
                </div>
                <span className="font-black text-[11px] uppercase block text-slate-900">
                  Controller of Examinations
                </span>
                <span className="text-[9px] text-slate-500 block">Jaya Sakthi Engg College</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
