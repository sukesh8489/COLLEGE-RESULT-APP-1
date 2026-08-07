import { ExamRecord, Student } from '../types';

export function exportMarkListToCSV(
  students: Student[],
  department: string,
  semester: number,
  examType: string
) {
  // Filter students by department and semester
  const filteredStudents = students.filter(
    (s) =>
      (department === 'ALL' || s.department === department) &&
      s.currentSemester === semester
  );

  if (filteredStudents.length === 0) {
    alert('No student records found for the selected department and semester.');
    return;
  }

  // Find all unique subject codes across these records
  const subjectCodesSet = new Set<string>();
  filteredStudents.forEach((student) => {
    const record = student.examRecords?.find(
      (r) => r.semester === semester && r.examType === examType
    );
    if (record) {
      record.marks.forEach((m) => subjectCodesSet.add(`${m.subjectCode} (${m.subjectName})`));
    }
  });

  const subjectHeaders = Array.from(subjectCodesSet);

  // Build CSV Rows
  const headers = ['S.No', 'Register Number', 'Student Name', 'Department', 'Semester', 'Exam Type', ...subjectHeaders, 'Total Marks', 'Percentage', 'Status'];
  
  const csvRows: string[][] = [headers];

  filteredStudents.forEach((student, idx) => {
    const record = student.examRecords?.find(
      (r) => r.semester === semester && r.examType === examType
    );

    const row: string[] = [
      (idx + 1).toString(),
      `"${student.registerNumber}"`,
      `"${student.name}"`,
      student.department,
      student.currentSemester.toString(),
      examType,
    ];

    if (record) {
      subjectHeaders.forEach((subjHeader) => {
        const subjCode = subjHeader.split(' ')[0];
        const markObj = record.marks.find((m) => m.subjectCode === subjCode);
        row.push(markObj ? markObj.marksObtained.toString() : 'N/A');
      });
      row.push(record.totalObtained.toString());
      row.push(`${record.percentage.toFixed(1)}%`);
      row.push(record.overallStatus);
    } else {
      subjectHeaders.forEach(() => row.push('-'));
      row.push('-', '-', 'NOT ENTERED');
    }

    csvRows.push(row);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `MarkList_${department}_Sem${semester}_${examType}_${new Date().toISOString().slice(0,10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
