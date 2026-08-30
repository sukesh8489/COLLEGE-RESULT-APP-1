import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Building2,
  Calendar,
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  Save,
  Download,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles,
  ArrowLeft,
  Check,
  X,
  Layers,
  BarChart3,
  FileEdit,
  ClipboardCheck,
  UserCheck,
  FileText,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  CheckCheck,
  RotateCcw,
  CheckCircle,
  Cpu,
  Compass,
  Landmark,
  Shield,
  Plus,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import {
  AcademicCalendarEvent,
  CurrentUser,
  DegreeType,
  DepartmentInfo,
  EntryPermissionPolicy,
  EntryWindowRule,
  ExamRecord,
  ExamSchedule,
  ExamType,
  Student,
  Subject,
  SubjectMark,
  HODAccount,
  StaffMember,
} from '../types';
import {
  saveStudentInFirestore,
  saveSubjectInFirestore,
  deleteSubjectFromFirestore,
} from '../lib/firestoreService';
import { StaffMarksPermissionsManager } from './StaffMarksPermissionsManager';
import { AdminPortal } from './AdminPortal';

interface ExamCellPortalProps {
  currentUser: CurrentUser;
  departments: DepartmentInfo[];
  students: Student[];
  subjects: Subject[];
  exams: ExamSchedule[];
  academicEvents: AcademicCalendarEvent[];
  onUpdateStudents: (updater: (prev: Student[]) => Student[]) => void;
  entryPolicy?: EntryPermissionPolicy;
  onUpdateEntryPolicy?: (policy: EntryPermissionPolicy) => void;
  onLogout: () => void;
  hods?: HODAccount[];
  staffMembers?: StaffMember[];
  onAddDepartment?: (dept: DepartmentInfo) => void;
  onDeleteDepartment?: (code: string) => void;
  onAddHod?: (hod: HODAccount) => void;
  onDeleteHod?: (id: string) => void;
  onAddStaff?: (staff: StaffMember) => void;
  onDeleteStaff?: (id: string) => void;
  onAddSubject?: (subj: Subject) => void;
  onDeleteSubject?: (code: string) => void;
}

export const ExamCellPortal: React.FC<ExamCellPortalProps> = ({
  currentUser,
  departments,
  students,
  subjects,
  exams,
  academicEvents,
  onUpdateStudents,
  entryPolicy = {
    isMarksEntryGlobalEnabled: false,
    windowRules: [],
    updatedAt: new Date().toISOString(),
  },
  onUpdateEntryPolicy,
  onLogout,
  hods = [],
  staffMembers = [],
  onAddDepartment,
  onDeleteDepartment,
  onAddHod,
  onDeleteHod,
  onAddStaff,
  onDeleteStaff,
  onAddSubject,
  onDeleteSubject,
}) => {
  // Navigation & Progressive Scope Selection state:
  // Step 1: Degree -> Step 2: Branch -> Step 3: Semester -> Step 4: Exam -> Step 5: Subject -> Mark Entry Table
  const [selectedDegree, setSelectedDegree] = useState<DegreeType | null>('B.E');
  const [selectedDept, setSelectedDept] = useState<string | null>('CSE');
  const [selectedSem, setSelectedSem] = useState<number | null>(6);
  const [selectedAssessment, setSelectedAssessment] = useState<ExamType | null>('CAT-1');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string | null>(null);

  // Subject Addition Modal state
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCredits, setNewSubjCredits] = useState(3);

  // Primary Mode: 'evaluation' (Main mark entry table) | 'admin_portal' (Executive Admin) | 'permissions' (Staff Entry Windows)
  const [activeTab, setActiveTab] = useState<'evaluation' | 'admin_portal' | 'permissions'>('evaluation');

  // Mark Entry Table Local Edit State: { [regNo]: { rawMarks: number | string; attendancePct: number; status: 'PASS' | 'FAIL' | 'ABSENT' } }
  const [studentMarksState, setStudentMarksState] = useState<{
    [regNo: string]: { rawMarks: number | string; attendancePct: number; status: 'PASS' | 'FAIL' | 'ABSENT' };
  }>({});

  // Assessment Options list with weightage info (CAT exams on left, Model exams on right)
  const CAT_ASSESSMENT_LIST: { id: ExamType; label: string; weight: number; desc: string }[] = [
    { id: 'CAT-1', label: 'CAT-1', weight: 50, desc: 'Continuous Assessment Test 1' },
    { id: 'CAT-2', label: 'CAT-2', weight: 50, desc: 'Continuous Assessment Test 2' },
    { id: 'CAT-3', label: 'CAT-3', weight: 50, desc: 'Continuous Assessment Test 3' },
  ];

  const MODEL_ASSESSMENT_LIST: { id: ExamType; label: string; weight: number; desc: string }[] = [
    { id: 'M-1', label: 'Model-1', weight: 100, desc: 'Model Examination 1' },
    { id: 'M-2', label: 'Model-2', weight: 100, desc: 'Model Examination 2' },
    { id: 'M-3', label: 'Model-3', weight: 100, desc: 'Model Examination 3' },
  ];

  const isCatExam = selectedAssessment === 'CAT-1' || selectedAssessment === 'CAT-2' || selectedAssessment === 'CAT-3';
  const maxMarksAllowed = isCatExam ? 50 : 100;
  const [targetScaleWeight, setTargetScaleWeight] = useState<number>(50);
  const [searchFilter, setSearchFilter] = useState('');
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  // Helper to determine degree for any department
  const resolveDeptDegree = (dept: DepartmentInfo): string => {
    if (dept.degree) return dept.degree;
    if (['PHARMA', 'BIO-TECH', 'IT', 'AIDS', 'AIDA', 'AI&DA'].includes(dept.code.toUpperCase())) return 'B.Tech';
    if (dept.code.toUpperCase() === 'S&H') return 'S&H';
    return 'B.E';
  };

  // Compute available branches dynamically based on configured departments and degree
  const degreeDepts = useMemo(() => {
    if (!selectedDegree) return [];
    return departments
      .filter((d) => {
        const dDegree = resolveDeptDegree(d);
        return dDegree === selectedDegree;
      })
      .map((d, idx) => ({
        code: d.code,
        name: d.name,
        alias: d.code,
        degree: resolveDeptDegree(d),
        order: idx + 1,
      }));
  }, [departments, selectedDegree]);

  // Adjust target scale weight when assessment changes
  useEffect(() => {
    if (selectedAssessment === 'CAT-1' || selectedAssessment === 'CAT-2' || selectedAssessment === 'CAT-3') {
      setTargetScaleWeight(50);
    } else {
      setTargetScaleWeight(100);
    }
  }, [selectedAssessment]);

  // Fetch subjects for selected Department & Semester from dynamic subjects state
  const deptSemesterSubjects = useMemo(() => {
    if (!selectedDept || !selectedSem) return [];
    return subjects.filter(
      (s) =>
        (s.department === selectedDept || (selectedDept === 'BME' && s.department === 'BIO-MED')) &&
        s.semester === selectedSem
    );
  }, [subjects, selectedDept, selectedSem]);

  const handleQuickAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjCode.trim() || !newSubjName.trim() || !selectedDept || !selectedSem) return;
    const newSubj: Subject = {
      code: newSubjCode.trim().toUpperCase(),
      name: newSubjName.trim(),
      department: selectedDept,
      semester: selectedSem,
      credits: newSubjCredits,
      maxMarks: 100,
    };
    try {
      await saveSubjectInFirestore(newSubj);
      if (onAddSubject) onAddSubject(newSubj);
      setSelectedSubjectCode(newSubj.code);
      setNewSubjCode('');
      setNewSubjName('');
      setShowAddSubjectModal(false);
    } catch (err: any) {
      console.error('Error adding subject:', err);
    }
  };

  const handleQuickDeleteSubject = async (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await deleteSubjectFromFirestore(code);
      if (selectedSubjectCode === code) {
        setSelectedSubjectCode(null);
      }
    } catch (err: any) {
      console.error('Error removing subject:', err);
    }
  };

  // Auto-select first subject if not selected or invalid for current semester
  useEffect(() => {
    if (deptSemesterSubjects.length > 0) {
      if (!selectedSubjectCode || !deptSemesterSubjects.some((s) => s.code === selectedSubjectCode)) {
        setSelectedSubjectCode(deptSemesterSubjects[0].code);
      }
    }
  }, [deptSemesterSubjects, selectedSubjectCode]);

  // Active Subject details
  const activeSubject = useMemo(() => {
    if (!selectedSubjectCode || deptSemesterSubjects.length === 0) return null;
    return deptSemesterSubjects.find((s) => s.code === selectedSubjectCode) || null;
  }, [deptSemesterSubjects, selectedSubjectCode]);

  // Students enrolled in selected Department & Semester
  const activeCohortStudents = useMemo(() => {
    if (!selectedDept || !selectedSem) return [];
    return students
      .filter((s) => (s.department === selectedDept || (selectedDept === 'BME' && s.department === 'BIO-MED')) && s.currentSemester === selectedSem)
      .sort((a, b) => a.registerNumber.localeCompare(b.registerNumber));
  }, [students, selectedDept, selectedSem]);

  // Check if staff marks entry is currently permitted for this subject & assessment
  const isStaffMarksEntryPermittedForSubject = useMemo(() => {
    if (entryPolicy?.isMarksEntryGlobalEnabled) return true;
    if (!activeSubject || !selectedDept || !selectedSem || !selectedAssessment) return false;
    const now = new Date();
    return (entryPolicy?.windowRules || []).some((r) => {
      if (!r.isEnabled) return false;
      if (r.startDate && new Date(r.startDate) > now) return false;
      if (r.endDate && new Date(r.endDate) < now) return false;
      if (r.department && r.department !== selectedDept) return false;
      if (r.semester && r.semester !== selectedSem) return false;
      if (r.examType && r.examType !== selectedAssessment) return false;
      if (r.subjectCode && r.subjectCode !== activeSubject.code) return false;
      return true;
    });
  }, [entryPolicy, selectedDept, selectedSem, selectedAssessment, activeSubject]);

  // Active rules count
  const activeRulesCount = useMemo(() => {
    return (entryPolicy?.windowRules || []).filter((r) => r.isEnabled).length;
  }, [entryPolicy]);

  // Quick grant evaluation window for active subject
  const handleQuickGrantWindow = (days: number = 3) => {
    if (!onUpdateEntryPolicy || !activeSubject || !selectedDept || !selectedSem || !selectedAssessment) return;
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    const newRule: EntryWindowRule = {
      id: `rule-${Date.now()}-${selectedDept}-${selectedSem}-${activeSubject.code}`,
      title: `${selectedDept} Sem ${selectedSem} - ${activeSubject.code} (${selectedAssessment}) Window`,
      department: selectedDept,
      semester: selectedSem,
      examType: selectedAssessment,
      subjectCode: activeSubject.code,
      startDate: now.toISOString(),
      endDate,
      isEnabled: true,
      createdAt: now.toISOString(),
      createdBy: 'Exam Cell Admin',
      reason: `Authorized ${days}-day faculty marks evaluation window.`,
    };

    onUpdateEntryPolicy({
      ...entryPolicy,
      windowRules: [newRule, ...(entryPolicy.windowRules || [])],
      updatedAt: now.toISOString(),
    });

    setSaveStatus({
      type: 'success',
      text: `Staff permission granted: Faculty can now enter & edit marks for ${activeSubject.code} (${selectedAssessment}) for ${days} days.`,
    });
  };

  // Quick lock evaluation for active subject
  const handleQuickLockWindow = () => {
    if (!onUpdateEntryPolicy || !activeSubject || !selectedDept || !selectedSem || !selectedAssessment) return;
    const updatedRules = (entryPolicy.windowRules || []).map((r) => {
      const matchDept = !r.department || r.department === selectedDept;
      const matchSem = !r.semester || r.semester === selectedSem;
      const matchExam = !r.examType || r.examType === selectedAssessment;
      const matchSub = !r.subjectCode || r.subjectCode === activeSubject.code;
      if (matchDept && matchSem && matchExam && matchSub) {
        return { ...r, isEnabled: false };
      }
      return r;
    });

    onUpdateEntryPolicy({
      ...entryPolicy,
      isMarksEntryGlobalEnabled: false,
      windowRules: updatedRules,
      updatedAt: new Date().toISOString(),
    });

    setSaveStatus({
      type: 'success',
      text: `Staff permission locked for ${activeSubject.code} (${selectedAssessment}). Faculty mark entry is now restricted.`,
    });
  };

  // Initialize or load marks when Cohort, Assessment, or Subject changes
  useEffect(() => {
    if (!activeSubject || !selectedSem || !selectedAssessment) return;

    setSaveStatus(null);
    const nextState: {
      [regNo: string]: { rawMarks: number | string; attendancePct: number; status: 'PASS' | 'FAIL' | 'ABSENT' };
    } = {};

    activeCohortStudents.forEach((st) => {
      const existingExam = st.examRecords?.find(
        (r) => r.semester === selectedSem && r.examType === selectedAssessment
      );
      const existingMark = existingExam?.marks?.find((m) => m.subjectCode === activeSubject.code);
      const defaultAtt = st.attendance?.percentage ?? 85;

      if (existingMark) {
        nextState[st.registerNumber] = {
          rawMarks: existingMark.status === 'ABSENT' ? -1 : existingMark.marksObtained,
          attendancePct: defaultAtt,
          status: existingMark.status,
        };
      } else {
        nextState[st.registerNumber] = {
          rawMarks: '',
          attendancePct: defaultAtt,
          status: 'PASS',
        };
      }
    });

    setStudentMarksState(nextState);
  }, [activeCohortStudents, selectedAssessment, activeSubject, selectedSem]);

  // Handle Mark / Attendance change for a single student
  const handleMarkChange = (regNo: string, val: string) => {
    setStudentMarksState((prev) => {
      const current = prev[regNo] || { rawMarks: '', attendancePct: 85, status: 'PASS' };

      if (val === '' || val === undefined) {
        return {
          ...prev,
          [regNo]: { ...current, rawMarks: '', status: 'PASS' },
        };
      }

      if (val === '-1' || val.toUpperCase() === 'AB' || val.toUpperCase() === 'ABSENT') {
        return {
          ...prev,
          [regNo]: { ...current, rawMarks: -1, status: 'ABSENT' },
        };
      }

      const num = Number(val);
      if (isNaN(num)) return prev;

      const clamped = Math.max(0, Math.min(num, maxMarksAllowed));
      const passCutoff = maxMarksAllowed * 0.5;

      return {
        ...prev,
        [regNo]: {
          ...current,
          rawMarks: clamped,
          status: clamped >= passCutoff ? 'PASS' : 'FAIL',
        },
      };
    });
  };

  const handleAttendanceChange = (regNo: string, val: string) => {
    const num = Math.max(0, Math.min(Number(val) || 0, 100));
    setStudentMarksState((prev) => ({
      ...prev,
      [regNo]: {
        ...(prev[regNo] || { rawMarks: '', attendancePct: 85, status: 'PASS' }),
        attendancePct: num,
      },
    }));
  };

  const handleStatusToggle = (regNo: string, status: 'PASS' | 'FAIL' | 'ABSENT') => {
    setStudentMarksState((prev) => {
      const current = prev[regNo] || { rawMarks: '', attendancePct: 85, status: 'PASS' };
      let newMarks = current.rawMarks;
      if (status === 'ABSENT') newMarks = -1;
      else if (newMarks === -1) newMarks = isCatExam ? 25 : 50;

      return {
        ...prev,
        [regNo]: {
          ...current,
          status,
          rawMarks: newMarks,
        },
      };
    });
  };

  // Convert raw mark into target internal scale
  const calculateScaledMark = (raw: number | string): { scaled: number | string; label: string } => {
    if (raw === '' || raw === undefined) return { scaled: '-', label: '-' };
    if (raw === -1) return { scaled: 'AB', label: 'ABSENT' };
    const num = Number(raw);
    if (isNaN(num)) return { scaled: '-', label: '-' };

    if (maxMarksAllowed === 50) {
      return {
        scaled: num,
        label: `${num} / 50`,
      };
    }

    return {
      scaled: num,
      label: `${num} / 100`,
    };
  };

  // Summary Metrics for the current subject
  const metrics = useMemo(() => {
    const totalStudents = activeCohortStudents.length;
    let enteredCount = 0;
    let passCount = 0;
    let failCount = 0;
    let absentCount = 0;
    let marksSum = 0;

    activeCohortStudents.forEach((st) => {
      const data = studentMarksState[st.registerNumber];
      if (data && data.rawMarks !== '') {
        enteredCount++;
        if (data.status === 'ABSENT' || data.rawMarks === -1) {
          absentCount++;
        } else {
          const num = Number(data.rawMarks);
          marksSum += num;
          if (data.status === 'PASS') passCount++;
          else failCount++;
        }
      }
    });

    const appearedCount = enteredCount - absentCount;
    const avgMark = appearedCount > 0 ? (marksSum / appearedCount).toFixed(1) : '0';
    const passPct = appearedCount > 0 ? ((passCount / appearedCount) * 100).toFixed(1) : '0';

    return {
      totalStudents,
      enteredCount,
      appearedCount,
      passCount,
      failCount,
      absentCount,
      avgMark,
      passPct,
    };
  }, [activeCohortStudents, studentMarksState]);

  // Save / Publish Marks to Firestore and Local State
  const handleSaveAndPublishMarks = async () => {
    if (!activeSubject || !selectedSem || !selectedAssessment) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const updatedStudentsList: Student[] = [];

      for (const st of activeCohortStudents) {
        const state = studentMarksState[st.registerNumber];
        if (!state || state.rawMarks === '') continue;

        const isAbsent = state.status === 'ABSENT' || state.rawMarks === -1;
        const marksObtained = isAbsent ? 0 : Number(state.rawMarks) || 0;
        const status = isAbsent ? 'ABSENT' : state.status;

        const newSubjectMark: SubjectMark = {
          subjectCode: activeSubject.code,
          subjectName: activeSubject.name,
          maxMarks: maxMarksAllowed,
          marksObtained,
          status,
        };

        const existingRecords = st.examRecords ? [...st.examRecords] : [];
        const recordIndex = existingRecords.findIndex(
          (r) => r.semester === selectedSem && r.examType === selectedAssessment
        );

        let targetRecord: ExamRecord;

        if (recordIndex >= 0) {
          const prevRec = existingRecords[recordIndex];
          const updatedMarks = prevRec.marks ? [...prevRec.marks] : [];
          const smIndex = updatedMarks.findIndex((m) => m.subjectCode === activeSubject.code);

          if (smIndex >= 0) {
            updatedMarks[smIndex] = newSubjectMark;
          } else {
            updatedMarks.push(newSubjectMark);
          }

          const totalObt = updatedMarks.reduce((a, c) => a + (c.marksObtained || 0), 0);
          const maxTot = updatedMarks.reduce((a, c) => a + (c.maxMarks || 100), 0);
          const pct = maxTot > 0 ? (totalObt / maxTot) * 100 : 0;
          const hasFails = updatedMarks.some((m) => m.status === 'FAIL' || m.status === 'ABSENT');

          targetRecord = {
            ...prevRec,
            marks: updatedMarks,
            totalObtained: totalObt,
            maxTotal: maxTot,
            percentage: Number(pct.toFixed(2)),
            overallStatus: !hasFails && pct >= 50 ? 'PASS' : 'FAIL',
            enteredByStaffId: currentUser.id || 'EXAM_CELL',
            datePublished: new Date().toISOString(),
          };

          existingRecords[recordIndex] = targetRecord;
        } else {
          targetRecord = {
            id: `${st.registerNumber}-SEM${selectedSem}-${selectedAssessment}`,
            registerNumber: st.registerNumber,
            semester: selectedSem,
            examType: selectedAssessment,
            academicYear: st.batch || '2023-2027',
            marks: [newSubjectMark],
            totalObtained: marksObtained,
            maxTotal: maxMarksAllowed,
            percentage: Number(((marksObtained / maxMarksAllowed) * 100).toFixed(2)),
            overallStatus: status === 'PASS' ? 'PASS' : 'FAIL',
            enteredByStaffId: currentUser.id || 'EXAM_CELL',
            datePublished: new Date().toISOString(),
          };
          existingRecords.push(targetRecord);
        }

        const updatedStudent: Student = {
          ...st,
          examRecords: existingRecords,
          attendance: {
            totalClasses: st.attendance?.totalClasses || 100,
            attendedClasses: Math.round(((st.attendance?.totalClasses || 100) * state.attendancePct) / 100),
            percentage: state.attendancePct,
            semester: selectedSem,
            lastUpdated: new Date().toISOString(),
          },
        };

        await saveStudentInFirestore(updatedStudent);
        updatedStudentsList.push(updatedStudent);
      }

      if (updatedStudentsList.length > 0) {
        onUpdateStudents((prev) =>
          prev.map((s) => {
            const found = updatedStudentsList.find((u) => u.registerNumber === s.registerNumber);
            return found ? found : s;
          })
        );
      }

      setSaveStatus({
        type: 'success',
        text: `Marks successfully submitted & saved for ${activeSubject.code} (${selectedAssessment}). Central database synchronized.`,
      });
    } catch (err: any) {
      console.error(err);
      setSaveStatus({
        type: 'error',
        text: err?.message || 'Failed to save marks to database.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk Import handler
  const handleProcessBulkImport = () => {
    if (!bulkImportText.trim()) return;

    const lines = bulkImportText.trim().split('\n');
    let importedCount = 0;

    setStudentMarksState((prev) => {
      const next = { ...prev };

      lines.forEach((line) => {
        const parts = line.split(/[\t,;]+/).map((p) => p.trim());
        if (parts.length >= 2) {
          const regOrIndex = parts[0].toUpperCase();
          const markVal = parts[1];
          const attVal = parts[2];

          const matched = activeCohortStudents.find(
            (s, idx) => s.registerNumber.toUpperCase() === regOrIndex || String(idx + 1) === regOrIndex
          );

          if (matched) {
            const regNo = matched.registerNumber;
            const current = next[regNo] || { rawMarks: '', attendancePct: 85, status: 'PASS' };

            let rawMarks: number | string = '';
            let status: 'PASS' | 'FAIL' | 'ABSENT' = 'PASS';

            if (markVal.toUpperCase() === 'AB' || markVal.toUpperCase() === 'ABSENT' || markVal === '-1') {
              rawMarks = -1;
              status = 'ABSENT';
            } else {
              const num = Number(markVal);
              if (!isNaN(num)) {
                rawMarks = Math.max(0, Math.min(num, maxMarksAllowed));
                status = rawMarks >= maxMarksAllowed * 0.5 ? 'PASS' : 'FAIL';
              }
            }

            let attendancePct = current.attendancePct;
            if (attVal && !isNaN(Number(attVal))) {
              attendancePct = Math.max(0, Math.min(Number(attVal), 100));
            }

            next[regNo] = {
              rawMarks,
              attendancePct,
              status,
            };
            importedCount++;
          }
        }
      });

      return next;
    });

    setShowBulkImportModal(false);
    setBulkImportText('');
    setSaveStatus({
      type: 'success',
      text: `Imported marks for ${importedCount} students successfully. Click 'Save & Publish Marks' to commit changes.`,
    });
  };

  // Quick action: Autofill sample marks
  const handleAutofillDemoMarks = () => {
    setStudentMarksState((prev) => {
      const next = { ...prev };
      activeCohortStudents.forEach((st, idx) => {
        const seed = (st.registerNumber.slice(-3).charCodeAt(0) + idx * 7) % 45;
        let mark: number;
        let passThreshold: number;
        if (isCatExam) {
          mark = Math.min(50, Math.max(18, 26 + (seed % 24)));
          passThreshold = 25;
        } else {
          mark = Math.min(100, Math.max(38, 55 + seed));
          passThreshold = 50;
        }
        const att = Math.min(100, Math.max(68, 75 + (seed % 25)));
        next[st.registerNumber] = {
          rawMarks: mark,
          attendancePct: att,
          status: mark >= passThreshold ? 'PASS' : 'FAIL',
        };
      });
      return next;
    });
  };

  // Export Excel / CSV
  const handleExportExcel = () => {
    if (!activeSubject || !selectedDept || !selectedSem) return;
    const rows: string[] = [
      `JAYA SAKTHI ENGINEERING COLLEGE - OFFICE OF THE CONTROLLER OF EXAMINATIONS`,
      `EVALUATION MARKSHEET REPORT`,
      `Degree: ${selectedDegree} | Department: ${selectedDept} | Semester: ${selectedSem} | Examination: ${selectedAssessment}`,
      `Subject: ${activeSubject.code} - ${activeSubject.name} | Max Marks: ${maxMarksAllowed}`,
      `Total Enrolled: ${metrics.totalStudents} | Passed: ${metrics.passCount} | Failed: ${metrics.failCount} | Pass Rate: ${metrics.passPct}%`,
      ``,
      `"S.No","Registration Number","Student Name","Department","Semester","Subject Code","Subject Name","Attendance %","Marks (/${maxMarksAllowed})","Status"`,
    ];

    activeCohortStudents.forEach((st, idx) => {
      const data = studentMarksState[st.registerNumber] || { rawMarks: '', attendancePct: 85, status: 'PASS' };
      const isAbsent = data.status === 'ABSENT' || data.rawMarks === -1;
      const markStr = isAbsent ? 'AB' : data.rawMarks;
      rows.push(
        `"${idx + 1}","${st.registerNumber}","${st.name}","${selectedDept}","${selectedSem}","${activeSubject.code}","${activeSubject.name}","${data.attendancePct}%","${markStr}","${data.status}"`
      );
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDept}_Sem${selectedSem}_${activeSubject.code}_${selectedAssessment}_Marksheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered student list
  const displayStudents = useMemo(() => {
    if (!searchFilter.trim()) return activeCohortStudents;
    const q = searchFilter.toLowerCase();
    return activeCohortStudents.filter(
      (st) => st.name.toLowerCase().includes(q) || st.registerNumber.toLowerCase().includes(q)
    );
  }, [activeCohortStudents, searchFilter]);

  // Reset entire evaluation selection flow
  const handleResetFlow = () => {
    setSelectedDegree(null);
    setSelectedDept(null);
    setSelectedSem(null);
    setSelectedAssessment(null);
    setSelectedSubjectCode(null);
    setSaveStatus(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 px-3 sm:px-6">
      {/* ========================================================================= */}
      {/* 1. MINIMAL EXAM CELL HEADER */}
      {/* ========================================================================= */}
      <header className="py-2 px-1">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          WELCOME TO EXAM CELL !
        </h1>
      </header>

      {/* ========================================================================= */}
      {/* 2. PORTAL OPTIONS NAVIGATION BAR (SLIGHTLY BELOW HEADER) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('evaluation')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'evaluation'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileEdit className="w-4 h-4 text-amber-400" />
            <span>Mark Entry &amp; Evaluation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin_portal')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'admin_portal'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Main Administrator Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Faculty Entry Windows</span>
            {activeRulesCount > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-black shadow-xs">
                {activeRulesCount} Active
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-3 hidden md:block">
          {activeTab === 'evaluation'
            ? 'Progressive academic evaluation flow'
            : activeTab === 'admin_portal'
            ? 'College-wide executive administration & registry'
            : 'Configuring faculty marks entry permission windows'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT: EVALUATION MODE (UNIFIED ACADEMIC SELECTION CONSOLE) */}
      {/* ========================================================================= */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          {/* UNIFIED INTERACTIVE SELECTION CONTROL CONSOLE */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-2xs">
                  <GraduationCap className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Academic Marksheet Navigator
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Select Degree, Branch, Semester, and Examination cycle to evaluate marks
                  </p>
                </div>
              </div>

              {(selectedDegree || selectedDept || selectedSem || selectedAssessment) && (
                <button
                  type="button"
                  onClick={handleResetFlow}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            {/* 4 Responsive Selector Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. DEGREE SELECTOR */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  1. Degree Program
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDegree('B.E');
                      const beDepts = departments.filter((d) => resolveDeptDegree(d) === 'B.E');
                      if (beDepts.length > 0 && (!selectedDept || resolveDeptDegree(departments.find((d) => d.code === selectedDept) || { code: '' }) !== 'B.E')) {
                        setSelectedDept(beDepts[0].code);
                      }
                      if (!selectedSem) setSelectedSem(1);
                      if (!selectedAssessment) setSelectedAssessment('CAT-1');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedDegree === 'B.E'
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>B.E</span>
                    {selectedDegree === 'B.E' && <Check className="w-3.5 h-3.5 text-amber-300" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDegree('B.Tech');
                      const btechDepts = departments.filter((d) => resolveDeptDegree(d) === 'B.Tech');
                      if (btechDepts.length > 0 && (!selectedDept || resolveDeptDegree(departments.find((d) => d.code === selectedDept) || { code: '' }) !== 'B.Tech')) {
                        setSelectedDept(btechDepts[0].code);
                      }
                      if (!selectedSem) setSelectedSem(1);
                      if (!selectedAssessment) setSelectedAssessment('CAT-1');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedDegree === 'B.Tech'
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>B.Tech</span>
                    {selectedDegree === 'B.Tech' && <Check className="w-3.5 h-3.5 text-amber-300" />}
                  </button>
                </div>
              </div>

              {/* 2. DEPARTMENT / BRANCH SELECTOR */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    2. Department / Branch
                  </label>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {degreeDepts.length} {degreeDepts.length === 1 ? 'Branch' : 'Branches'}
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={selectedDept || ''}
                    disabled={!selectedDegree}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDept(val ? val : null);
                      setSelectedSubjectCode(null);
                    }}
                    className={`w-full py-2.5 pl-3.5 pr-8 rounded-xl text-xs font-bold border transition appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                      !selectedDegree
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-300 text-slate-900 shadow-2xs hover:border-blue-900'
                    }`}
                  >
                    {!selectedDept && <option value="">Select Branch...</option>}
                    {degreeDepts.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} &bull; {d.name} [{d.degree}]
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 3. SEMESTER SELECTOR (1 to 8) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  3. Academic Semester
                </label>
                <div className="relative">
                  <select
                    value={selectedSem || ''}
                    disabled={!selectedDept}
                    onChange={(e) => {
                      const semNum = Number(e.target.value);
                      setSelectedSem(semNum ? semNum : null);
                      setSelectedSubjectCode(null);
                    }}
                    className={`w-full py-2.5 pl-3.5 pr-8 rounded-xl text-xs font-bold border transition appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                      !selectedDept
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-300 text-slate-900 shadow-2xs hover:border-blue-900'
                    }`}
                  >
                    {!selectedSem && <option value="">Select Semester...</option>}
                    {[
                      { s: 1, label: 'Semester 1 (Year 1 - Odd)' },
                      { s: 2, label: 'Semester 2 (Year 1 - Even)' },
                      { s: 3, label: 'Semester 3 (Year 2 - Odd)' },
                      { s: 4, label: 'Semester 4 (Year 2 - Even)' },
                      { s: 5, label: 'Semester 5 (Year 3 - Odd)' },
                      { s: 6, label: 'Semester 6 (Year 3 - Even)' },
                      { s: 7, label: 'Semester 7 (Year 4 - Odd)' },
                      { s: 8, label: 'Semester 8 (Year 4 - Even)' },
                    ].map(({ s, label }) => (
                      <option key={s} value={s}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 4. EXAMINATION SELECTOR */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  4. Examination Cycle
                </label>
                <div className="relative">
                  <select
                    value={selectedAssessment || ''}
                    disabled={!selectedSem}
                    onChange={(e) => {
                      const val = e.target.value as ExamType;
                      setSelectedAssessment(val ? val : null);
                    }}
                    className={`w-full py-2.5 pl-3.5 pr-8 rounded-xl text-xs font-bold border transition appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                      !selectedSem
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-300 text-slate-900 shadow-2xs hover:border-blue-900'
                    }`}
                  >
                    {!selectedAssessment && <option value="">Choose Examination...</option>}
                    <optgroup label="Continuous Assessment Tests (Max 50 Marks)">
                      {CAT_ASSESSMENT_LIST.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label} (Max: 50M) &bull; {c.desc}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Model Examinations (Max 100 Marks)">
                      {MODEL_ASSESSMENT_LIST.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label} (Max: 100M) &bull; {m.desc}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* EMPTY STATE WHEN NO SUBJECTS ARE CONFIGURED FOR SEMESTER */}
          {selectedDegree && selectedDept && selectedSem && selectedAssessment && deptSemesterSubjects.length === 0 && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-dashed border-slate-300 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-900 mx-auto flex items-center justify-center font-bold">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  No Subjects Found for {degreeDepts.find((d) => d.code === selectedDept)?.alias || selectedDept} (Semester {selectedSem})
                </h3>
                <p className="text-xs text-slate-500">
                  All previous mock subjects have been cleared. Click below to add your courses and subjects for this semester.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(true)}
                className="px-6 py-3 rounded-2xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-wider shadow-md transition inline-flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>+ Add Subject to Semester {selectedSem}</span>
              </button>
            </div>
          )}

          {/* COURSE / SUBJECT SELECTOR TABS (WHEN CONSOLE IS CONFIGURED) */}
          {selectedDegree && selectedDept && selectedSem && selectedAssessment && deptSemesterSubjects.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-900" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Semester {selectedSem} Course Catalog ({deptSemesterSubjects.length} Subjects)
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Click subject to switch marksheet
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSubjectModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-900" />
                    <span>+ Add Subject</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {deptSemesterSubjects.map((sub, idx) => {
                  const isActive = activeSubject?.code === sub.code;
                  return (
                    <div
                      key={sub.code}
                      className={`p-3 rounded-xl border text-left transition relative group flex flex-col justify-between space-y-1.5 ${
                        isActive
                          ? 'bg-blue-900 border-blue-950 text-white shadow-sm ring-2 ring-blue-900/30'
                          : 'bg-slate-50/80 hover:bg-blue-50/60 border-slate-200 text-slate-900'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedSubjectCode(sub.code)}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-xs font-black ${
                              isActive ? 'text-amber-300' : 'text-blue-900'
                            }`}
                          >
                            {sub.code}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200/80 text-slate-600'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] font-bold line-clamp-2 leading-tight mt-1 ${
                            isActive ? 'text-white' : 'text-slate-800'
                          }`}
                          title={sub.name}
                        >
                          {sub.name}
                        </p>
                      </button>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 mt-1">
                        <span className={`text-[10px] font-medium ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                          {sub.maxMarks || 100} Marks
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 6: MARK ENTRY & ATTENDANCE EVALUATION DATA GRID */}
          {/* ========================================================================= */}
          {selectedDegree && selectedDept && selectedSem && selectedAssessment && activeSubject && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 space-y-5">
              {/* Executive Assessment Header Banner */}
              <div className="bg-gradient-to-r from-[#0B1B2F] via-[#102747] to-[#15345B] text-white p-5 sm:p-6 rounded-2xl border border-blue-900/50 shadow-md relative overflow-hidden space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-black rounded-lg uppercase tracking-wider shadow-xs ${
                          isCatExam
                            ? 'bg-blue-600 text-white border border-blue-400/40'
                            : 'bg-indigo-600 text-white border border-indigo-400/40 font-black'
                        }`}
                      >
                        {selectedAssessment} (Max: {maxMarksAllowed}M)
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                        {activeSubject.code}
                      </span>
                      <span className="text-xs text-slate-200 font-medium bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                        {selectedDegree} &bull; {degreeDepts.find((d) => d.code === selectedDept)?.alias || selectedDept} &bull; Semester {selectedSem}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                      {activeSubject.name} <span className="text-blue-200 font-medium text-sm sm:text-base">&bull; Evaluation Marksheet</span>
                    </h2>
                  </div>

                  {/* 4 Professional KPI Metrics Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-white/10 border border-white/15 px-3.5 py-2 rounded-xl backdrop-blur-xs">
                      <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider">Total Enrolled</span>
                      <span className="text-base font-black text-white font-mono mt-0.5 block">{metrics.totalStudents}</span>
                    </div>
                    <div className="bg-emerald-950/60 border border-emerald-500/40 px-3.5 py-2 rounded-xl backdrop-blur-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-300 block text-[10px] uppercase font-bold tracking-wider">Passed</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-base font-black text-emerald-300 font-mono mt-0.5 block">{metrics.passCount}</span>
                    </div>
                    <div className="bg-rose-950/60 border border-rose-500/40 px-3.5 py-2 rounded-xl backdrop-blur-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-rose-300 block text-[10px] uppercase font-bold tracking-wider">Failed</span>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <span className="text-base font-black text-rose-300 font-mono mt-0.5 block">{metrics.failCount}</span>
                    </div>
                    <div className="bg-amber-950/60 border border-amber-500/40 px-3.5 py-2 rounded-xl backdrop-blur-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-300 block text-[10px] uppercase font-bold tracking-wider">Pass Rate</span>
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="text-base font-black text-amber-300 font-mono mt-0.5 block">{metrics.passPct}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status feedback message */}
              {saveStatus && (
                <div
                  className={`p-4 rounded-2xl flex items-start gap-3 border ${
                    saveStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {saveStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs font-medium">{saveStatus.text}</div>
                </div>
              )}

              {/* Table Toolbar Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                {/* Search in cohort */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search by student name or reg number..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-800 focus:outline-none font-medium"
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Single Unified Download Option + Save Action */}
                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  {/* Single Download Options Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 transition cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-900" />
                      <span>Download Marksheet</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {downloadDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setDownloadDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-30 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Select Export Format
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDownloadDropdownOpen(false);
                              window.print();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition text-left cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                            <div>
                              <div className="leading-tight">1. PDF Document (.pdf)</div>
                              <span className="text-[10px] text-slate-400 font-normal">Official printable format</span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDownloadDropdownOpen(false);
                              handleExportExcel();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition text-left cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <div className="leading-tight">2. Excel Spreadsheet (.xlsx / .csv)</div>
                              <span className="text-[10px] text-slate-400 font-normal">Full marksheet data</span>
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Primary Save Button */}
                  <button
                    type="button"
                    onClick={handleSaveAndPublishMarks}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{isSaving ? 'Saving Marks...' : 'Save & Publish Marks'}</span>
                  </button>
                </div>
              </div>

              {/* Data Grid Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white sticky top-0 z-10 select-none">
                      <tr>
                        <th className="py-3 px-3.5 font-bold w-12 text-center border-r border-slate-800">#</th>
                        <th className="py-3 px-4 font-bold tracking-wider border-r border-slate-800">
                          Registration Number
                        </th>
                        <th className="py-3 px-4 font-bold tracking-wider border-r border-slate-800">
                          Student Name
                        </th>
                        <th className="py-3 px-3.5 font-bold text-center border-r border-slate-800 w-28">
                          Attendance %
                        </th>
                        <th className="py-3 px-4 font-bold text-center border-r border-slate-800 w-36">
                          Mark (/{maxMarksAllowed})
                        </th>
                        <th className="py-3 px-4 font-bold text-center border-r border-slate-800 w-36">
                          Scaled ({maxMarksAllowed}M)
                        </th>
                        <th className="py-3 px-3.5 font-bold text-center border-r border-slate-800 w-28">
                          Status
                        </th>
                        <th className="py-3 px-3 font-bold text-center w-24">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {displayStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            <div className="max-w-xs mx-auto space-y-2">
                              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                              <p className="font-bold text-slate-700">No students found</p>
                              <p className="text-slate-500 text-xs">
                                No registered students match {selectedDept} Semester {selectedSem} with the current filter.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        displayStudents.map((st, idx) => {
                          const rowState = studentMarksState[st.registerNumber] || {
                            rawMarks: '',
                            attendancePct: 85,
                            status: 'PASS',
                          };
                          const scaled = calculateScaledMark(rowState.rawMarks);
                          const isAbsent = rowState.status === 'ABSENT' || rowState.rawMarks === -1;
                          const isLowAttendance = rowState.attendancePct < 75;

                          return (
                            <tr
                              key={st.registerNumber}
                              className={`hover:bg-blue-50/40 transition-colors ${
                                idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                              }`}
                            >
                              {/* S.No */}
                              <td className="py-2.5 px-3.5 text-center font-mono font-medium text-slate-500 border-r border-slate-100">
                                {idx + 1}
                              </td>

                              {/* Registration Number */}
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                                {st.registerNumber}
                              </td>

                              {/* Student Name */}
                              <td className="py-2.5 px-4 font-medium text-slate-800 border-r border-slate-100">
                                {st.name}
                              </td>

                              {/* Attendance Input */}
                              <td className="py-2 px-3 text-center border-r border-slate-100">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={rowState.attendancePct}
                                    onChange={(e) => handleAttendanceChange(st.registerNumber, e.target.value)}
                                    className={`w-16 text-center py-1 px-1.5 rounded-lg border text-xs font-bold focus:ring-2 focus:ring-blue-800 focus:outline-none ${
                                      isLowAttendance
                                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                                        : 'bg-slate-50 border-slate-200 text-slate-800'
                                    }`}
                                  />
                                  <span className="text-[10px] font-bold text-slate-400">%</span>
                                </div>
                              </td>

                              {/* Raw Mark Input */}
                              <td className="py-2 px-3 text-center border-r border-slate-100">
                                <input
                                  type="text"
                                  value={isAbsent ? 'AB' : rowState.rawMarks}
                                  onChange={(e) => handleMarkChange(st.registerNumber, e.target.value)}
                                  placeholder={`0-${maxMarksAllowed} / AB`}
                                  className={`w-24 text-center py-1 px-2 rounded-lg border text-xs font-bold focus:ring-2 focus:ring-blue-800 focus:outline-none ${
                                    isAbsent
                                      ? 'bg-rose-50 border-rose-300 text-rose-700 font-black'
                                      : rowState.status === 'FAIL'
                                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                                      : 'bg-slate-50 border-slate-200 text-slate-900'
                                  }`}
                                />
                              </td>

                              {/* Scaled Value */}
                              <td className="py-2.5 px-4 text-center font-mono font-bold border-r border-slate-100">
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    scaled.scaled === 'AB'
                                      ? 'text-rose-600 bg-rose-50'
                                      : scaled.scaled === '-'
                                      ? 'text-slate-400'
                                      : 'text-blue-900 bg-blue-50 font-black'
                                  }`}
                                >
                                  {scaled.label}
                                </span>
                              </td>

                              {/* Status Tag */}
                              <td className="py-2.5 px-3.5 text-center border-r border-slate-100">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    rowState.status === 'PASS'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : rowState.status === 'FAIL'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {rowState.status}
                                </span>
                              </td>

                              {/* Quick Action Toggle */}
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusToggle(
                                      st.registerNumber,
                                      rowState.status === 'ABSENT' ? 'PASS' : 'ABSENT'
                                    )
                                  }
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                    rowState.status === 'ABSENT'
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      : 'bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700'
                                  }`}
                                  title="Toggle Absent/Present status"
                                >
                                  {rowState.status === 'ABSENT' ? 'Set Present' : 'Set Absent'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT: MAIN ADMINISTRATOR PORTAL */}
      {/* ========================================================================= */}
      {activeTab === 'admin_portal' && (
        <div className="space-y-6">
          <AdminPortal
            departments={departments}
            hods={hods}
            staff={staffMembers}
            students={students}
            subjects={subjects}
            currentUser={currentUser}
            onAddDepartment={onAddDepartment}
            onDeleteDepartment={onDeleteDepartment}
            onAddHod={onAddHod}
            onDeleteHod={onDeleteHod}
            onAddStaff={onAddStaff}
            onDeleteStaff={onDeleteStaff}
            onAddSubject={onAddSubject}
            onDeleteSubject={onDeleteSubject}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: FACULTY ENTRY PERMISSIONS & ACCESS WINDOWS */}
      {/* ========================================================================= */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <StaffMarksPermissionsManager
            entryPolicy={entryPolicy}
            onUpdateEntryPolicy={onUpdateEntryPolicy || (() => {})}
            departments={departments}
            subjects={subjects}
            exams={exams}
            currentUser={currentUser}
            currentDept={selectedDept || 'CSE'}
            currentSem={selectedSem || 1}
            currentAssessment={selectedAssessment || 'CAT-1'}
            currentSubjectCode={selectedSubjectCode || ''}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BULK IMPORT MODAL */}
      {/* ========================================================================= */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-900" />
                <h4 className="text-sm font-bold text-slate-900">Bulk Paste Marks from Spreadsheet</h4>
              </div>
              <button
                onClick={() => setShowBulkImportModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Paste columns copied directly from Excel / Google Sheets:
              <br />
              <code className="text-blue-900 font-mono bg-blue-50 px-1 py-0.5 rounded text-[11px]">
                [RegNo or S.No] [Marks /{maxMarksAllowed}] [Optional Attendance %]
              </code>
            </p>

            <textarea
              rows={8}
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              placeholder={
                isCatExam
                  ? `112021104001\t45\t92\n112021104002\t38\t88\n112021104003\tAB\t45`
                  : `112021104001\t85\t92\n112021104002\t76\t88\n112021104003\tAB\t45`
              }
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessBulkImport}
                disabled={!bulkImportText.trim()}
                className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                Parse &amp; Apply Marks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ADD SUBJECT MODAL */}
      {/* ========================================================================= */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Add Subject to Curriculum</h4>
                  <p className="text-[11px] text-slate-500">
                    {selectedDept} &bull; Semester {selectedSem}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Subject / Course Code
                </label>
                <input
                  type="text"
                  required
                  value={newSubjCode}
                  onChange={(e) => setNewSubjCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CS3401, GE3151"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Subject Name / Course Title
                </label>
                <input
                  type="text"
                  required
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  placeholder="e.g. Algorithms and Data Structures"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSubjCode.trim() || !newSubjName.trim()}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>Save Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
