import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import {
  CurrentUser,
  DepartmentInfo,
  EntryPermissionPolicy,
  EntryWindowRule,
  ExamSchedule,
  ExamType,
  Subject,
} from '../types';
import { INITIAL_ENTRY_POLICY } from '../data/mockData';

interface StaffMarksPermissionsManagerProps {
  entryPolicy?: EntryPermissionPolicy;
  policy?: EntryPermissionPolicy;
  onUpdateEntryPolicy?: (policy: EntryPermissionPolicy) => void;
  onUpdatePolicy?: (policy: EntryPermissionPolicy) => void;
  departments: DepartmentInfo[];
  subjects: Subject[];
  exams?: ExamSchedule[];
  currentUser?: CurrentUser;
  currentDept?: string;
  currentSem?: number;
  currentAssessment?: ExamType;
  currentSubjectCode?: string;
}

export const StaffMarksPermissionsManager: React.FC<StaffMarksPermissionsManagerProps> = ({
  entryPolicy: propEntryPolicy,
  policy: altPolicy,
  onUpdateEntryPolicy: propUpdatePolicy,
  onUpdatePolicy: altUpdatePolicy,
  departments,
  subjects,
  exams = [],
  currentUser,
  currentDept = 'CSE',
  currentSem = 6,
  currentAssessment = 'CAT-1',
  currentSubjectCode = '',
}) => {
  const entryPolicy = propEntryPolicy || altPolicy || INITIAL_ENTRY_POLICY;
  const onUpdateEntryPolicy = propUpdatePolicy || altUpdatePolicy || (() => {});

  // New Rule Form State
  const [ruleTitle, setRuleTitle] = useState('');
  const [targetDept, setTargetDept] = useState<string>(currentDept || 'CSE');
  const [targetSem, setTargetSem] = useState<string>(currentSem ? String(currentSem) : '1');
  const [targetExamType, setTargetExamType] = useState<string>(currentAssessment || 'CAT-1');
  const [targetSubjectCode, setTargetSubjectCode] = useState<string>(currentSubjectCode || 'ALL');
  const [durationPreset, setDurationPreset] = useState<'24h' | '48h' | 'custom'>('48h');
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Create New Permission Rule
  const handleCreateRule = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const now = new Date();
    let startDate = now.toISOString();
    let endDate: string | undefined = undefined;

    if (durationPreset === '24h') {
      endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    } else if (durationPreset === '48h') {
      endDate = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    } else if (durationPreset === 'custom') {
      startDate = new Date(customStartDate).toISOString();
      endDate = new Date(customEndDate).toISOString();
    }

    const title =
      ruleTitle.trim() ||
      `${targetDept === 'ALL' ? 'All Depts' : targetDept} ${
        targetSem === 'ALL' ? 'All Sems' : `Sem ${targetSem}`
      } - ${targetExamType === 'ALL' ? 'All Exams' : targetExamType} Entry Window`;

    const newRule: EntryWindowRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      department: targetDept === 'ALL' ? undefined : targetDept,
      semester: targetSem === 'ALL' ? undefined : Number(targetSem),
      examType: targetExamType === 'ALL' ? undefined : (targetExamType as ExamType),
      subjectCode: targetSubjectCode === 'ALL' || !targetSubjectCode ? undefined : targetSubjectCode,
      startDate,
      endDate,
      isEnabled: true,
      createdAt: now.toISOString(),
      createdBy: 'Exam Cell Admin',
      reason: `Marks entry permitted for ${targetExamType} evaluation.`,
    };

    const updated: EntryPermissionPolicy = {
      ...entryPolicy,
      windowRules: [newRule, ...(entryPolicy.windowRules || [])],
      updatedAt: now.toISOString(),
      updatedBy: 'COE Admin',
    };

    onUpdateEntryPolicy(updated);
    setRuleTitle('');
    showNotification(`Created permission rule: "${title}". Staff can now enter marks!`);
  };

  // Toggle Specific Rule
  const handleToggleRule = (ruleId: string) => {
    const updatedRules = (entryPolicy.windowRules || []).map((r) =>
      r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r
    );
    onUpdateEntryPolicy({
      ...entryPolicy,
      windowRules: updatedRules,
      updatedAt: new Date().toISOString(),
    });
    showNotification('Permission rule status updated.');
  };

  // Extend Rule Duration
  const handleExtendRule = (ruleId: string, hoursToAdd: number) => {
    const updatedRules = (entryPolicy.windowRules || []).map((r) => {
      if (r.id === ruleId) {
        const currentEnd = r.endDate ? new Date(r.endDate) : new Date();
        const baseTime = currentEnd.getTime() > Date.now() ? currentEnd.getTime() : Date.now();
        const newEnd = new Date(baseTime + hoursToAdd * 60 * 60 * 1000).toISOString();
        return {
          ...r,
          endDate: newEnd,
          isEnabled: true,
        };
      }
      return r;
    });

    onUpdateEntryPolicy({
      ...entryPolicy,
      windowRules: updatedRules,
      updatedAt: new Date().toISOString(),
    });
    showNotification(`Extended permission window by ${hoursToAdd >= 24 ? `${hoursToAdd / 24} day(s)` : `${hoursToAdd} hours`}.`);
  };

  // Delete Rule
  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = (entryPolicy.windowRules || []).filter((r) => r.id !== ruleId);
    onUpdateEntryPolicy({
      ...entryPolicy,
      windowRules: updatedRules,
      updatedAt: new Date().toISOString(),
    });
    showNotification('Permission rule deleted.');
  };

  // Handler to lock all rules immediately
  const handleLockAll = () => {
    const updatedRules = (entryPolicy.windowRules || []).map((r) => ({ ...r, isEnabled: false }));
    onUpdateEntryPolicy({
      ...entryPolicy,
      isMarksEntryGlobalEnabled: false,
      windowRules: updatedRules,
      updatedAt: new Date().toISOString(),
    });
    showNotification('All staff marks entry windows have been locked immediately.');
  };

  // Helper to compute rule status
  const getRuleStatus = (rule: EntryWindowRule) => {
    if (!rule.isEnabled) return { label: 'Locked / Inactive', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    const now = new Date();
    if (rule.startDate && new Date(rule.startDate) > now) {
      return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (rule.endDate) {
      const end = new Date(rule.endDate);
      if (now > end) {
        return { label: 'Expired', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      }
      const diffHours = Math.max(0, Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60)));
      if (diffHours < 24) {
        return { label: `Active (${diffHours}h left)`, color: 'bg-amber-100 text-amber-800 border-amber-200' };
      }
      const days = Math.floor(diffHours / 24);
      return { label: `Active (${days}d left)`, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    return { label: 'Active (Indefinite)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  return (
    <div className="space-y-6">
      {/* FEEDBACK BANNER */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: GRANT NEW PERMISSION FORM */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Grant Marks Entry Permission</h3>
                <p className="text-[11px] text-slate-500">Set scope and time window for staff marks entry</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLockAll}
              className="text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs shrink-0"
              title="Lock all staff marks entry windows immediately"
            >
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>Lock All</span>
            </button>
          </div>

          <form onSubmit={handleCreateRule} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Permission Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CSE Sem 6 CAT-1 Evaluation"
                value={ruleTitle}
                onChange={(e) => setRuleTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Department</label>
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="ALL">All Departments</option>
                  {departments && departments.length > 0 ? (
                    departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="CSE">CSE</option>
                      <option value="AIDS">AIDS</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="BIO-TECH">BIO-TECH</option>
                      <option value="PHARMA">PHARMA</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Semester</label>
                <select
                  value={targetSem}
                  onChange={(e) => setTargetSem(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="ALL">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Assessment Type</label>
                <select
                  value={targetExamType}
                  onChange={(e) => setTargetExamType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="ALL">All Assessments</option>
                  <option value="CAT-1">CAT-1</option>
                  <option value="CAT-2">CAT-2</option>
                  <option value="CAT-3">CAT-3</option>
                  <option value="M-1">M-1 (Model 1)</option>
                  <option value="M-2">M-2 (Model 2)</option>
                  <option value="M-3">M-3 (Model 3)</option>
                  <option value="Practical">Practical</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Subject Scope</label>
                <select
                  value={targetSubjectCode}
                  onChange={(e) => setTargetSubjectCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="ALL">All Subjects</option>
                  {subjects
                    .filter((s) => (targetDept === 'ALL' || s.department === targetDept) && (targetSem === 'ALL' || s.semester === Number(targetSem)))
                    .map((s) => (
                      <option key={s.code} value={s.code}>
                        [{s.code}] {s.name.slice(0, 20)}...
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Window Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '24h', label: '24 Hours' },
                  { id: '48h', label: '48 Hours' },
                  { id: 'custom', label: 'Custom' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDurationPreset(p.id as any)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg border text-center transition cursor-pointer ${
                      durationPreset === p.id
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {durationPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Start Time</label>
                  <input
                    type="datetime-local"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">End Time</label>
                  <input
                    type="datetime-local"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer mt-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Grant &amp; Open Marks Entry Window</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: ACTIVE RULES & LOGS */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Active Permission Rules</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black">
                  {(entryPolicy.windowRules || []).length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Live permission windows governing faculty marks submission</p>
            </div>
          </div>

          {(entryPolicy.windowRules || []).length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <Lock className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-700">No Custom Permission Rules Defined</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Staff marks entry is currently locked by default. Use the form on the left to grant specific entry windows to staff.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {(entryPolicy.windowRules || []).map((rule) => {
                const status = getRuleStatus(rule);
                return (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      rule.isEnabled ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50/80 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{rule.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            Dept: <strong>{rule.department || 'All'}</strong>
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            Sem: <strong>{rule.semester ? `Sem ${rule.semester}` : 'All'}</strong>
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            Exam: <strong>{rule.examType || 'All'}</strong>
                          </span>
                          {rule.subjectCode && (
                            <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-mono">
                              Sub: <strong>{rule.subjectCode}</strong>
                            </span>
                          )}
                        </div>

                        {rule.endDate && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              Window: {new Date(rule.startDate).toLocaleDateString()} &rarr; {new Date(rule.endDate).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Rule Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleExtendRule(rule.id, 24)}
                          title="Add 24 hours"
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-[10px] font-bold transition cursor-pointer border border-blue-200"
                        >
                          +1 Day
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule.id)}
                          title={rule.isEnabled ? 'Lock / Disable' : 'Enable'}
                          className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                            rule.isEnabled
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {rule.isEnabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          title="Delete rule"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
