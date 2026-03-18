import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const evaluationsRef = collection(db, 'evaluations');
    const querySnapshot = await getDocs(evaluationsRef);

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: true,
        evaluations: []
      });
    }

    const evaluations = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        subjectId: data.subjectId,
        facultyId: data.facultyId,
        ratings: data.ratings,
        totalScore: data.totalScore,
        semester: data.semester,
        schoolYear: data.schoolYear,
        submittedAt: data.submittedAt?.toDate?.() || new Date()
      };
    });

    // Get student names
    const studentsRef = collection(db, 'users');
    const studentsQuery = query(studentsRef);
    const studentsSnapshot = await getDocs(studentsQuery);
    const studentMap = new Map();
    studentsSnapshot.docs.forEach(doc => {
      studentMap.set(doc.id, doc.data().fullName);
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

    // Get faculty names
    const facultyRef = collection(db, 'faculty');
    const facultySnapshot = await getDocs(facultyRef);
    const facultyMap = new Map();
    facultySnapshot.docs.forEach(doc => {
      facultyMap.set(doc.id, doc.data().name);
    });

    // Enrich evaluation data
    const enrichedEvaluations = evaluations.map(evaluation => ({
      ...evaluation,
      studentName: studentMap.get(evaluation.studentId) || 'Unknown',
      subjectCode: subjectMap.get(evaluation.subjectId)?.code,
      subjectTitle: subjectMap.get(evaluation.subjectId)?.title,
      facultyName: facultyMap.get(evaluation.facultyId) || 'Unknown'
    }));

    return NextResponse.json({
      success: true,
      evaluations: enrichedEvaluations
    });
  } catch (error: any) {
    console.error('Get evaluations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}
