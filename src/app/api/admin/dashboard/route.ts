import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    console.log('[Dashboard API] Starting to fetch dashboard stats...');

    // Get total students
    const studentsRef = collection(db, 'users');
    const studentsQuery = query(studentsRef, where('role', '==', 'student'));
    const studentsSnapshot = await getCountFromServer(studentsQuery);
    const totalStudents = studentsSnapshot.data().count;
    console.log('[Dashboard API] Total students:', totalStudents);

    // Get total faculty
    const facultyRef = collection(db, 'faculty');
    const facultySnapshot = await getCountFromServer(facultyRef);
    const totalFaculty = facultySnapshot.data().count;
    console.log('[Dashboard API] Total faculty:', totalFaculty);

    // Get total subjects
    const subjectsRef = collection(db, 'subjects');
    const subjectsSnapshot = await getCountFromServer(subjectsRef);
    const totalSubjects = subjectsSnapshot.data().count;
    console.log('[Dashboard API] Total subjects:', totalSubjects);

    // Get completed evaluations
    const evaluationsRef = collection(db, 'evaluations');
    const evaluationsSnapshot = await getCountFromServer(evaluationsRef);
    const completedEvaluations = evaluationsSnapshot.data().count;
    console.log('[Dashboard API] Completed evaluations:', completedEvaluations);

    // Get evaluation status from settings
    const settingsRef = collection(db, 'settings');
    const settingsSnapshot = await getDocs(settingsRef);
    let evaluationOpen = true;
    let currentSemester = '1st Semester';
    let currentSchoolYear = '2024-2025';

    if (!settingsSnapshot.empty) {
      const settings = settingsSnapshot.docs[0].data();
      evaluationOpen = settings.evaluationOpen ?? true;
      currentSemester = settings.currentSemester || '1st Semester';
      currentSchoolYear = settings.currentSchoolYear || '2024-2025';
      console.log('[Dashboard API] Settings found:', { evaluationOpen, currentSemester, currentSchoolYear });
    } else {
      console.log('[Dashboard API] No settings found, using defaults');
    }

    // Calculate pending evaluations
    // Get all enrollments
    const enrollmentsRef = collection(db, 'enrollments');
    const enrollmentsSnapshot = await getDocs(enrollmentsRef);
    
    // Count unique student-subject pairs
    let totalEnrollments = 0;
    enrollmentsSnapshot.forEach(doc => {
      const data = doc.data();
      const subjectIds = data.subjectIds || [];
      totalEnrollments += subjectIds.length;
    });
    console.log('[Dashboard API] Total enrollment pairs:', totalEnrollments);

    // Calculate pending evaluations (total pairs - completed)
    const pendingEvaluations = totalEnrollments - completedEvaluations;
    console.log('[Dashboard API] Pending evaluations:', pendingEvaluations);

    const resultStats = {
      totalStudents,
      totalFaculty,
      totalSubjects,
      completedEvaluations,
      pendingEvaluations,
      evaluationOpen,
      currentSemester,
      currentSchoolYear
    };
    
    console.log('[Dashboard API] Returning stats:', resultStats);

    return NextResponse.json({
      success: true,
      stats: resultStats
    });
  } catch (error: any) {
    console.error('[Dashboard API] Get dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error.message },
      { status: 500 }
    );
  }
}
