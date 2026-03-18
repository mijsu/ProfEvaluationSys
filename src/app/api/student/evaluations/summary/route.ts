import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET - Fetch student's completed evaluations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get all evaluations for this student
    const evaluationsRef = collection(db, 'evaluations');
    const q = query(evaluationsRef, where('studentId', '==', studentId));
    const evaluationsSnapshot = await getDocs(q);

    if (evaluationsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        evaluations: []
      });
    }

    // Get subject information
    const subjectsRef = collection(db, 'subjects');
    const subjectsSnapshot = await getDocs(subjectsRef);
    const subjectMap = new Map();
    subjectsSnapshot.docs.forEach(doc => {
      subjectMap.set(doc.id, {
        code: doc.data().code,
        title: doc.data().title,
        instructorId: doc.data().instructorId,
        instructorName: doc.data().instructorName
      });
    });

    // Get faculty information
    const facultyRef = collection(db, 'faculty');
    const facultySnapshot = await getDocs(facultyRef);
    const facultyMap = new Map();
    facultySnapshot.docs.forEach(doc => {
      facultyMap.set(doc.id, doc.data().name);
    });

    // Get student information
    const usersRef = collection(db, 'users');
    const userDoc = await getDocs(query(usersRef, where('__name__', '==', studentId)));
    let studentInfo: any = { fullName: 'Unknown', studentId: '-' };
    
    // Try to find student in users collection
    const usersQuery = query(usersRef, where('role', '==', 'student'));
    const usersSnapshot = await getDocs(usersQuery);
    usersSnapshot.docs.forEach(doc => {
      if (doc.id === studentId) {
        studentInfo = {
          fullName: doc.data().fullName,
          studentId: doc.data().studentId || '-',
          course: doc.data().course || '-',
          year: doc.data().year || '-'
        };
      }
    });

    // Combine evaluation data with subject and faculty info
    const evaluations = evaluationsSnapshot.docs.map(doc => {
      const data = doc.data();
      const subject = subjectMap.get(data.subjectId) || { code: 'Unknown', title: 'Unknown' };
      const facultyName = facultyMap.get(data.facultyId) || subject.instructorName || 'Unknown';
      
      return {
        id: doc.id,
        subjectId: data.subjectId,
        subjectCode: subject.code,
        subjectTitle: subject.title,
        facultyId: data.facultyId,
        facultyName,
        ratings: data.ratings,
        totalScore: data.totalScore,
        semester: data.semester,
        schoolYear: data.schoolYear,
        submittedAt: data.submittedAt?.toDate?.() || new Date()
      };
    });

    // Sort by submission date (most recent first)
    evaluations.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return NextResponse.json({
      success: true,
      studentInfo,
      evaluations
    });
  } catch (error: any) {
    console.error('Get student evaluations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student evaluations' },
      { status: 500 }
    );
  }
}
