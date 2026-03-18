import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Get enrollments for this student
    const enrollmentsRef = collection(db, 'enrollments');
    const enrollmentQuery = query(
      enrollmentsRef,
      where('studentId', '==', studentId)
    );

    const enrollmentSnapshot = await getDocs(enrollmentQuery);

    // Get all subject IDs and check evaluation status
    const subjectIds: string[] = [];

    for (const enrollmentDoc of enrollmentSnapshot.docs) {
      const data = enrollmentDoc.data();
      // subjectIds is an array of subject IDs
      if (data.subjectIds && Array.isArray(data.subjectIds)) {
        subjectIds.push(...data.subjectIds);
      }
    }

    if (subjectIds.length === 0) {
      return NextResponse.json({
        success: true,
        subjects: [],
        message: 'You are not enrolled in any subjects yet. Please contact your administrator.'
      });
    }

    // Get all enrolled subjects
    const subjects: any[] = [];

    // Get all subjects at once instead of individually
    const subjectsRef = collection(db, 'subjects');
    const subjectsSnapshot = await getDocs(subjectsRef);

    // Create a map of subject IDs to subject data
    const subjectsMap = new Map();
    subjectsSnapshot.docs.forEach(doc => {
      subjectsMap.set(doc.id, doc.data());
    });

    for (const subjectId of subjectIds) {
      // Skip invalid subject IDs
      if (!subjectId) continue;

      const subjectData = subjectsMap.get(subjectId);

      if (subjectData) {
        // Check if this subject has been evaluated by the student
        const evaluationsRef = collection(db, 'evaluations');
        const evaluationQuery = query(
          evaluationsRef,
          where('studentId', '==', studentId),
          where('subjectId', '==', subjectId)
        );
        const evaluationSnapshot = await getDocs(evaluationQuery);
        const isEvaluated = !evaluationSnapshot.empty;

        console.log(`Subject ${subjectId}: isEvaluated=${isEvaluated}`);

        subjects.push({
          id: subjectId,
          code: subjectData.code,
          title: subjectData.title,
          instructorName: subjectData.instructorName,
          instructorId: subjectData.instructorId,
          evaluationStatus: isEvaluated ? 'completed' : 'pending'
        });
      }
    }

    return NextResponse.json({
      success: true,
      subjects
    });
  } catch (error: any) {
    console.error('Get subjects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}
