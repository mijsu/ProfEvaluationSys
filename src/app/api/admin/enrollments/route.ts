import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET - Fetch all enrollments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const enrollmentId = searchParams.get('id');

    if (enrollmentId) {
      const enrollmentDoc = await getDoc(doc(db, 'enrollments', enrollmentId));
      if (!enrollmentDoc.exists()) {
        return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
      }

      const data = enrollmentDoc.data();
      const enrollment = {
        id: enrollmentDoc.id,
        studentId: data.studentId,
        subjectIds: data.subjectIds || [],
        createdAt: data.createdAt?.toDate?.() || new Date()
      };

      const studentDoc = await getDoc(doc(db, 'users', data.studentId));
      const studentData = studentDoc.exists() ? studentDoc.data() : null;

      const subjectsRef = collection(db, 'subjects');
      const subjectsSnapshot = await getDocs(subjectsRef);
      const subjectsMap = new Map<string, any>();
      for (const subjectId of data.subjectIds || []) {
        const subjectDoc = await getDoc(doc(db, 'subjects', subjectId));
        if (subjectDoc.exists()) {
          subjectsMap.set(subjectId, subjectDoc.data());
        }
      }

      const facultyRef = collection(db, 'faculty');
      const facultySnapshot = await getDocs(facultyRef);
      const facultyMap = new Map<string, string>();
      facultySnapshot.docs.forEach(doc => {
        facultyMap.set(doc.id, doc.data().name);
      });

      return NextResponse.json({
        success: true,
        enrollment: {
          ...enrollment,
          studentName: studentData?.fullName || 'Unknown',
          subjects: subjectsMap.get(enrollment.studentId + '_combined') || [],
          facultyNames: facultyMap
        }
      });
    }

    const enrollmentsRef = collection(db, 'enrollments');
    const querySnapshot = await getDocs(enrollmentsRef);

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: true,
        enrollments: []
      });
    }

    const enrollments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        subjectIds: data.subjectIds || [],
        createdAt: data.createdAt?.toDate?.() || new Date()
      };
    });

    const studentsRef = collection(db, 'users');
    const studentsSnapshot = await getDocs(studentsRef);
    const studentMap = new Map();
    studentsSnapshot.docs.forEach(doc => {
      studentMap.set(doc.id, {
        fullName: doc.data().fullName,
        username: doc.data().username,
        email: doc.data().email
      });
    });

    const subjectsRef = collection(db, 'subjects');
    const subjectsSnapshot = await getDocs(subjectsRef);
    const subjectsMap = new Map();
    subjectsSnapshot.docs.forEach(doc => {
      subjectsMap.set(doc.id, doc.data());
    });

    const facultyRef = collection(db, 'faculty');
    const facultySnapshot = await getDocs(facultyRef);
    const facultyMap = new Map();
    facultySnapshot.docs.forEach(doc => {
      facultyMap.set(doc.id, doc.data().name);
    });

    const enrichedEnrollments: any[] = [];
    for (const enrollment of enrollments) {
      const student = studentMap.get(enrollment.studentId);
      const subjectIds = enrollment.subjectIds || [];

      // Flatten: create one enrollment record per subject
      for (const subjectId of subjectIds) {
        const subject = subjectsMap.get(subjectId);
        enrichedEnrollments.push({
          id: enrollment.id + '_' + subjectId, // Create unique ID for each subject enrollment
          studentId: enrollment.studentId,
          studentName: student?.fullName || 'Unknown',
          subjectId: subjectId,
          subjectCode: subject?.code || 'Unknown',
          subjectTitle: subject?.title || 'Unknown',
          facultyId: subject?.instructorId || 'Unknown',
          facultyName: facultyMap.get(subject?.instructorId || 'Unknown') || 'Unknown',
          createdAt: enrollment.createdAt
        });
      }
    }

    return NextResponse.json({
      success: true,
      enrollments: enrichedEnrollments
    });
  } catch (error: any) {
    console.error('Get enrollments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

// POST - Create new enrollment with multiple subjects
export async function POST(request: NextRequest) {
  try {
    const { studentId, subjectId, subjectIds } = await request.json();

    // Handle both single subjectId and array of subjectIds
    const finalSubjectIds = subjectIds || (subjectId ? [subjectId] : []);

    if (!studentId || finalSubjectIds.length === 0) {
      return NextResponse.json(
        { error: 'Username and at least one Subject ID are required' },
        { status: 400 }
      );
    }

    const studentDoc = await getDoc(doc(db, 'users', studentId));
    if (!studentDoc.exists()) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    for (const subjectId of finalSubjectIds) {
      const subjectDoc = await getDoc(doc(db, 'subjects', subjectId));
      if (!subjectDoc.exists()) {
        return NextResponse.json(
          { error: 'Subject with ID ' + subjectId + ' not found' },
          { status: 404 }
        );
      }
    }

    const enrollmentsRef = collection(db, 'enrollments');

    // Check if student already has an enrollment document
    const existingQuery = query(
      enrollmentsRef,
      where('studentId', '==', studentId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    // Check for duplicate subjects
    for (const subjectId of finalSubjectIds) {
      for (const doc of existingSnapshot.docs) {
        const existingSubjectIds = doc.data().subjectIds || [];
        if (existingSubjectIds.includes(subjectId)) {
          return NextResponse.json(
            { error: 'Student is already enrolled in this subject' },
            { status: 400 }
          );
        }
      }
    }

    // If student has existing enrollment, add subjects to it
    // Otherwise, create new enrollment
    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0];
      const existingSubjectIds = existingDoc.data().subjectIds || [];
      const updatedSubjectIds = [...existingSubjectIds, ...finalSubjectIds];

      await updateDoc(doc(db, 'enrollments', existingDoc.id), {
        subjectIds: updatedSubjectIds,
        updatedAt: new Date()
      });

      return NextResponse.json({
        success: true,
        message: 'Enrollment created successfully',
        enrollmentId: existingDoc.id
      });
    }

    const enrollmentData = {
      studentId,
      subjectIds: finalSubjectIds,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'enrollments'), enrollmentData);

    return NextResponse.json({
      success: true,
      message: 'Enrollment created successfully',
      enrollmentId: docRef.id
    });
  } catch (error: any) {
    console.error('Create enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to create enrollment' },
      { status: 500 }
    );
  }
}

// PUT - Update enrollment
export async function PUT(request: NextRequest) {
  try {
    const { id, subjectIds } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }

    if (!subjectIds) {
      return NextResponse.json(
        { error: 'Subject IDs are required' },
        { status: 400 }
      );
    }

    const enrollmentDoc = await getDoc(doc(db, 'enrollments', id));
    if (!enrollmentDoc.exists()) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    const currentData = enrollmentDoc.data();
    await updateDoc(doc(db, 'enrollments', id), {
      subjectIds,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Enrollment updated successfully'
    });
  } catch (error: any) {
    console.error('Update enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to update enrollment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete enrollment
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const enrollmentId = searchParams.get('id');

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }

    // Handle composite ID format: enrollmentId_subjectId
    // We need to extract just the enrollment document ID
    const parts = enrollmentId.split('_');
    const docId = parts[0];

    const enrollmentDoc = await getDoc(doc(db, 'enrollments', docId));
    if (!enrollmentDoc.exists()) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    const currentData = enrollmentDoc.data();

    // If there are multiple parts, remove only that subject from the array
    if (parts.length > 1) {
      const subjectIdToRemove = parts[1];
      const updatedSubjectIds = (currentData.subjectIds || []).filter((id: string) => id !== subjectIdToRemove);

      if (updatedSubjectIds.length === 0) {
        // If no subjects left, delete the entire document
        await deleteDoc(doc(db, 'enrollments', docId));
      } else {
        // Otherwise, update with remaining subjects
        await updateDoc(doc(db, 'enrollments', docId), {
          subjectIds: updatedSubjectIds,
          updatedAt: new Date()
        });
      }
    } else {
      // Legacy: delete entire document
      await deleteDoc(doc(db, 'enrollments', docId));
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete enrollment' },
      { status: 500 }
    );
  }
}
