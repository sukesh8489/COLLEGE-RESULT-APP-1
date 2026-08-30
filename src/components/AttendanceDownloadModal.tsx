import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Calendar,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Check,
  Clock,
  Layers,
  ArrowRight,
  ChevronLeft,
  CalendarDays,
} from 'lucide-react';
import { DailyAttendanceRecord, Student } from '../types';
import {
  DateRangePreset,
  getDateRangeBounds,
  filterAttendanceRecords,
  exportAttendanceToPDF,
  exportAttendanceToExcel,
  formatDateToISO,
} from '../utils/dailyAttendanceExport';

interface AttendanceDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: string;
  initialSemester?: number;
  students: Student[];
  dailyAttendance: DailyAttendanceRecord[];
  batch?: string;
}

export const AttendanceDownloadModal: React.FC<AttendanceDownloadModalProps> = ({
  isOpen,
  onClose,
  department,
  initialSemester = 6,
  students,
  dailyAttendance,
  batch = '2023-2027',
}) => {
  const [step, setStep] = useState<'RANGE' | 'FORMAT'>('RANGE');

  // Date range state
  const todayStr = useMemo(() => formatDateToISO(new Date()), []);
  const [preset, setPreset] = useState<DateRangePreset>('today');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [isUsingCustomDates, setIsUsingCustomDates] = useState<boolean>(false);

  // Scope filters
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>(initialSemester);
  const [selectedSession, setSelectedSession] = useState<'ALL' | 'FN' | 'AN'>('ALL');

  // Feedback states
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Quick preset click handler
  const handleSelectPreset = (p: DateRangePreset) => {
    setPreset(p);
    setIsUsingCustomDates(false);
    const bounds = getDateRangeBounds(p);
    setStartDate(bounds.start);
    setEndDate(bounds.end);
  };

  // Compute active bounds and label
  const { start, end, label: rangeLabel } = useMemo(() => {
    if (isUsingCustomDates) {
      return getDateRangeBounds(preset, startDate, endDate);
    }
    return getDateRangeBounds(preset);
  }, [preset, isUsingCustomDates, startDate, endDate]);

  // Matching records in this range
  const matchingRecords = useMemo(() => {
    return filterAttendanceRecords(dailyAttendance, department, {
      preset,
      startDate: isUsingCustomDates ? startDate : undefined,
      endDate: isUsingCustomDates ? endDate : undefined,
      sessionFilter: selectedSession,
      semester: selectedSemester,
    });
  }, [dailyAttendance, department, preset, isUsingCustomDates, startDate, endDate, selectedSession, selectedSemester]);

  // Matching students in scope
  const matchingStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.department !== department) return false;
      if (selectedSemester !== 'ALL' && s.currentSemester !== selectedSemester) return false;
      return true;
    });
  }, [students, department, selectedSemester]);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      exportAttendanceToPDF(
        matchingRecords,
        department,
        selectedSemester,
        batch,
        rangeLabel,
        students,
        selectedSession
      );
      setDownloadSuccess('PDF Attendance Report successfully generated and downloaded!');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExcel = () => {
    setIsExporting(true);
    try {
      exportAttendanceToExcel(
        matchingRecords,
        department,
        selectedSemester,
        batch,
        rangeLabel,
        students,
        selectedSession
      );
      setDownloadSuccess('Excel Attendance Workbook (.xlsx) successfully generated and downloaded!');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error('Error generating Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Daily Attendance Export</h3>
              <p className="text-xs text-slate-300">
                {department} Department &bull; {selectedSemester === 'ALL' ? 'All Semesters' : `Semester ${selectedSemester}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP PROGRESS INDICATOR */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep('RANGE')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                step === 'RANGE'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>1. Date Range &amp; Scope</span>
              {step === 'FORMAT' && <Check className="w-3 h-3 text-emerald-400" />}
            </button>
            <span className="text-slate-300">&rarr;</span>
            <button
              type="button"
              onClick={() => setStep('FORMAT')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                step === 'FORMAT'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>2. Choose Format (PDF / Excel)</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION MESSAGE */}
        {downloadSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* ========================================================================= */}
          {/* STEP 1: DATE RANGE & SCOPE */}
          {/* ========================================================================= */}
          {step === 'RANGE' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Select Date Range</span>
                </label>

                {/* Quick Date Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'this_week', label: 'This Week' },
                    { id: 'this_month', label: 'This Month' },
                  ].map((p) => {
                    const isSelected = !isUsingCustomDates && preset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p.id as DateRangePreset)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Explicit From Date & To Date Range Inputs */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-700" />
                    <span>Download Date Range (From &rarr; To)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setIsUsingCustomDates(true);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setIsUsingCustomDates(true);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SELECTED DATE WINDOW INFO CARD */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">Active Date Range</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{rangeLabel}</p>
                </div>
                <span className="text-[11px] font-mono font-bold text-blue-900 bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-2xs">
                  {start} &rarr; {end}
                </span>
              </div>

              {/* CLASS SEMESTER & SESSION FILTERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Semester Scope</span>
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) =>
                      setSelectedSemester(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Semesters (Entire Dept)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s} (Year {Math.ceil(s / 2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Session Filter</span>
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Sessions (FN &amp; AN)</option>
                    <option value="FN">Forenoon Only (FN)</option>
                    <option value="AN">Afternoon Only (AN)</option>
                  </select>
                </div>
              </div>

              {/* LIVE MATCHING STATS BANNER */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-indigo-950">Matching Scope:</span>
                  <p className="text-indigo-800 text-[11px] mt-0.5">
                    {matchingStudents.length} Students &bull; {matchingRecords.length} Saved Daily Sessions in range
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-white border border-indigo-200 font-extrabold text-indigo-900 text-[11px]">
                  {rangeLabel}
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: CHOOSE FORMAT & DOWNLOAD */}
          {/* ========================================================================= */}
          {step === 'FORMAT' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Export Scope Summary:</span>
                  <button
                    type="button"
                    onClick={() => setStep('RANGE')}
                    className="text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    Change Scope &rarr;
                  </button>
                </div>
                <p>
                  <strong>Date Range:</strong> {rangeLabel}
                </p>
                <p>
                  <strong>Class:</strong> {department} &bull;{' '}
                  {selectedSemester === 'ALL' ? 'All Semesters' : `Semester ${selectedSemester}`} &bull; Session: {selectedSession}
                </p>
                <p>
                  <strong>Student Count:</strong> {matchingStudents.length} enrolled students
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PDF OPTION */}
                <div className="p-5 rounded-2xl border-2 border-rose-200 hover:border-rose-400 bg-rose-50/30 hover:bg-rose-50/60 transition flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">PDF Document (.pdf)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Official Jayasakthi Engineering College institutional layout with letterhead banner, student roster breakdown, attendance percentages, and formal signature section.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={isExporting}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* EXCEL OPTION */}
                <div className="p-5 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/60 transition flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Excel Spreadsheet (.xlsx)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Dual-sheet workbook containing comprehensive raw daily session logs in Sheet 1, and student-by-student cumulative percentage calculation in Sheet 2.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    disabled={isExporting}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Excel</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step === 'FORMAT' ? (
            <button
              type="button"
              onClick={() => setStep('RANGE')}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Range Selection</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          {step === 'RANGE' ? (
            <button
              type="button"
              onClick={() => setStep('FORMAT')}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <span>Download Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
