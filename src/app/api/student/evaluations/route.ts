import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { studentId, subjectId, facultyId, ratings, totalScore, semester, schoolYear } = await request.json();

    if (!studentId || !subjectId || !facultyId || !ratings) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if evaluation already exists
    const evaluationsRef = collection(db, 'evaluations');
    const q = query(
      evaluationsRef,
      where('studentId', '==', studentId),
      where('subjectId', '==', subjectId)
    );
    const existingEvaluations = await getDocs(q);

    if (!existingEvaluations.empty) {
      return NextResponse.json(
        { error: 'Evaluation already submitted for this subject' },
        { status: 400 }
      );
    }

    // Create evaluation
    const evaluationData = {
      studentId,
      subjectId,
      facultyId,
      ratings,
      totalScore,
      semester,
      schoolYear,
      submittedAt: new Date()
    };

    await addDoc(evaluationsRef, evaluationData);

    // Update enrollment status
    const enrollmentsRef = collection(db, 'enrollments');
    const enrollmentQuery = query(
      enrollmentsRef,
      where('studentId', '==', studentId),
      where('subjectId', '==', subjectId)
    );
    const enrollmentSnapshot = await getDocs(enrollmentQuery);

    if (!enrollmentSnapshot.empty) {
      await updateDoc(doc(db, 'enrollments', enrollmentSnapshot.docs[0].id), {
        status: 'completed'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Evaluation submitted successfully'
    });
  } catch (error: any) {
    console.error('Submit evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
}
