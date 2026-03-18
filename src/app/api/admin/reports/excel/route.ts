import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    console.log('[Excel Export] Starting Excel export...');
    
    // Get all evaluations
    const evaluationsRef = collection(db, 'evaluations');
    const evaluationsSnapshot = await getDocs(evaluationsRef);
    
    if (evaluationsSnapshot.empty) {
      return NextResponse.json(
        { error: 'No evaluation data to export' },
        { status: 404 }
      );
    }

    // Get related data
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const userMap = new Map();
    usersSnapshot.docs.forEach(doc => {
      userMap.set(doc.id, {
        fullName: doc.data().fullName,
        username: doc.data().username,
        role: doc.data().role
      });
    });

    const subjectsRef = collection(db, 'subjects');
    const subjectsSnapshot = await getDocs(subjectsRef);
    const subjectMap = new Map();
    subjectsSnapshot.docs.forEach(doc => {
      subjectMap.set(doc.id, {
        code: doc.data().code,
        title: doc.data().title,
        instructorId: doc.data().instructorId
      });
    });

    const facultyRef = collection(db, 'faculty');
    const facultySnapshot = await getDocs(facultyRef);
    const facultyMap = new Map();
    facultySnapshot.docs.forEach(doc => {
      facultyMap.set(doc.id, {
        name: doc.data().name
      });
    });

    // Process evaluation data
    const allEvaluations: any[] = [];
    const facultyPerformance: Map<string, { total: number; count: number; name: string }> = new Map();
    const subjectPerformance: Map<string, { total: number; count: number; code: string; title: string }> = new Map();

    evaluationsSnapshot.forEach(doc => {
      const data = doc.data();
      const student = userMap.get(data.studentId);
      const subject = subjectMap.get(data.subjectId);
      const faculty = facultyMap.get(data.facultyId);

      const displayScore = (data.totalScore || 0) / 5;
      const percentage = (displayScore / 20) * 100;

      allEvaluations.push({
        'Student Name': student?.fullName || 'Unknown',
        'Username': student?.username || 'Unknown',
        'Subject Code': subject?.code || 'Unknown',
        'Subject Title': subject?.title || 'Unknown',
        'Faculty Name': faculty?.name || 'Unknown',
        'Score (out of 20)': displayScore.toFixed(2),
        'Percentage (%)': percentage.toFixed(2),
        'Semester': data.semester || 'N/A',
        'School Year': data.schoolYear || 'N/A',
        'Date Submitted': data.submittedAt?.toDate?.() ? new Date(data.submittedAt.toDate()).toLocaleDateString() : 'N/A'
      });

      // Aggregate faculty performance
      if (faculty?.name) {
        const current = facultyPerformance.get(faculty.name) || { total: 0, count: 0, name: faculty.name };
        current.total += displayScore;
        current.count += 1;
        facultyPerformance.set(faculty.name, current);
      }

      // Aggregate subject performance
      if (subject?.code) {
        const key = subject.code;
        const current = subjectPerformance.get(key) || { total: 0, count: 0, code: subject.code, title: subject.title || '' };
        current.total += displayScore;
        current.count += 1;
        subjectPerformance.set(key, current);
      }
    });

    // Calculate averages
    const facultyAvgData = Array.from(facultyPerformance.values()).map((f, index) => ({
      'Rank': index + 1,
      'Faculty Name': f.name,
      'Average Score (out of 20)': parseFloat((f.total / f.count).toFixed(2)),
      'Average Percentage (%)': parseFloat(((f.total / f.count / 20) * 100).toFixed(2)),
      'Total Evaluations': f.count
    })).sort((a, b) => b['Average Score (out of 20)'] - a['Average Score (out of 20)']);

    // Reassign ranks after sorting
    facultyAvgData.forEach((f, i) => {
      f.Rank = i + 1;
    });

    const subjectAvgData = Array.from(subjectPerformance.values()).map((s, index) => ({
      'Rank': index + 1,
      'Subject Code': s.code,
      'Subject Title': s.title,
      'Average Score (out of 20)': parseFloat((s.total / s.count).toFixed(2)),
      'Average Percentage (%)': parseFloat(((s.total / s.count / 20) * 100).toFixed(2)),
      'Total Evaluations': s.count
    })).sort((a, b) => b['Average Score (out of 20)'] - a['Average Score (out of 20)']);

    // Reassign ranks after sorting
    subjectAvgData.forEach((s, i) => {
      s.Rank = i + 1;
    });

    // Calculate summary statistics
    const totalEvaluations = allEvaluations.length;
    const overallAvgScore = allEvaluations.reduce((sum, e) => sum + parseFloat(e['Score (out of 20)']), 0) / totalEvaluations;
    const overallAvgPercent = (overallAvgScore / 20) * 100;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // ==================== Summary Sheet ====================
    const summaryHeader = [
      ['CAMARINES NORTE STATE COLLEGE'],
      ['College of Trades and Technology'],
      ['Faculty Evaluation Report'],
      [''],
      ['SUMMARY STATISTICS'],
      ['']
    ];
    
    const summaryBody = [
      ['Metric', 'Value'],
      ['Total Evaluations', totalEvaluations],
      ['Overall Average Score (out of 20)', parseFloat(overallAvgScore.toFixed(2))],
      ['Overall Average Percentage (%)', parseFloat(overallAvgPercent.toFixed(2))],
      ['Total Faculty Evaluated', facultyPerformance.size],
      ['Total Subjects Evaluated', subjectPerformance.size],
      ['Report Generated', new Date().toLocaleString()]
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet([...summaryHeader, ...summaryBody]);
    
    // Set column widths for summary
    summaryWs['!cols'] = [
      { wch: 35 },
      { wch: 25 }
    ];

    // Merge cells for header
    summaryWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Subtitle
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, // Report name
      { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } }, // Summary header
    ];

    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // ==================== Faculty Performance Sheet ====================
    const facultyHeader = [
      ['CAMARINES NORTE STATE COLLEGE - Faculty Performance Ranking'],
      [''],
      ['Rank', 'Faculty Name', 'Average Score', 'Average %', 'Total Evaluations']
    ];

    const facultyBody = facultyAvgData.map(f => [
      f['Rank'],
      f['Faculty Name'],
      f['Average Score (out of 20)'],
      f['Average Percentage (%)'],
      f['Total Evaluations']
    ]);

    const facultyWs = XLSX.utils.aoa_to_sheet([...facultyHeader, ...facultyBody]);
    
    // Set column widths for faculty
    facultyWs['!cols'] = [
      { wch: 8 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 }
    ];

    // Merge cells for header
    facultyWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
    ];

    XLSX.utils.book_append_sheet(wb, facultyWs, 'Faculty Performance');

    // ==================== Subject Analysis Sheet ====================
    const subjectHeader = [
      ['CAMARINES NORTE STATE COLLEGE - Subject Performance Analysis'],
      [''],
      ['Rank', 'Subject Code', 'Subject Title', 'Average Score', 'Average %', 'Total Evaluations']
    ];

    const subjectBody = subjectAvgData.map(s => [
      s['Rank'],
      s['Subject Code'],
      s['Subject Title'],
      s['Average Score (out of 20)'],
      s['Average Percentage (%)'],
      s['Total Evaluations']
    ]);

    const subjectWs = XLSX.utils.aoa_to_sheet([...subjectHeader, ...subjectBody]);
    
    // Set column widths for subject
    subjectWs['!cols'] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 }
    ];

    // Merge cells for header
    subjectWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title
    ];

    XLSX.utils.book_append_sheet(wb, subjectWs, 'Subject Analysis');

    // ==================== All Evaluations Sheet ====================
    const evalHeader = [
      ['CAMARINES NORTE STATE COLLEGE - Detailed Evaluation Records'],
      [''],
      ['Student Name', 'Username', 'Subject Code', 'Subject Title', 'Faculty Name', 'Score', 'Percentage (%)', 'Semester', 'School Year', 'Date Submitted']
    ];

    const evalBody = allEvaluations.map(e => [
      e['Student Name'],
      e['Username'],
      e['Subject Code'],
      e['Subject Title'],
      e['Faculty Name'],
      parseFloat(e['Score (out of 20)']),
      parseFloat(e['Percentage (%)']),
      e['Semester'],
      e['School Year'],
      e['Date Submitted']
    ]);

    const evaluationsWs = XLSX.utils.aoa_to_sheet([...evalHeader, ...evalBody]);
    
    // Set column widths for evaluations
    evaluationsWs['!cols'] = [
      { wch: 25 }, // Student Name
      { wch: 15 }, // Username
      { wch: 12 }, // Subject Code
      { wch: 30 }, // Subject Title
      { wch: 25 }, // Faculty Name
      { wch: 10 }, // Score
      { wch: 15 }, // Percentage
      { wch: 12 }, // Semester
      { wch: 15 }, // School Year
      { wch: 15 }  // Date Submitted
    ];

    // Merge cells for header
    evaluationsWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Title
    ];

    XLSX.utils.book_append_sheet(wb, evaluationsWs, 'All Evaluations');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Create filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Faculty_Evaluation_Report_${dateStr}.xlsx`;

    console.log('[Excel Export] Successfully generated Excel file');

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('[Excel Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel report', details: error.message },
      { status: 500 }
    );
  }
}
