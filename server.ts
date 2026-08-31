import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

// Lazy initialization helper for Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured on the server');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Global Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger for API routes in dev
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} - ${new Date().toISOString()}`);
    }
    next();
  });

  // =========================================================================
  // 1. HEALTH & SYSTEM INFO APIS
  // =========================================================================

  app.get('/api/health', (_req: Request, res: Response) => {
    const memoryUsage = process.memoryUsage();
    res.json({
      status: 'ok',
      service: 'JSEC Exam & Academic Management Portal Backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssMb: (memoryUsage.rss / (1024 * 1024)).toFixed(1),
        heapUsedMb: (memoryUsage.heapUsed / (1024 * 1024)).toFixed(1),
      },
      environment: process.env.NODE_ENV || 'development',
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
  });

  app.get('/api/system/info', (_req: Request, res: Response) => {
    res.json({
      institution: {
        name: 'Jaya Sakthi Engineering College',
        code: '1108',
        affiliation: 'Anna University, Chennai',
        approvedBy: 'AICTE, New Delhi',
        degrees: ['B.E', 'B.Tech'],
        regulations: ['2021 (Autonomous)', '2017 (CBCS)'],
      },
      features: [
        'Centralized Exam Cell Assessment Management',
        'Head of Department (HOD) Moderation & Faculty Allocation',
        'Staff Marks Entry & Time-bounded Editing Windows',
        'Student Result Viewing & Hall Ticket Generation',
        'Real-time Firestore Database Synchronization',
        'AI-Powered Academic Insights & Mentoring',
      ],
      version: '2.5.0',
    });
  });

  // =========================================================================
  // 2. ANALYTICS & COMPUTATION APIS
  // =========================================================================

  app.post('/api/analytics/compute-summary', (req: Request, res: Response) => {
    try {
      const { students = [], department, semester } = req.body;

      let filtered = students;
      if (department && department !== 'ALL') {
        filtered = filtered.filter((s: any) => s.department === department);
      }
      if (semester && semester !== 0) {
        filtered = filtered.filter((s: any) => s.currentSemester === Number(semester));
      }

      const totalStudents = filtered.length;
      let totalExamsRecorded = 0;
      let passedExams = 0;
      let failedExams = 0;
      let totalGpaSum = 0;
      let studentsWithGpa = 0;

      const gradeDistribution: Record<string, number> = {
        'O (Outstanding)': 0,
        'A+ (Excellent)': 0,
        'A (Very Good)': 0,
        'B+ (Good)': 0,
        'B (Above Average)': 0,
        'RA (Re-Appear)': 0,
      };

      filtered.forEach((s: any) => {
        if (s.cgpa && typeof s.cgpa === 'number' && s.cgpa > 0) {
          totalGpaSum += s.cgpa;
          studentsWithGpa++;
        }

        if (Array.isArray(s.examRecords)) {
          s.examRecords.forEach((ex: any) => {
            totalExamsRecorded++;
            if (ex.overallResult === 'PASS') {
              passedExams++;
            } else {
              failedExams++;
            }

            if (Array.isArray(ex.subjects)) {
              ex.subjects.forEach((subj: any) => {
                const mark = Number(subj.marksObtained) || 0;
                const max = Number(subj.maxMarks) || 100;
                const pct = (mark / max) * 100;
                if (subj.status === 'FAIL' || subj.status === 'ABSENT' || pct < 50) {
                  gradeDistribution['RA (Re-Appear)']++;
                } else if (pct >= 90) {
                  gradeDistribution['O (Outstanding)']++;
                } else if (pct >= 80) {
                  gradeDistribution['A+ (Excellent)']++;
                } else if (pct >= 70) {
                  gradeDistribution['A (Very Good)']++;
                } else if (pct >= 60) {
                  gradeDistribution['B+ (Good)']++;
                } else {
                  gradeDistribution['B (Above Average)']++;
                }
              });
            }
          });
        }
      });

      const passPercentage =
        totalExamsRecorded > 0 ? ((passedExams / totalExamsRecorded) * 100).toFixed(1) : '100.0';
      const avgCgpa =
        studentsWithGpa > 0 ? (totalGpaSum / studentsWithGpa).toFixed(2) : '0.00';

      res.json({
        success: true,
        scope: {
          department: department || 'ALL',
          semester: semester || 'ALL',
        },
        metrics: {
          totalStudents,
          totalExamsRecorded,
          passedExams,
          failedExams,
          passPercentage: `${passPercentage}%`,
          averageCgpa: avgCgpa,
          gradeDistribution,
        },
      });
    } catch (err: any) {
      console.error('Error computing summary:', err);
      res.status(500).json({ error: err?.message || 'Failed to compute summary' });
    }
  });

  // =========================================================================
  // 3. SERVER-SIDE DATA VALIDATION API
  // =========================================================================

  app.post('/api/validate/records', (req: Request, res: Response) => {
    try {
      const { type, records } = req.body;
      const errors: Array<{ index: number; field: string; message: string }> = [];

      if (!Array.isArray(records)) {
        res.status(400).json({ error: 'Records must be provided as an array.' });
        return;
      }

      if (type === 'students') {
        records.forEach((rec, idx) => {
          if (!rec.registerNumber || typeof rec.registerNumber !== 'string' || rec.registerNumber.trim().length < 5) {
            errors.push({ index: idx, field: 'registerNumber', message: 'Valid Register Number (min 5 chars) is required' });
          }
          if (!rec.name || typeof rec.name !== 'string' || rec.name.trim().length < 2) {
            errors.push({ index: idx, field: 'name', message: 'Student full name is required' });
          }
          if (!rec.department || typeof rec.department !== 'string') {
            errors.push({ index: idx, field: 'department', message: 'Department code is required' });
          }
          if (!rec.currentSemester || Number(rec.currentSemester) < 1 || Number(rec.currentSemester) > 8) {
            errors.push({ index: idx, field: 'currentSemester', message: 'Semester must be between 1 and 8' });
          }
        });
      } else if (type === 'subjects') {
        records.forEach((rec, idx) => {
          if (!rec.code || typeof rec.code !== 'string' || rec.code.trim().length < 3) {
            errors.push({ index: idx, field: 'code', message: 'Subject Code (e.g. CS8691) is required' });
          }
          if (!rec.name || typeof rec.name !== 'string' || rec.name.trim().length < 3) {
            errors.push({ index: idx, field: 'name', message: 'Subject Title is required' });
          }
          if (!rec.department || typeof rec.department !== 'string') {
            errors.push({ index: idx, field: 'department', message: 'Department is required' });
          }
          if (!rec.semester || Number(rec.semester) < 1 || Number(rec.semester) > 8) {
            errors.push({ index: idx, field: 'semester', message: 'Semester must be between 1 and 8' });
          }
        });
      }

      res.json({
        valid: errors.length === 0,
        totalChecked: records.length,
        errorCount: errors.length,
        errors,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Data validation failed' });
    }
  });

  // =========================================================================
  // 4. MARKS PROCESSING & EVALUATION ENGINE
  // =========================================================================

  app.post('/api/marks/calculate-grades', (req: Request, res: Response) => {
    try {
      const { marks = [] } = req.body;
      if (!Array.isArray(marks)) {
        res.status(400).json({ error: 'marks must be an array' });
        return;
      }

      const processed = marks.map((item: any) => {
        const marksObtained = Number(item.marksObtained) || 0;
        const maxMarks = Number(item.maxMarks) || 100;
        const percentage = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;

        let grade = 'RA';
        let gradePoint = 0;
        let status: 'PASS' | 'FAIL' | 'ABSENT' = item.status || 'PASS';

        if (status === 'ABSENT') {
          grade = 'AB';
          status = 'ABSENT';
          gradePoint = 0;
        } else if (percentage < 50 || status === 'FAIL') {
          grade = 'RA';
          status = 'FAIL';
          gradePoint = 0;
        } else if (percentage >= 90) {
          grade = 'O';
          gradePoint = 10;
        } else if (percentage >= 80) {
          grade = 'A+';
          gradePoint = 9;
        } else if (percentage >= 70) {
          grade = 'A';
          gradePoint = 8;
        } else if (percentage >= 60) {
          grade = 'B+';
          gradePoint = 7;
        } else {
          grade = 'B';
          gradePoint = 6;
        }

        return {
          ...item,
          marksObtained,
          maxMarks,
          percentage: Number(percentage.toFixed(2)),
          grade,
          gradePoint,
          status,
        };
      });

      const totalObtained = processed.reduce(
        (sum, m) => sum + (m.status !== 'ABSENT' ? m.marksObtained : 0),
        0
      );
      const maxTotal = processed.reduce((sum, m) => sum + m.maxMarks, 0);
      const overallPercentage = maxTotal > 0 ? Number(((totalObtained / maxTotal) * 100).toFixed(2)) : 0;
      const overallStatus = processed.some((m) => m.status === 'FAIL' || m.status === 'ABSENT') ? 'FAIL' : 'PASS';

      res.json({
        success: true,
        marks: processed,
        totalObtained,
        maxTotal,
        overallPercentage,
        overallStatus,
      });
    } catch (err: any) {
      console.error('Error calculating grades:', err);
      res.status(500).json({ error: err?.message || 'Failed to calculate grades' });
    }
  });

  app.post('/api/marks/batch-process', (req: Request, res: Response) => {
    try {
      const { students = [], subjectCode, maxMarks = 100, passMark = 50 } = req.body;

      if (!Array.isArray(students)) {
        res.status(400).json({ error: 'students array is required' });
        return;
      }

      let totalPresent = 0;
      let totalAbsent = 0;
      let totalPassed = 0;
      let totalFailed = 0;
      let highestMark = 0;
      let lowestMark = maxMarks;
      let totalMarksSum = 0;

      const evaluated = students.map((st: any) => {
        const mark = Number(st.mark) || 0;
        const isAbsent = st.isAbsent === true || st.status === 'ABSENT';

        if (isAbsent) {
          totalAbsent++;
          return {
            registerNumber: st.registerNumber,
            name: st.name,
            mark: 0,
            status: 'ABSENT',
            grade: 'AB',
          };
        }

        totalPresent++;
        totalMarksSum += mark;
        if (mark > highestMark) highestMark = mark;
        if (mark < lowestMark) lowestMark = mark;

        const isPass = mark >= passMark;
        if (isPass) {
          totalPassed++;
        } else {
          totalFailed++;
        }

        const pct = (mark / maxMarks) * 100;
        let grade = 'RA';
        if (pct >= 90) grade = 'O';
        else if (pct >= 80) grade = 'A+';
        else if (pct >= 70) grade = 'A';
        else if (pct >= 60) grade = 'B+';
        else if (pct >= 50) grade = 'B';

        return {
          registerNumber: st.registerNumber,
          name: st.name,
          mark,
          status: isPass ? 'PASS' : 'FAIL',
          grade,
        };
      });

      const averageMark = totalPresent > 0 ? Number((totalMarksSum / totalPresent).toFixed(2)) : 0;
      const passRate = totalPresent > 0 ? Number(((totalPassed / totalPresent) * 100).toFixed(1)) : 0;

      res.json({
        success: true,
        subjectCode,
        summary: {
          totalEvaluated: students.length,
          totalPresent,
          totalAbsent,
          totalPassed,
          totalFailed,
          passRate: `${passRate}%`,
          highestMark: totalPresent > 0 ? highestMark : 0,
          lowestMark: totalPresent > 0 ? lowestMark : 0,
          averageMark,
        },
        records: evaluated,
      });
    } catch (err: any) {
      console.error('Error batch processing marks:', err);
      res.status(500).json({ error: err?.message || 'Failed to process marks batch' });
    }
  });

  // =========================================================================
  // 4. GEMINI AI ACADEMIC INSIGHTS & MENTORING API
  // =========================================================================

  app.post('/api/ai/academic-insights', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please provide the key in the settings panel.',
          simulated: true,
          insight: 'Executive Summary: Department demonstrates robust academic performance with high internal assessment attendance. Recommend remedial tutorial sessions for analytical courses and continuous tracking.',
        });
        return;
      }

      const { department, semester, examType, metrics, passRate, highRiskSubjects = [] } = req.body;

      const ai = getGeminiClient();
      const prompt = `
You are the Chief Academic Officer & Exam Cell Advisor at Jaya Sakthi Engineering College (Anna University affiliated).
Analyze the following internal examination data and generate a structured executive report with clear actionable recommendations:

Department: ${department || 'All Engineering Departments'}
Target Semester: Semester ${semester || 'All'}
Assessment Exam: ${examType || 'Continuous Internal Assessment (CAT/Model)'}
Pass Percentage: ${passRate || 'N/A'}
Total Evaluated Records: ${metrics?.totalExamsRecorded || 'N/A'}
Identified Difficult / High-Risk Subjects: ${highRiskSubjects.length > 0 ? highRiskSubjects.join(', ') : 'None identified'}

Please format the response in clean, professional markdown with these sections:
1. **Executive Performance Overview**: Brief objective analysis of pass rates and academic standing.
2. **Curriculum & Subject Diagnostics**: Analysis of critical courses and potential learning hurdles.
3. **Targeted Remediation & Mentorship Plan**: Concrete steps for faculty, revision schedules, and slow-learner tutoring.
4. **Exam Cell Strategic Directives**: Recommendations for upcoming Model exams and University End-Semester preparation.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({
        success: true,
        department: department || 'ALL',
        semester: semester || 'ALL',
        insights: response.text,
        generatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Gemini API Insights error:', err);
      res.status(500).json({
        error: err?.message || 'Failed to generate AI insights',
      });
    }
  });

  app.post('/api/ai/student-counseling', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
          feedback: 'Student shows positive progression. Focus on strengthening core fundamentals and consistent practice in analytical subjects.',
        });
        return;
      }

      const { studentName, registerNumber, department, semester, marks = [] } = req.body;

      const ai = getGeminiClient();
      const marksSummary = marks
        .map((m: any) => `${m.subjectCode || m.code} (${m.subjectName || m.name}): ${m.marksObtained}/${m.maxMarks} [${m.status}]`)
        .join('\n');

      const prompt = `
You are an Academic Mentor at Jaya Sakthi Engineering College.
Generate an encouraging, constructive personalized academic feedback and revision strategy for the following student:

Student Name: ${studentName}
Register Number: ${registerNumber}
Department: ${department} (Semester ${semester})
Course Marks Record:
${marksSummary || 'No exam records available yet.'}

Provide:
1. **Performance Strengths**: Acknowledge strong courses and high achievement.
2. **Subject Areas for Improvement**: Specific topics / subjects where extra practice is advised.
3. **Structured 4-Week Study Plan**: Practical advice to excel in the upcoming Anna University End-Semester exams.
4. **Mentor Encouragement Note**: Uplifting concluding remark.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({
        success: true,
        studentName,
        registerNumber,
        feedback: response.text,
        generatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Gemini Student Counseling error:', err);
      res.status(500).json({
        error: err?.message || 'Failed to generate student counseling report',
      });
    }
  });

  // =========================================================================
  // 5. STATIC ASSET SERVING & VITE INTEGRATION
  // =========================================================================

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, resolve dist directory safely
    const distPath = fs.existsSync(path.join(__dirname, 'index.html'))
      ? __dirname
      : path.resolve(process.cwd(), 'dist');

    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JSEC Portal Server] Listening on http://0.0.0.0:${PORT}`);
    console.log(`[JSEC Portal Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start JSEC Portal server:', err);
  process.exit(1);
});

