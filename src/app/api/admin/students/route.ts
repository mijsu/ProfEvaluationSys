import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET - Fetch all students
export async function GET() {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);

    const students = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));

    return NextResponse.json({
      success: true,
      students
    });
  } catch (error: any) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST - Create new student
export async function POST(request: NextRequest) {
  try {
    const { username, password, fullName, email, year, course } = await request.json();

    if (!username || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const existingUser = await getDocs(q);

    if (!existingUser.empty) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Create student
    const studentData = {
      username,
      password,
      fullName,
      email: email || '',
      year: year || '',
      course: course || '',
      role: 'student',
      createdAt: new Date()
    };

    const docRef = await addDoc(usersRef, studentData);

    return NextResponse.json({
      success: true,
      student: {
        id: docRef.id,
        ...studentData
      }
    });
  } catch (error: any) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

// PUT - Update student
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const studentRef = doc(db, 'users', id);
    await updateDoc(studentRef, updates);

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully'
    });
  } catch (error: any) {
    console.error('Update student error:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// DELETE - Delete student and all associated data
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Delete all enrollments for this student
    const enrollmentsRef = collection(db, 'enrollments');
    const enrollmentsQuery = query(enrollmentsRef, where('studentId', '==', id));
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    
    const deleteEnrollmentPromises = enrollmentsSnapshot.docs.map(enrollmentDoc => 
      deleteDoc(doc(db, 'enrollments', enrollmentDoc.id))
    );
    await Promise.all(deleteEnrollmentPromises);

    // Delete all evaluations by this student
    const evaluationsRef = collection(db, 'evaluations');
    const evaluationsQuery = query(evaluationsRef, where('studentId', '==', id));
    const evaluationsSnapshot = await getDocs(evaluationsQuery);
    
    const deleteEvaluationPromises = evaluationsSnapshot.docs.map(evaluationDoc =>
      deleteDoc(doc(db, 'evaluations', evaluationDoc.id))
    );
    await Promise.all(deleteEvaluationPromises);

    // Delete from pre-registered students if exists
    const preRegRef = collection(db, 'preRegisteredStudents');
    const preRegQuery = query(preRegRef, where('userId', '==', id));
    const preRegSnapshot = await getDocs(preRegQuery);
    
    const deletePreRegPromises = preRegSnapshot.docs.map(preRegDoc =>
      deleteDoc(doc(db, 'preRegisteredStudents', preRegDoc.id))
    );
    await Promise.all(deletePreRegPromises);

    // Finally, delete the student
    await deleteDoc(doc(db, 'users', id));

    return NextResponse.json({
      success: true,
      message: 'Student and all associated data deleted successfully',
      deletedEnrollments: enrollmentsSnapshot.size,
      deletedEvaluations: evaluationsSnapshot.size
    });
  } catch (error: any) {
    console.error('Delete student error:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}
