import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Evaluation questions
const getSections = () => ({
  A: {
    title: 'Commitment',
    items: [
      'Demonstrate sensitivity to students\' ability to attend and absorb content information',
      'Integrates sensitively his/her learning objectives with those of the students in a collaborative process.',
      'Makes self available to students beyond official time.',
      'Regularly comes to class on time, well- groomed and well- prepared to complete assigned responsibilities.',
      'Keeps good records of students\' performance and prompt submission of the same.',
    ],
  },
  B: {
    title: 'Knowledge of Subject',
    items: [
      'Demonstrate mastery of the subject matter. (Explains the subject matter without relying solely on the prescribed textbook.)',
      'Draws and shares information on the state of the art of theory and practice in his/her discipline.',
      'Integrates subject to practical circumstances and learning intents/ purposes of students.',
      'Explain the relevance of the present topic to the previous lessons and relates the subject matter to relevant current issues and or daily life activities.',
      'Demonstrates up to date knowledge and or awareness on current trends and issues of the subject.',
    ],
  },
  C: {
    title: 'Teaching for Independent Learning',
    items: [
      'Creates teaching strategies that allow students to practice using concept they need to understand (interactive discussion).',
      'Enhances student self- esteem and/or gives due recognition to students\' performance/ potentials.',
      'Allows students to create their own course with objectives and realistically defined student- professor roles and make them accountable for their performance',
      'Allows student to think independently and make their own decisions and holding them accountable for their performance based largely on their success in executing decisions.',
      'Encourages students to learned beyond what is required and help/ guide the students how to apply the concepts learned',
    ],
  },
  D: {
    title: 'Management of Learning',
    items: [
      'Creates opportunities for intensive and/or extensive contribution of the students on the class activities, e.g., breaks class into dyads, triads or buzz/task groups).',
      'Assumes roles of facilitator, resource person, coach, inquisitor, integrator, referee in drawing students to contribute to knowledge and understanding of the concepts at hand',
      'Designs and implements learning conditions and experience that promotes healthy exchange and/or confrontations...',
      'Structures/re-structures learning and teaching- learning context to enhance attainment of collective learning objectives.',
      'Use of instructional Materials (audio/ video materials; fieldtrips, film showing, computer aided instruction, etc.) to reinforce learning processes.',
    ],
  },
});

const getRatingDescription = (rating: number): string => {
  switch (rating) {
    case 5: return 'Outstanding';
    case 4: return 'Very Satisfactory';
    case 3: return 'Satisfactory';
    case 2: return 'Fair';
    case 1: return 'Poor';
    default: return 'N/A';
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('[Student Summary PDF] Starting PDF generation...');
    
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const evaluationId = searchParams.get('evaluationId');

    console.log('[Student Summary PDF] Student ID:', studentId);

    if (!studentId) {
      console.log('[Student Summary PDF] Error: Student ID is required');
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get student information from users collection
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('__name__', '==', studentId));
    const userSnapshot = await getDocs(userQuery);
    
    const studentInfo: { fullName: string; studentId: string; course: string; year: string } = { 
      fullName: 'Unknown', 
      studentId: '-', 
      course: '-', 
      year: '-' 
    };
    
    // Also try to find by querying users with matching id field
    const allUsersRef = collection(db, 'users');
    const allUsersSnapshot = await getDocs(allUsersRef);
    
    allUsersSnapshot.docs.forEach(snapshotDoc => {
      if (snapshotDoc.id === studentId) {
        const userData = snapshotDoc.data();
        studentInfo.fullName = userData.fullName || 'Unknown';
        studentInfo.studentId = userData.studentId || '-';
        studentInfo.course = userData.course || '-';
        studentInfo.year = userData.year || '-';
      }
    });

    console.log('[Student Summary PDF] Student info:', studentInfo.fullName);

    // Get evaluations
    const evaluationsRef = collection(db, 'evaluations');
    const q = query(evaluationsRef, where('studentId', '==', studentId));
    const evaluationsSnapshot = await getDocs(q);

    console.log('[Student Summary PDF] Evaluations found:', evaluationsSnapshot.size);

    if (evaluationsSnapshot.empty) {
      console.log('[Student Summary PDF] No evaluations found for student');
      return NextResponse.json({ error: 'No evaluations found for this student', details: 'Please complete some evaluations first.' }, { status: 404 });
    }

    // Get subject and faculty info
    const subjectsRef = collection(db, 'subjects');
    const subjectsSnapshot = await getDocs(subjectsRef);
    const subjectMap = new Map<string, { code: string; title: string; instructorName: string }>();
    subjectsSnapshot.docs.forEach(snapshotDoc => {
      subjectMap.set(snapshotDoc.id, {
        code: snapshotDoc.data().code,
        title: snapshotDoc.data().title,
        instructorName: snapshotDoc.data().instructorName
      });
    });

    const facultyRef = collection(db, 'faculty');
    const facultySnapshot = await getDocs(facultyRef);
    const facultyMap = new Map<string, string>();
    facultySnapshot.docs.forEach(snapshotDoc => {
      facultyMap.set(snapshotDoc.id, snapshotDoc.data().name);
    });

    // Process evaluations
    const evaluations = evaluationsSnapshot.docs.map(snapshotDoc => {
      const data = snapshotDoc.data();
      const subject = subjectMap.get(data.subjectId) || { code: 'Unknown', title: 'Unknown', instructorName: 'Unknown' };
      const facultyName = facultyMap.get(data.facultyId) || subject.instructorName || 'Unknown';
      
      return {
        id: snapshotDoc.id,
        subjectCode: subject.code,
        subjectTitle: subject.title,
        facultyName,
        ratings: data.ratings,
        totalScore: data.totalScore,
        semester: data.semester,
        schoolYear: data.schoolYear,
        submittedAt: data.submittedAt?.toDate?.() || new Date()
      };
    });

    // Filter by evaluationId if specified
    const filteredEvaluations = evaluationId 
      ? evaluations.filter(e => e.id === evaluationId)
      : evaluations;

    if (filteredEvaluations.length === 0) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    // Create PDF
    const pdfDoc = new jsPDF();
    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header with border
    pdfDoc.setFillColor(139, 26, 43); // Maroon
    pdfDoc.rect(0, 0, pageWidth, 45, 'F');
    
    // Title
    pdfDoc.setFontSize(18);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(255, 255, 255);
    pdfDoc.text('CAMARINES NORTE STATE COLLEGE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text('College of Trades and Technology', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    pdfDoc.setFontSize(11);
    pdfDoc.setFont('helvetica', 'italic');
    pdfDoc.text('Faculty Evaluation Summary', pageWidth / 2, yPos, { align: 'center' });

    // Reset text color for body
    pdfDoc.setTextColor(0, 0, 0);
    yPos = 55;

    // Student Information
    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(139, 26, 43);
    pdfDoc.text('Student Information', 20, yPos);
    yPos += 8;

    const studentData = [
      ['Student Name', studentInfo.fullName],
      ['Student ID', studentInfo.studentId],
      ['Course', studentInfo.course],
      ['Year', studentInfo.year],
      ['Date Generated', new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })]
    ];

    autoTable(pdfDoc, {
      startY: yPos,
      body: studentData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        font: 'helvetica',
        textColor: [51, 51, 51],
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 100 }
      }
    });

    yPos = (pdfDoc as any).lastAutoTable.finalY + 10;

    // Overall Summary
    const totalEvaluations = filteredEvaluations.length;
    const totalScoreSum = filteredEvaluations.reduce((sum, e) => sum + (e.totalScore || 0), 0);
    const averageScore = totalScoreSum / totalEvaluations / 5; // Convert to out of 20
    const averagePercentage = (averageScore / 20) * 100;

    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(139, 26, 43);
    pdfDoc.text('Evaluation Summary', 20, yPos);
    yPos += 5;

    const summaryData = [
      ['Total Faculty Evaluated', totalEvaluations.toString()],
      ['Average Score (out of 20)', averageScore.toFixed(2)],
      ['Average Percentage', averagePercentage.toFixed(2) + '%']
    ];

    autoTable(pdfDoc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        font: 'helvetica',
        textColor: [51, 51, 51],
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [139, 26, 43],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 50, halign: 'center' }
      }
    });

    yPos = (pdfDoc as any).lastAutoTable.finalY + 10;

    // Detailed Evaluations
    const sections = getSections();

    for (let i = 0; i < filteredEvaluations.length; i++) {
      const evaluation = filteredEvaluations[i];
      
      // Check if we need a new page
      if (yPos > 200) {
        pdfDoc.addPage();
        yPos = 20;
      }

      // Faculty and Subject Header
      pdfDoc.setFillColor(240, 240, 240);
      pdfDoc.rect(15, yPos - 5, pageWidth - 30, 20, 'F');
      
      pdfDoc.setFontSize(11);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setTextColor(139, 26, 43);
      pdfDoc.text(`Faculty: ${evaluation.facultyName}`, 20, yPos);
      yPos += 6;
      
      pdfDoc.setFontSize(9);
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setTextColor(80, 80, 80);
      pdfDoc.text(`Subject: ${evaluation.subjectCode} - ${evaluation.subjectTitle}`, 20, yPos);
      yPos += 6;
      pdfDoc.text(`Semester: ${evaluation.semester} | School Year: ${evaluation.schoolYear}`, 20, yPos);
      yPos += 15;

      // Score Summary for this evaluation
      const evalScore = (evaluation.totalScore || 0) / 5;
      const evalPercentage = (evalScore / 20) * 100;
      
      pdfDoc.setFontSize(10);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setTextColor(51, 51, 51);
      pdfDoc.text(`Score: ${evalScore.toFixed(2)}/20 (${evalPercentage.toFixed(1)}%)`, 20, yPos);
      yPos += 8;

      // Detailed Ratings Table
      const ratingRows: any[] = [];
      const ratings = evaluation.ratings || {};

      // Check if ratings are in flat format ("A-1": 5) or section format (A: {1: 5})
      const isFlatFormat = Object.keys(ratings).some(key => typeof key === 'string' && key.includes('-'));

      Object.entries(sections).forEach(([sectionKey, section]: [string, any]) => {
        section.items.forEach((item: string, idx: number) => {
          // Handle both flat format ("A-1") and section format (A: {1: 5})
          let rating;
          if (isFlatFormat) {
            // Flat format: ratings["A-1"]
            rating = ratings[`${sectionKey}-${idx + 1}`];
          } else {
            // Section format: ratings.A[1] or ratings["A"]["1"]
            rating = ratings[sectionKey]?.[idx + 1] || ratings[sectionKey]?.[String(idx + 1)];
          }

          ratingRows.push([
            `${sectionKey}.${idx + 1}`,
            item.substring(0, 60) + (item.length > 60 ? '...' : ''),
            rating !== undefined ? rating : '-',
            typeof rating === 'number' ? getRatingDescription(rating) : '-'
          ]);
        });
      });

      autoTable(pdfDoc, {
        startY: yPos,
        head: [['#', 'Criteria', 'Rating', 'Description']],
        body: ratingRows,
        theme: 'grid',
        styles: {
          fontSize: 7,
          font: 'helvetica',
          textColor: [51, 51, 51],
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [139, 26, 43],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 90 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' }
        }
      });

      yPos = (pdfDoc as any).lastAutoTable.finalY + 15;
    }

    // Footer on all pages
    const pageCount = pdfDoc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdfDoc.setPage(i);
      
      // Footer line
      pdfDoc.setDrawColor(139, 26, 43);
      pdfDoc.setLineWidth(0.5);
      pdfDoc.line(20, pdfDoc.internal.pageSize.getHeight() - 15, pageWidth - 20, pdfDoc.internal.pageSize.getHeight() - 15);
      
      // Footer text
      pdfDoc.setFontSize(8);
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setTextColor(100, 100, 100);
      pdfDoc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pdfDoc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      pdfDoc.text(
        `Camarines Norte State College - College of Trades and Technology`,
        pageWidth / 2,
        pdfDoc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

    // Create filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Evaluation_Summary_${studentInfo.studentId || studentId}_${dateStr}.pdf`;

    console.log('[Student Summary PDF] PDF generated successfully');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Generate student summary PDF error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}
