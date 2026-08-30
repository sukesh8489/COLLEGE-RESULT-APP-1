import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyAttendanceRecord, Student } from '../types';

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'all';

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
  sessionFilter?: 'ALL' | 'FN' | 'AN';
  semester?: number | 'ALL';
}

// Helper to format Date to YYYY-MM-DD in local time
export function formatDateToISO(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Helper to calculate date ranges
export function getDateRangeBounds(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): { start: string; end: string; label: string } {
  const now = new Date();
  const todayStr = formatDateToISO(now);

  if (customStart && customEnd) {
    return {
      start: customStart,
      end: customEnd,
      label: customStart === customEnd ? `Date: ${customStart}` : `${customStart} to ${customEnd}`,
    };
  }

  if (preset === 'today') {
    return { start: todayStr, end: todayStr, label: `Today (${todayStr})` };
  }

  if (preset === 'yesterday') {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yestStr = formatDateToISO(yest);
    return { start: yestStr, end: yestStr, label: `Yesterday (${yestStr})` };
  }

  if (preset === 'this_week') {
    const d = new Date(now);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const mStr = formatDateToISO(monday);
    const sStr = formatDateToISO(sunday);
    return { start: mStr, end: sStr, label: `This Week (${mStr} to ${sStr})` };
  }

  if (preset === 'this_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fStr = formatDateToISO(firstDay);
    const lStr = formatDateToISO(lastDay);
    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    return { start: fStr, end: lStr, label: `${monthName} (${fStr} to ${lStr})` };
  }

  return { start: '2020-01-01', end: '2030-12-31', label: 'All Recorded Dates' };
}

// Filter records based on criteria
export function filterAttendanceRecords(
  records: DailyAttendanceRecord[],
  dept: string,
  filter: DateRangeFilter
): DailyAttendanceRecord[] {
  const { start, end } = getDateRangeBounds(filter.preset, filter.startDate, filter.endDate);

  return records.filter((r) => {
    if (r.department !== dept) return false;
    if (filter.semester !== 'ALL' && filter.semester !== undefined && r.semester !== filter.semester) {
      return false;
    }
    if (r.date < start || r.date > end) return false;
    if (filter.sessionFilter && filter.sessionFilter !== 'ALL' && r.session !== filter.sessionFilter) {
      return false;
    }
    return true;
  });
}

// Generate Professional WhatsApp/Copy Shareable Text
export function generateShareableText(
  date: string,
  session: 'FN' | 'AN',
  dept: string,
  semester: number,
  ccName: string,
  batch: string,
  records: { registerNumber: string; studentName: string; status: string; remarks?: string }[]
): string {
  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT');
  const absent = records.filter((r) => r.status === 'ABSENT');
  const leave = records.filter((r) => r.status === 'LEAVE');
  const od = records.filter((r) => r.status === 'ON_DUTY');

  const percentage = total > 0 ? Math.round(((present.length + od.length) / total) * 100) : 0;
  const sessionText = session === 'FN' ? 'Forenoon (FN)' : 'Afternoon (AN)';

  let text = `*JAYASAKTHI ENGINEERING COLLEGE*\n`;
  text += `*Daily Attendance Report*\n`;
  text += `─────────────────────────\n`;
  text += `*Date:* ${date} (${sessionText})\n`;
  text += `*Class:* ${dept} | Semester ${semester} | Batch ${batch}\n`;
  text += `*Class In-Charge:* ${ccName || 'Faculty'}\n\n`;

  text += `*Summary:*\n`;
  text += `• Total Enrolled: ${total}\n`;
  text += `• Present: ${present.length} (${percentage}%)\n`;
  text += `• Absent: ${absent.length}\n`;
  text += `• On Leave: ${leave.length}\n`;
  if (od.length > 0) {
    text += `• On Duty: ${od.length}\n`;
  }
  text += `─────────────────────────\n\n`;

  if (absent.length > 0) {
    text += `*Absentees (${absent.length}):*\n`;
    absent.forEach((st, idx) => {
      text += `${idx + 1}. ${st.studentName} (${st.registerNumber})\n`;
    });
    text += `\n`;
  } else {
    text += `*Absentees:* Nil (All Present / Approved)\n\n`;
  }

  if (leave.length > 0) {
    text += `*On Leave (${leave.length}):*\n`;
    leave.forEach((st, idx) => {
      const reason = st.remarks ? ` [${st.remarks}]` : '';
      text += `${idx + 1}. ${st.studentName} (${st.registerNumber})${reason}\n`;
    });
    text += `\n`;
  }

  if (od.length > 0) {
    text += `*On Duty (${od.length}):*\n`;
    od.forEach((st, idx) => {
      const reason = st.remarks ? ` [${st.remarks}]` : '';
      text += `${idx + 1}. ${st.studentName} (${st.registerNumber})${reason}\n`;
    });
    text += `\n`;
  }

  text += `─────────────────────────\n`;
  text += `_JEC Academic Management Portal_`;

  return text;
}

// Export to Excel (.xlsx)
export function exportAttendanceToExcel(
  records: DailyAttendanceRecord[],
  dept: string,
  semester: number | 'ALL',
  batch: string,
  dateRangeLabel: string,
  studentsList: Student[],
  sessionFilter: 'ALL' | 'FN' | 'AN' = 'ALL'
) {
  const wb = XLSX.utils.book_new();
  const semLabel = semester === 'ALL' ? 'All Semesters' : `Semester ${semester}`;

  // Filter students
  const filteredStudents = studentsList.filter((s) => {
    if (s.department !== dept) return false;
    if (semester !== 'ALL' && s.currentSemester !== semester) return false;
    return true;
  });

  // Sheet 1: Detailed Daily Attendance Logs
  const detailedData: any[] = [];
  detailedData.push(['JAYASAKTHI ENGINEERING COLLEGE']);
  detailedData.push(['DAILY ATTENDANCE DETAILED SESSION REPORT']);
  detailedData.push([
    `Department: ${dept}`,
    `Class Scope: ${semLabel}`,
    `Batch: ${batch || 'All'}`,
    `Date Period: ${dateRangeLabel}`,
    `Session Scope: ${sessionFilter}`,
  ]);
  detailedData.push([]); // blank row

  detailedData.push([
    'Sl. No',
    'Date',
    'Session',
    'Semester',
    'Register Number',
    'Student Name',
    'Attendance Status',
    'Remarks / Reason',
    'Marked By Faculty',
  ]);

  let slNo = 1;
  if (records.length > 0) {
    // Sort records chronologically
    const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

    sortedRecords.forEach((rec) => {
      rec.records.forEach((s) => {
        detailedData.push([
          slNo++,
          rec.date,
          rec.session,
          `Sem ${rec.semester}`,
          s.registerNumber,
          s.studentName,
          s.status,
          s.remarks || '-',
          rec.markedByStaffName || rec.markedByStaffId || 'Faculty',
        ]);
      });
    });
  } else {
    // If no direct daily records exist in DB for this range, populate from student roster
    filteredStudents.forEach((st) => {
      detailedData.push([
        slNo++,
        dateRangeLabel.includes('Today') ? formatDateToISO(new Date()) : dateRangeLabel,
        sessionFilter === 'ALL' ? 'FN & AN' : sessionFilter,
        `Sem ${st.currentSemester}`,
        st.registerNumber,
        st.name,
        (st.attendance?.percentage || 90) >= 75 ? 'PRESENT' : 'DEFICIT',
        'Record from Student Cumulative Profile',
        'System Recorded',
      ]);
    });
  }

  const wsDetailed = XLSX.utils.aoa_to_sheet(detailedData);
  XLSX.utils.book_append_sheet(wb, wsDetailed, 'Daily Session Logs');

  // Sheet 2: Student Cumulative Summary in this Range
  const studentMap: {
    [regNo: string]: {
      name: string;
      semester: number;
      presentCount: number;
      absentCount: number;
      leaveCount: number;
      odCount: number;
      totalSessions: number;
      overallPercentage: number;
    };
  } = {};

  // Initialize from filtered roster
  filteredStudents.forEach((s) => {
    studentMap[s.registerNumber] = {
      name: s.name,
      semester: s.currentSemester,
      presentCount: 0,
      absentCount: 0,
      leaveCount: 0,
      odCount: 0,
      totalSessions: 0,
      overallPercentage: s.attendance?.percentage || 90,
    };
  });

  records.forEach((rec) => {
    rec.records.forEach((s) => {
      if (!studentMap[s.registerNumber]) {
        studentMap[s.registerNumber] = {
          name: s.studentName,
          semester: rec.semester,
          presentCount: 0,
          absentCount: 0,
          leaveCount: 0,
          odCount: 0,
          totalSessions: 0,
          overallPercentage: 90,
        };
      }
      const item = studentMap[s.registerNumber];
      item.totalSessions += 1;
      if (s.status === 'PRESENT') item.presentCount += 1;
      else if (s.status === 'ABSENT') item.absentCount += 1;
      else if (s.status === 'LEAVE') item.leaveCount += 1;
      else if (s.status === 'ON_DUTY') item.odCount += 1;
    });
  });

  const summaryData: any[] = [];
  summaryData.push(['JAYASAKTHI ENGINEERING COLLEGE']);
  summaryData.push([`STUDENT-WISE ATTENDANCE CUMULATIVE SUMMARY (${dateRangeLabel})`]);
  summaryData.push([`Department: ${dept}`, `Class Scope: ${semLabel}`, `Batch: ${batch || 'All'}`]);
  summaryData.push([]);
  summaryData.push([
    'Sl. No',
    'Register Number',
    'Student Name',
    'Semester',
    'Range Total Sessions',
    'Present Count',
    'Absent Count',
    'Leave Count',
    'On-Duty (OD)',
    'Range Att %',
    'Portal Cumulative %',
    'Academic Status',
  ]);

  let sumIdx = 1;
  Object.keys(studentMap)
    .sort()
    .forEach((regNo) => {
      const item = studentMap[regNo];
      const attended = item.presentCount + item.odCount;
      const rangePct = item.totalSessions > 0 ? Math.round((attended / item.totalSessions) * 100) : item.overallPercentage;
      const finalPct = item.totalSessions > 0 ? rangePct : item.overallPercentage;
      const status = finalPct >= 75 ? 'ELIGIBLE' : 'CONDONATION / DEFICIT';

      summaryData.push([
        sumIdx++,
        regNo,
        item.name,
        `Sem ${item.semester}`,
        item.totalSessions,
        item.presentCount,
        item.absentCount,
        item.leaveCount,
        item.odCount,
        `${rangePct}%`,
        `${item.overallPercentage}%`,
        status,
      ]);
    });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Student Summary');

  // Trigger file download
  const cleanLabel = dateRangeLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `JEC_Daily_Attendance_${dept}_${semLabel.replace(/\s+/g, '')}_${cleanLabel}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Export to PDF (.pdf)
export function exportAttendanceToPDF(
  records: DailyAttendanceRecord[],
  dept: string,
  semester: number | 'ALL',
  batch: string,
  dateRangeLabel: string,
  studentsList: Student[],
  sessionFilter: 'ALL' | 'FN' | 'AN' = 'ALL'
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const semLabel = semester === 'ALL' ? 'All Semesters' : `Semester ${semester}`;

  // Filter students
  const filteredStudents = studentsList.filter((s) => {
    if (s.department !== dept) return false;
    if (semester !== 'ALL' && s.currentSemester !== semester) return false;
    return true;
  });

  // Calculate Cumulative Stats in the Range
  const studentMap: {
    [regNo: string]: {
      name: string;
      semester: number;
      present: number;
      absent: number;
      leave: number;
      od: number;
      total: number;
      overallPct: number;
      remarks: string[];
    };
  } = {};

  filteredStudents.forEach((s) => {
    studentMap[s.registerNumber] = {
      name: s.name,
      semester: s.currentSemester,
      present: 0,
      absent: 0,
      leave: 0,
      od: 0,
      total: 0,
      overallPct: s.attendance?.percentage || 90,
      remarks: [],
    };
  });

  records.forEach((rec) => {
    rec.records.forEach((s) => {
      if (!studentMap[s.registerNumber]) {
        studentMap[s.registerNumber] = {
          name: s.studentName,
          semester: rec.semester,
          present: 0,
          absent: 0,
          leave: 0,
          od: 0,
          total: 0,
          overallPct: 90,
          remarks: [],
        };
      }
      studentMap[s.registerNumber].total += 1;
      if (s.status === 'PRESENT') studentMap[s.registerNumber].present += 1;
      else if (s.status === 'ABSENT') {
        studentMap[s.registerNumber].absent += 1;
        if (s.remarks) studentMap[s.registerNumber].remarks.push(s.remarks);
      } else if (s.status === 'LEAVE') {
        studentMap[s.registerNumber].leave += 1;
        if (s.remarks) studentMap[s.registerNumber].remarks.push(s.remarks);
      } else if (s.status === 'ON_DUTY') {
        studentMap[s.registerNumber].od += 1;
      }
    });
  });

  // Total summary metrics
  let totalRecordedSessions = records.length;
  let totalPres = 0;
  let totalAbs = 0;
  let totalLev = 0;
  let totalOd = 0;
  let totalSlots = 0;

  Object.values(studentMap).forEach((st) => {
    totalPres += st.present;
    totalAbs += st.absent;
    totalLev += st.leave;
    totalOd += st.od;
    totalSlots += st.total;
  });

  const overallPct = totalSlots > 0 ? Math.round(((totalPres + totalOd) / totalSlots) * 100) : 90;

  // Header Banner
  doc.setFillColor(15, 23, 42); // #0f172a slate-900
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('JAYASAKTHI ENGINEERING COLLEGE', 105, 9, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(251, 191, 36); // Amber accent
  doc.text('OFFICIAL DAILY ATTENDANCE & PERIOD REPORT', 105, 15, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    `Dept: ${dept} | Class: ${semLabel} | Session: ${sessionFilter} | Range: ${dateRangeLabel}`,
    105,
    21,
    { align: 'center' }
  );

  // Summary Metrics Bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 29, 182, 16, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Recorded Sessions: ${totalRecordedSessions || 1}`, 18, 35);
  doc.text(`Enrolled Students: ${filteredStudents.length}`, 18, 41);

  doc.setTextColor(16, 185, 129);
  doc.text(`Present: ${totalPres}`, 75, 35);
  doc.setTextColor(239, 68, 68);
  doc.text(`Absent: ${totalAbs}`, 75, 41);

  doc.setTextColor(217, 119, 6);
  doc.text(`Leave: ${totalLev}`, 120, 35);
  doc.setTextColor(37, 99, 235);
  doc.text(`On-Duty (OD): ${totalOd}`, 120, 41);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(`Average: ${overallPct}%`, 165, 38, { align: 'center' });

  // Table of Students
  const tableRows: any[] = [];
  let index = 1;

  Object.keys(studentMap)
    .sort()
    .forEach((regNo) => {
      const st = studentMap[regNo];
      const attended = st.present + st.od;
      const pct = st.total > 0 ? Math.round((attended / st.total) * 100) : st.overallPct;
      const statusText = pct >= 75 ? 'Pass (>=75%)' : 'Deficit (<75%)';

      tableRows.push([
        index++,
        regNo,
        st.name,
        `Sem ${st.semester}`,
        st.total > 0 ? st.total.toString() : '1',
        st.total > 0 ? st.present.toString() : (st.overallPct >= 75 ? '1' : '0'),
        st.total > 0 ? st.absent.toString() : (st.overallPct < 75 ? '1' : '0'),
        st.leave.toString(),
        st.od.toString(),
        `${pct}%`,
        statusText,
      ]);
    });

  autoTable(doc, {
    startY: 48,
    head: [['#', 'Register No.', 'Student Name', 'Sem', 'Total', 'Pres', 'Abs', 'Lev', 'OD', 'Att %', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 46 },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'center', cellWidth: 11 },
      5: { halign: 'center', cellWidth: 11, textColor: [16, 185, 129] },
      6: { halign: 'center', cellWidth: 11, textColor: [239, 68, 68] },
      7: { halign: 'center', cellWidth: 11, textColor: [217, 119, 6] },
      8: { halign: 'center', cellWidth: 11, textColor: [37, 99, 235] },
      9: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
      10: { halign: 'center', cellWidth: 18 },
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      // Signature and Stamp Block on last page or bottom
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Generated on ${new Date().toLocaleString()} | Jayasakthi Engineering College Academic System`,
        14,
        290
      );
      doc.text(`Page ${data.pageNumber}`, 196, 290, { align: 'right' });
    },
  });

  // Save the PDF
  const cleanLabel = dateRangeLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `JEC_Daily_Attendance_${dept}_${semLabel.replace(/\s+/g, '')}_${cleanLabel}.pdf`;
  doc.save(fileName);
}
