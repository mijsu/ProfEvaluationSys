import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const facultyId = searchParams.get('facultyId');

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }

    // Get all evaluations for this faculty
    const evaluationsRef = collection(db, 'evaluations');
    const querySnapshot = await getDocs(evaluationsRef);
    
    const evaluations = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          studentId: data.studentId,
          subjectId: data.subjectId,
          facultyId: data.facultyId,
          ratings: data.ratings,
          totalScore: data.totalScore,
          semester: data.semester || '1st Semester',
          schoolYear: data.schoolYear || '2024-2025',
          submittedAt: data.submittedAt?.toDate?.() || new Date()
        };
      })
      .filter(e => e.facultyId === facultyId);

    if (evaluations.length === 0) {
      return NextResponse.json({
        success: true,
        students: []
      });
    }

    // Get student information
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const studentMap = new Map();
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      studentMap.set(doc.id, {
        fullName: data.fullName,
        studentId: data.studentId || '-',
        email: data.email,
        course: data.course,
        year: data.year
      });
    });

    // Get subject information
    const subjectsRef = collection(db, 'subjects');
    const subjectsSnapshot = await getDocs(subjectsRef);
    const subjectMap = new Map();
    subjectsSnapshot.docs.forEach(doc => {
      subjectMap.set(doc.id, {
        code: doc.data().code,
        title: doc.data().title
      });
    });

    // Combine evaluation data with student and subject info
    const students = evaluations.map(evaluation => {
      const student = studentMap.get(evaluation.studentId) || { fullName: 'Unknown', studentId: '-' };
      const subject = subjectMap.get(evaluation.subjectId) || { code: 'Unknown', title: 'Unknown' };
      
      return {
        evaluationId: evaluation.id,
        studentId: evaluation.studentId,
        studentName: student.fullName,
        studentSchoolId: student.studentId,
        subjectCode: subject.code,
        subjectTitle: subject.title,
        score: evaluation.totalScore || 0,
        ratings: evaluation.ratings, // Include the detailed ratings
        semester: evaluation.semester,
        schoolYear: evaluation.schoolYear,
        submittedAt: evaluation.submittedAt
      };
    });

    // Sort by submission date (most recent first)
    students.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return NextResponse.json({
      success: true,
      students
    });
  } catch (error: any) {
    console.error('Get faculty evaluations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculty evaluations' },
      { status: 500 }
    );
  }
}
