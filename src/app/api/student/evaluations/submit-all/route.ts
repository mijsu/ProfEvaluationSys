import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { evaluations } = await request.json();

    console.log('Submit all - Received evaluations:', evaluations.length);

    if (!evaluations || !Array.isArray(evaluations) || evaluations.length === 0) {
      console.error('Submit all - No evaluations provided');
      return NextResponse.json(
        { error: 'No evaluations to submit' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Process each evaluation
    for (const evaluation of evaluations) {
      try {
        const { studentId, subjectId, facultyId, ratings, totalScore, semester, schoolYear } = evaluation;

        console.log('Submit all - Processing evaluation for subject:', subjectId);

        if (!studentId || !subjectId || !facultyId || !ratings) {
          console.error('Submit all - Missing required fields for subject:', subjectId, { studentId, subjectId, facultyId, hasRatings: !!ratings });
          errors.push({ subjectId, error: 'Missing required fields' });
          continue;
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
          console.error('Submit all - Evaluation already exists for subject:', subjectId);
          errors.push({ subjectId, error: 'Evaluation already submitted for this subject' });
          continue;
        }

        // Create evaluation
        const evaluationData = {
          studentId,
          subjectId,
          facultyId,
          ratings,
          totalScore,
          semester: semester || '1st Semester',
          schoolYear: schoolYear || '2024-2025',
          submittedAt: new Date()
        };

        const docRef = await addDoc(evaluationsRef, evaluationData);
        console.log('Submit all - Successfully saved evaluation for subject:', subjectId);
        results.push({ subjectId, id: docRef.id });

      } catch (error: any) {
        console.error('Error submitting evaluation for subject:', evaluation.subjectId, error);
        errors.push({ subjectId: evaluation.subjectId, error: error.message });
      }
    }

    // Update enrollment statuses for all successfully submitted evaluations
    for (const result of results) {
      try {
        const enrollmentsRef = collection(db, 'enrollments');
        const userDoc = await getDoc(doc(db, 'users', evaluations[0].studentId));

        if (userDoc.exists()) {
          const enrollmentQuery = query(
            enrollmentsRef,
            where('studentId', '==', evaluations[0].studentId)
          );
          const enrollmentSnapshot = await getDocs(enrollmentQuery);

          for (const enrollmentDoc of enrollmentSnapshot.docs) {
            const enrollmentData = enrollmentDoc.data();
            if (enrollmentData.subjectIds && Array.isArray(enrollmentData.subjectIds)) {
              if (enrollmentData.subjectIds.includes(result.subjectId)) {
                await updateDoc(doc(db, 'enrollments', enrollmentDoc.id), {
                  status: 'completed'
                });
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error updating enrollment status:', error);
      }
    }

    // Return response based on results
    console.log('Submit all - Results:', { submitted: results.length, failed: errors.length, errors });
    
    if (errors.length > 0 && results.length === 0) {
      return NextResponse.json(
        { error: 'Failed to submit evaluations', details: errors },
        { status: 400 }
      );
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Submitted ${results.length} of ${evaluations.length} evaluations`,
        submitted: results.length,
        failed: errors.length,
        errors
      });
    }

    console.log('Submit all - All evaluations submitted successfully');
    return NextResponse.json({
      success: true,
      message: `Successfully submitted ${results.length} evaluation${results.length > 1 ? 's' : ''}`,
      submitted: results.length,
      failed: 0
    });

  } catch (error: any) {
    console.error('Submit all evaluations error:', error);
    return NextResponse.json(
      { error: 'Failed to submit evaluations', details: error.message },
      { status: 500 }
    );
  }
}
