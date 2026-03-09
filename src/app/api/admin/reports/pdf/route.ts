import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request: NextRequest) {
  try {
    console.log('[PDF Export] Starting PDF export...');
    
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
        'Score': displayScore.toFixed(2),
        'Percentage': percentage.toFixed(2) + '%',
        'Semester': data.semester || 'N/A',
        'School Year': data.schoolYear || 'N/A',
        'Date Submitted': data.submittedAt?.toDate?.() ? new Date(data.submittedAt.toDate()).toLocaleDateString() : 'N/A'
      });

      if (faculty?.name) {
        const current = facultyPerformance.get(faculty.name) || { total: 0, count: 0, name: faculty.name };
        current.total += displayScore;
        current.count += 1;
        facultyPerformance.set(faculty.name, current);
      }

      if (subject?.code) {
        const key = subject.code;
        const current = subjectPerformance.get(key) || { total: 0, count: 0, code: subject.code, title: subject.title || '' };
        current.total += displayScore;
        current.count += 1;
        subjectPerformance.set(key, current);
      }
    });

    // Calculate averages
    const facultyAvgData = Array.from(facultyPerformance.values()).map(f => ({
      'Faculty Name': f.name,
      'Average Score': (f.total / f.count).toFixed(2),
      'Average Percentage': ((f.total / f.count / 20) * 100).toFixed(2) + '%',
      'Total Evaluations': f.count
    })).sort((a, b) => parseFloat(b['Average Score']) - parseFloat(a['Average Score']));

    const subjectAvgData = Array.from(subjectPerformance.values()).map(s => ({
      'Subject Code': s.code,
      'Subject Title': s.title,
      'Average Score': (s.total / s.count).toFixed(2),
      'Average Percentage': ((s.total / s.count / 20) * 100).toFixed(2) + '%',
      'Total Evaluations': s.count
    })).sort((a, b) => parseFloat(b['Average Score']) - parseFloat(a['Average Score']));

    // Calculate summary statistics
    const totalEvaluations = allEvaluations.length;
    const overallAvgScore = allEvaluations.reduce((sum, e) => sum + parseFloat(e['Score']), 0) / totalEvaluations;
    const overallAvgPercent = (overallAvgScore / 20) * 100;

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header with border
    doc.setFillColor(139, 26, 43); // Maroon
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('CAMARINES NORTE STATE COLLEGE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('College of Trades and Technology', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text('Faculty Evaluation Report', pageWidth / 2, yPos, { align: 'center' });
    
    // Reset text color for body
    doc.setTextColor(0, 0, 0);
    yPos = 60;

    // Summary section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 26, 43);
    doc.text('Summary Statistics', 20, yPos);
    yPos += 10;

    const summaryData = [
      ['Total Evaluations', totalEvaluations.toString()],
      ['Overall Average Score (out of 20)', overallAvgScore.toFixed(2)],
      ['Overall Average Percentage', overallAvgPercent.toFixed(2) + '%'],
      ['Total Faculty Evaluated', facultyPerformance.size.toString()],
      ['Total Subjects Evaluated', subjectPerformance.size.toString()],
      ['Export Date', new Date().toLocaleString()]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        font: 'helvetica',
        textColor: [51, 51, 51],
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [139, 26, 43],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center',
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [51, 51, 51],
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 80, halign: 'center' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Faculty Performance section
    if (facultyAvgData.length > 0) {
      // Check if we need a new page
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 26, 43);
      doc.text('Faculty Performance Ranking', 20, yPos);
      yPos += 5;

      // Add ranking medals
      const facultyWithRank = facultyAvgData.map((f, i) => [
        `${i + 1}. ${f['Faculty Name']}`,
        f['Average Score'],
        f['Average Percentage'],
        f['Total Evaluations']
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Rank & Faculty Name', 'Average Score', 'Average %', 'Total Evaluations']],
        body: facultyWithRank,
        theme: 'striped',
        styles: {
          fontSize: 9,
          font: 'helvetica',
          textColor: [51, 51, 51],
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [139, 26, 43],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center',
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [51, 51, 51],
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 35, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Subject Performance section
    if (subjectAvgData.length > 0) {
      doc.addPage();
      yPos = 20;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 26, 43);
      doc.text('Subject Performance Analysis', 20, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Subject Code', 'Subject Title', 'Avg Score', 'Avg %', 'Evaluations']],
        body: subjectAvgData.map(s => [
          s['Subject Code'],
          s['Subject Title'],
          s['Average Score'],
          s['Average Percentage'],
          s['Total Evaluations']
        ]),
        theme: 'striped',
        styles: {
          fontSize: 9,
          font: 'helvetica',
          textColor: [51, 51, 51],
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [139, 26, 43],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center',
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [51, 51, 51],
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        columnStyles: {
          0: { cellWidth: 30, halign: 'center' },
          1: { cellWidth: 65 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 30, halign: 'center' }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // All Evaluations section
    doc.addPage();
    yPos = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 26, 43);
    doc.text('Detailed Evaluation Records', 20, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Student', 'Subject', 'Faculty', 'Score', '%', 'Semester', 'Date']],
      body: allEvaluations.map(e => [
        e['Student Name'],
        `${e['Subject Code']} - ${e['Subject Title']}`.substring(0, 30),
        e['Faculty Name'].substring(0, 25),
        e['Score'],
        e['Percentage'],
        e['Semester'],
        e['Date Submitted']
      ]),
      theme: 'striped',
      styles: {
        fontSize: 8,
        font: 'helvetica',
        textColor: [51, 51, 51],
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [139, 26, 43],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [51, 51, 51],
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 22, halign: 'center' },
        6: { cellWidth: 25, halign: 'center' }
      }
    });

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(139, 26, 43);
      doc.setLineWidth(0.5);
      doc.line(20, doc.internal.pageSize.getHeight() - 15, pageWidth - 20, doc.internal.pageSize.getHeight() - 15);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        `Camarines Norte State College - College of Trades and Technology`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Create filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Faculty_Evaluation_Report_${dateStr}.pdf`;

    console.log('[PDF Export] Successfully generated PDF file');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('[PDF Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report', details: error.message },
      { status: 500 }
    );
  }
}
