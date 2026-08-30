import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  PlusCircle,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Trash2,
  Edit3,
  Search,
  Filter,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sun,
  Flame,
  BookOpen,
  Info,
  CalendarCheck,
  X,
  FileText,
} from 'lucide-react';
import { AcademicCalendarEvent, AcademicEventCategory } from '../types';

interface AcademicCalendarViewProps {
  events: AcademicCalendarEvent[];
  onAddEvent?: (event: AcademicCalendarEvent) => void;
  onUpdateEvent?: (event: AcademicCalendarEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  isAdmin?: boolean; // When true, enables Exam Cell creation/edit/delete powers
  userRole?: string; // 'admin' | 'hod' | 'staff' | 'student' | 'public'
  userDepartment?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Category Styling Helper
export const getCategoryBadge = (category: AcademicEventCategory, isHoliday?: boolean) => {
  if (isHoliday) {
    return {
      label: 'College Holiday',
      bg: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
      dotBg: 'bg-rose-500',
      icon: Sun,
    };
  }
  switch (category) {
    case 'INTERNAL_ASSESSMENT':
      return {
        label: 'Internal Assessment (IAT)',
        bg: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300',
        dotBg: 'bg-indigo-600',
        icon: BookOpen,
      };
    case 'SEMESTER_EXAM':
      return {
        label: 'University Exam',
        bg: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
        dotBg: 'bg-amber-500',
        icon: Flame,
      };
    case 'HOLIDAY':
      return {
        label: 'College Holiday',
        bg: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
        dotBg: 'bg-rose-500',
        icon: Sun,
      };
    case 'ACADEMIC_MILESTONE':
      return {
        label: 'Academic Milestone',
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
        dotBg: 'bg-emerald-600',
        icon: CalendarCheck,
      };
    case 'COLLEGE_EVENT':
      return {
        label: 'College Event',
        bg: 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300',
        dotBg: 'bg-sky-500',
        icon: Sparkles,
      };
    case 'CIRCULAR':
    default:
      return {
        label: 'Circular / Notice',
        bg: 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
        dotBg: 'bg-slate-500',
        icon: Info,
      };
  }
};

// Generate .ics File for calendar export
export const exportToICalendar = (events: AcademicCalendarEvent[]) => {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatICSDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T000000Z`;
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jaya Sakthi Engineering College//Exam Cell Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:JSEC Academic Calendar & Exam Schedules',
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  events.forEach((ev) => {
    const uid = `${ev.id}@jayasakthi.edu.in`;
    const dtStart = formatICSDate(ev.startDate);
    // End date + 1 day for inclusive all-day events in iCal
    const endBase = ev.endDate ? new Date(ev.endDate) : new Date(ev.startDate);
    endBase.setDate(endBase.getDate() + 1);
    const dtEnd = formatICSDate(endBase.toISOString().split('T')[0]);

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:${uid}`);
    icsContent.push(`DTSTAMP:${formatICSDate(new Date().toISOString().split('T')[0])}`);
    icsContent.push(`DTSTART;VALUE=DATE:${ev.startDate.replace(/-/g, '')}`);
    icsContent.push(`DTEND;VALUE=DATE:${(ev.endDate || ev.startDate).replace(/-/g, '')}`);
    icsContent.push(`SUMMARY:${ev.title.replace(/,/g, '\\,')}`);
    icsContent.push(
      `DESCRIPTION:${(ev.description || 'Published by Central Exam Cell, JSEC').replace(/\n/g, '\\n').replace(/,/g, '\\,')}`
    );
    if (ev.venueOrLocation) {
      icsContent.push(`LOCATION:${ev.venueOrLocation.replace(/,/g, '\\,')}`);
    }
    icsContent.push(`CATEGORIES:${ev.category}`);
    icsContent.push('STATUS:CONFIRMED');
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'JSEC_Academic_Calendar_2026_27.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = ({
  events = [],
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  isAdmin = false,
  userDepartment,
}) => {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 7, 1)); // Aug 2026 by default
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-08-20');
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyHolidays, setOnlyHolidays] = useState(false);

  // Modal State for Exam Cell
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicCalendarEvent | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<AcademicEventCategory>('INTERNAL_ASSESSMENT');
  const [formStartDate, setFormStartDate] = useState('2026-08-20');
  const [formEndDate, setFormEndDate] = useState('2026-08-27');
  const [formIsHoliday, setFormIsHoliday] = useState(false);
  const [formPriority, setFormPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('HIGH');
  const [formTargetAudience, setFormTargetAudience] = useState('ALL');
  const [formSemester, setFormSemester] = useState<number>(0);
  const [formVenue, setFormVenue] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPublishedBy, setFormPublishedBy] = useState('Central Exam Cell');
  const [formError, setFormError] = useState('');

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar Grid Calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchDesc = ev.description?.toLowerCase().includes(q) || false;
        const matchVenue = ev.venueOrLocation?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchDesc && !matchVenue) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && ev.category !== selectedCategory) {
        return false;
      }

      // Holidays only
      if (onlyHolidays && !ev.isHoliday && ev.category !== 'HOLIDAY') {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedCategory, onlyHolidays]);

  // Check if a specific date has events
  const getEventsForDate = (dateStr: string) => {
    return events.filter((ev) => {
      if (ev.endDate) {
        return dateStr >= ev.startDate && dateStr <= ev.endDate;
      }
      return ev.startDate === dateStr;
    });
  };

  // Events on the user's currently selected date in Calendar view
  const selectedDateEvents = useMemo(() => {
    if (!selectedDateStr) return [];
    return getEventsForDate(selectedDateStr);
  }, [events, selectedDateStr]);

  // Stats calculation
  const totalHolidays = events.filter((e) => e.isHoliday || e.category === 'HOLIDAY').length;
  const totalAssessments = events.filter((e) => e.category === 'INTERNAL_ASSESSMENT' || e.category === 'SEMESTER_EXAM').length;
  const totalEvents = events.length;

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setFormTitle('');
    setFormCategory('INTERNAL_ASSESSMENT');
    setFormStartDate(selectedDateStr || '2026-08-20');
    setFormEndDate(selectedDateStr || '2026-08-27');
    setFormIsHoliday(false);
    setFormPriority('HIGH');
    setFormTargetAudience('ALL');
    setFormSemester(0);
    setFormVenue('Campus Academic Blocks');
    setFormDescription('');
    setFormPublishedBy('Central Exam Cell');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (ev: AcademicCalendarEvent) => {
    setEditingEvent(ev);
    setFormTitle(ev.title);
    setFormCategory(ev.category);
    setFormStartDate(ev.startDate);
    setFormEndDate(ev.endDate || ev.startDate);
    setFormIsHoliday(ev.isHoliday || false);
    setFormPriority(ev.priority || 'NORMAL');
    setFormTargetAudience(ev.targetAudience || 'ALL');
    setFormSemester(ev.semester || 0);
    setFormVenue(ev.venueOrLocation || '');
    setFormDescription(ev.description || '');
    setFormPublishedBy(ev.publishedBy || 'Central Exam Cell');
    setFormError('');
    setIsModalOpen(true);
  };

  // Form Submit Handler
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Please enter event title');
      return;
    }
    if (!formStartDate) {
      setFormError('Please select start date');
      return;
    }

    const payload: AcademicCalendarEvent = {
      id: editingEvent ? editingEvent.id : `EVENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      startDate: formStartDate,
      endDate: formEndDate && formEndDate !== formStartDate ? formEndDate : undefined,
      category: formCategory,
      targetAudience: formTargetAudience,
      isHoliday: formIsHoliday || formCategory === 'HOLIDAY',
      semester: formSemester > 0 ? Number(formSemester) : undefined,
      priority: formPriority,
      venueOrLocation: formVenue.trim() || undefined,
      publishedBy: formPublishedBy.trim() || 'Central Exam Cell',
      createdAt: editingEvent ? editingEvent.createdAt : new Date().toISOString(),
    };

    if (editingEvent && onUpdateEvent) {
      onUpdateEvent(payload);
    } else if (onAddEvent) {
      onAddEvent(payload);
    }

    setIsModalOpen(false);
  };

  // Quick Preset Handlers
  const handleApplyPreset = (presetType: 'IAT' | 'HOLIDAY' | 'LAST_WORKING_DAY' | 'AU_EXAM') => {
    if (presetType === 'IAT') {
      setFormTitle('Internal Assessment Test - 2 (IAT-2)');
      setFormCategory('INTERNAL_ASSESSMENT');
      setFormStartDate('2026-09-24');
      setFormEndDate('2026-10-01');
      setFormIsHoliday(false);
      setFormPriority('URGENT');
      setFormTargetAudience('ALL');
      setFormVenue('Central Examination Complex');
      setFormDescription('Centralized assessment test for units 3 & 4. Hall tickets mandatory.');
    } else if (presetType === 'HOLIDAY') {
      setFormTitle('Ayutha Pooja & Vijaya Dasami Holidays');
      setFormCategory('HOLIDAY');
      setFormStartDate('2026-10-19');
      setFormEndDate('2026-10-20');
      setFormIsHoliday(true);
      setFormPriority('HIGH');
      setFormTargetAudience('ALL');
      setFormVenue('All Academic Blocks Closed');
      setFormDescription('Declared institutional holidays for all departments.');
    } else if (presetType === 'LAST_WORKING_DAY') {
      setFormTitle('Last Working Day for Odd Semester 2026');
      setFormCategory('ACADEMIC_MILESTONE');
      setFormStartDate('2026-11-21');
      setFormEndDate('2026-11-21');
      setFormIsHoliday(false);
      setFormPriority('HIGH');
      setFormTargetAudience('ALL');
      setFormVenue('Campus Wide');
      setFormDescription('Final attendance cutoff and publication of eligible student lists for Anna University exams.');
    } else if (presetType === 'AU_EXAM') {
      setFormTitle('Anna University End-Semester Theory Examinations');
      setFormCategory('SEMESTER_EXAM');
      setFormStartDate('2026-12-10');
      setFormEndDate('2026-12-30');
      setFormIsHoliday(false);
      setFormPriority('URGENT');
      setFormTargetAudience('ALL');
      setFormVenue('University Examination Center Halls');
      setFormDescription('Controller of Examinations (ACOE) Anna University End Semester Examination schedule.');
    }
  };

  // Printable action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-[#0B2238] via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-blue-900/50 print:border-none print:shadow-none print:bg-white print:text-black">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Academic Calendar & Important Dates
                </h2>
                <p className="text-xs text-blue-200/80 font-medium">
                  Official Jaya Sakthi Engineering College schedule • Managed by Central Exam Cell
                </p>
              </div>
            </div>

            {/* Quick Badges / Stats */}
            <div className="flex flex-wrap items-center gap-2 pt-2 print:hidden">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/10 text-white">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                {totalAssessments} Exam Windows
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 border border-rose-400/30 text-rose-200">
                <Sun className="w-3.5 h-3.5 text-rose-300" />
                {totalHolidays} Declared Holidays
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-200">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-300" />
                {totalEvents} Total Milestones
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Exam Cell Admin Mode
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <button
              onClick={() => exportToICalendar(filteredEvents)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all shadow-xs cursor-pointer"
              title="Download .ICS file to add to Google Calendar or Outlook"
            >
              <Download className="w-4 h-4 text-amber-300" />
              Sync to Google / Apple Calendar (.ics)
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-200" />
              Print Gazette
            </button>

            {isAdmin && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                Post New Date / Schedule
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and View Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        {/* Left: Search and Category Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dates, IAT, holidays, events..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              <option value="INTERNAL_ASSESSMENT">Internal Assessments (IAT)</option>
              <option value="SEMESTER_EXAM">University Semester Exams</option>
              <option value="HOLIDAY">College Holidays</option>
              <option value="ACADEMIC_MILESTONE">Academic Milestones</option>
              <option value="COLLEGE_EVENT">College Events & Symposiums</option>
              <option value="CIRCULAR">Notices & Circulars</option>
            </select>
          </div>

          {/* Holiday Toggle Pill */}
          <button
            onClick={() => setOnlyHolidays(!onlyHolidays)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              onlyHolidays
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Holidays Only
          </button>
        </div>

        {/* Right: View Mode Toggle (Calendar vs Timeline List) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-[#0B2238] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Month Grid
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'agenda'
                ? 'bg-white dark:bg-slate-900 text-[#0B2238] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Timeline Agenda ({filteredEvents.length})
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Grid Container (7 Cols on desktop) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            {/* Month Header with Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                  {MONTH_NAMES[month]} {year}
                </h3>
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day of week headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-slate-800">
              {DAYS_OF_WEEK.map((d, i) => (
                <div key={d} className={i === 0 ? 'text-rose-500 font-bold' : ''}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Previous Month trailing days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => {
                const dayNum = prevMonthDays - firstDayIndex + i + 1;
                return (
                  <div
                    key={`prev-${i}`}
                    className="min-h-[72px] md:min-h-[88px] p-1.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 text-slate-300 dark:text-slate-600 text-xs font-semibold flex flex-col justify-between select-none"
                  >
                    <span>{dayNum}</span>
                  </div>
                );
              })}

              {/* Current Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const padMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
                const padDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                const dateStr = `${year}-${padMonth}-${padDay}`;

                const dayEvents = getEventsForDate(dateStr);
                const isSelected = selectedDateStr === dateStr;
                const isSunday = new Date(year, month, dayNum).getDay() === 0;
                const hasHoliday = dayEvents.some((e) => e.isHoliday || e.category === 'HOLIDAY');
                const hasAssessment = dayEvents.some((e) => e.category === 'INTERNAL_ASSESSMENT' || e.category === 'SEMESTER_EXAM');

                return (
                  <div
                    key={`curr-${dayNum}`}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`min-h-[72px] md:min-h-[88px] p-1.5 md:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left group relative ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : hasHoliday
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/70 hover:border-rose-300'
                        : hasAssessment
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/70 hover:border-indigo-300'
                        : 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-blue-300 hover:bg-blue-50/20'
                    }`}
                  >
                    {/* Top row: Day Number + Sunday / Holiday Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : hasHoliday || isSunday
                            ? 'text-rose-600 dark:text-rose-400 font-black'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {hasHoliday && (
                        <span className="text-[10px] text-rose-500 font-bold" title="Holiday">
                          🏖️
                        </span>
                      )}
                    </div>

                    {/* Events indicators / mini titles */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const badge = getCategoryBadge(ev.category, ev.isHoliday);
                        return (
                          <div
                            key={ev.id}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate leading-tight border ${badge.bg}`}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-500 block leading-tight">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Day Inspector & Upcoming Timeline (4 Cols on desktop) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Selected Date Detail Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Selected Date
                  </span>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h4>
                </div>

                {isAdmin && (
                  <button
                    onClick={handleOpenAddModal}
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-400 rounded-xl transition-colors cursor-pointer"
                    title="Add Event on this date"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Events for this day */}
              {selectedDateEvents.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    No special exams or holidays scheduled on this date.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Regular academic timetable and classes in progress.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {selectedDateEvents.map((ev) => {
                    const badge = getCategoryBadge(ev.category, ev.isHoliday);
                    const IconComponent = badge.icon;
                    return (
                      <div
                        key={ev.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          ev.isHoliday
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}
                          >
                            <IconComponent className="w-3 h-3" />
                            {badge.label}
                          </span>

                          {isAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenEditModal(ev)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded-md"
                                title="Edit Event"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${ev.title}"?`)) {
                                    onDeleteEvent && onDeleteEvent(ev.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                                title="Delete Event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <h5 className="text-xs font-black text-slate-900 dark:text-white mt-2">
                          {ev.title}
                        </h5>

                        {ev.description && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            {ev.description}
                          </p>
                        )}

                        {/* Event Metadata (Venue, Dates) */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/40 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                          {ev.venueOrLocation && (
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              {ev.venueOrLocation}
                            </span>
                          )}
                          {ev.targetAudience && (
                            <span className="flex items-center gap-1 font-medium">
                              <Users className="w-3 h-3 text-blue-500" />
                              Audience: {ev.targetAudience}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Upcoming Milestones List */}
            <div className="bg-gradient-to-br from-slate-900 to-[#0B2238] text-white rounded-3xl p-5 border border-blue-900/40 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-blue-800/40 pb-2.5">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Upcoming Key Milestones
                </h4>
                <span className="text-[10px] text-blue-200/70 font-mono">2026-27</span>
              </div>

              <div className="space-y-2.5">
                {events.slice(0, 4).map((ev) => {
                  const badge = getCategoryBadge(ev.category, ev.isHoliday);
                  return (
                    <div
                      key={`key-${ev.id}`}
                      onClick={() => setSelectedDateStr(ev.startDate)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${badge.dotBg}`} />
                          <span className="text-xs font-bold text-white truncate block">
                            {ev.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-200/70 block">
                          {ev.startDate} {ev.endDate ? `to ${ev.endDate}` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-amber-300 shrink-0">
                        {ev.isHoliday ? 'Holiday' : ev.category === 'INTERNAL_ASSESSMENT' ? 'IAT' : 'AU'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Timeline Agenda View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Academic Master Timeline
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive chronological gazette of exams, assessment cycles, and gazetted holidays.
              </p>
            </div>

            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
              Showing {filteredEvents.length} events
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <CalendarCheck className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                No academic events match the current filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setOnlyHolidays(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEvents.map((ev) => {
                const badge = getCategoryBadge(ev.category, ev.isHoliday);
                const IconComponent = badge.icon;
                const isMultiDay = ev.endDate && ev.endDate !== ev.startDate;

                return (
                  <div
                    key={`agenda-${ev.id}`}
                    className="py-4.5 flex flex-col md:flex-row md:items-start justify-between gap-4 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 p-3 rounded-2xl transition-all"
                  >
                    {/* Left: Date Box & Main Details */}
                    <div className="flex items-start gap-4">
                      {/* Date Badge */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 text-center shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {new Date(ev.startDate + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                          })}
                        </span>
                        <span className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                          {new Date(ev.startDate + 'T00:00:00').getDate()}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400">
                          {new Date(ev.startDate + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                          >
                            <IconComponent className="w-3 h-3" />
                            {badge.label}
                          </span>

                          {isMultiDay && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Until {ev.endDate}
                            </span>
                          )}

                          {ev.priority === 'URGENT' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-slate-950">
                              Urgent
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                          {ev.title}
                        </h4>

                        {ev.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                            {ev.description}
                          </p>
                        )}

                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-500">
                          {ev.venueOrLocation && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-500" />
                              {ev.venueOrLocation}
                            </span>
                          )}
                          {ev.publishedBy && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 text-blue-500" />
                              Posted by: {ev.publishedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Admin Actions & Audience Pill */}
                    <div className="flex md:flex-col items-end justify-between gap-3 shrink-0">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {ev.targetAudience === 'ALL' ? 'All Roles' : ev.targetAudience}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(ev)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Event"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${ev.title}"?`)) {
                                onDeleteEvent && onDeleteEvent(ev.id);
                              }
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Exam Cell Modal: Add / Edit Academic Date or Schedule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0B2238] to-blue-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingEvent ? 'Edit Academic Event / Notice' : 'Post Academic Date / Exam Schedule'}
                  </h3>
                  <p className="text-[11px] text-blue-200/80">
                    Exam Cell centralized broadcast to students, faculty, and HODs
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/10 text-blue-200 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            {!editingEvent && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                  Quick Fill:
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('IAT')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 shrink-0"
                >
                  ⚡ IAT Window
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('HOLIDAY')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 shrink-0"
                >
                  🏖️ Festival Holiday
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('LAST_WORKING_DAY')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 shrink-0"
                >
                  🏁 Last Working Day
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('AU_EXAM')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200 shrink-0"
                >
                  🎓 AU Theory Exams
                </button>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event / Milestone Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Internal Assessment Test - 1 (IAT-1), Deepavali Holiday"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Category & Holiday Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const val = e.target.value as AcademicEventCategory;
                      setFormCategory(val);
                      if (val === 'HOLIDAY') setFormIsHoliday(true);
                    }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="INTERNAL_ASSESSMENT">Internal Assessment (IAT)</option>
                    <option value="SEMESTER_EXAM">Anna University Semester Exam</option>
                    <option value="HOLIDAY">College / Public Holiday</option>
                    <option value="ACADEMIC_MILESTONE">Academic Milestone</option>
                    <option value="COLLEGE_EVENT">College Event / Symposium</option>
                    <option value="CIRCULAR">Notice / Circular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Holiday Status
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsHoliday}
                      onChange={(e) => setFormIsHoliday(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Mark as College Holiday (No Classes)
                    </span>
                  </label>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    End Date (Optional for single day)
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    min={formStartDate}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Target Audience & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formTargetAudience}
                    onChange={(e) => setFormTargetAudience(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All College (Students & Faculty)</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="FACULTY">Faculty & Staff Only</option>
                    <option value="CSE">CSE Department</option>
                    <option value="AIDS">AIDS Department</option>
                    <option value="MECH">Mechanical Department</option>
                    <option value="BIO-TECH">Biotechnology</option>
                    <option value="BIO-MED">Biomedical</option>
                    <option value="PHARMA">Pharmaceutical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Notice Level
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent (Red Alert)</option>
                    <option value="LOW">Low / Informational</option>
                  </select>
                </div>
              </div>

              {/* Venue & Published By */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Venue / Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="e.g., Central Examination Complex, Auditorium"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Published By
                  </label>
                  <input
                    type="text"
                    value={formPublishedBy}
                    onChange={(e) => setFormPublishedBy(e.target.value)}
                    placeholder="e.g., Central Exam Cell"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Specific Instructions
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide any additional rules, hall ticket requirements, or schedule details..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-400/20 transition-all cursor-pointer"
                >
                  {editingEvent ? 'Save Changes' : 'Broadcast to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
