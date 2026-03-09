import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET - Fetch all pre-registered students
export async function GET() {
  try {
    const preRegRef = collection(db, 'pre_registered_students');
    const querySnapshot = await getDocs(preRegRef);

    const students = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));

    // Sort by createdAt descending in memory
    students.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      students
    });
  } catch (error: any) {
    console.error('Get pre-registered students error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pre-registered students' },
      { status: 500 }
    );
  }
}

// POST - Add new pre-registered student
export async function POST(request: NextRequest) {
  try {
    const { fullName, studentId } = await request.json();

    if (!fullName || !studentId) {
      return NextResponse.json(
        { error: 'Full Name and Student ID are required' },
        { status: 400 }
      );
    }

    // Check if studentId already exists in pre-registered list
    const preRegRef = collection(db, 'pre_registered_students');
    const studentIdQuery = query(preRegRef, where('studentId', '==', studentId.toUpperCase().trim()));
    const existingPreReg = await getDocs(studentIdQuery);

    if (!existingPreReg.empty) {
      return NextResponse.json(
        { error: 'A student with this Student ID is already pre-registered' },
        { status: 400 }
      );
    }

    // Check if studentId already exists in users (already registered)
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('studentId', '==', studentId.toUpperCase().trim()));
    const existingUser = await getDocs(userQuery);

    if (!existingUser.empty) {
      return NextResponse.json(
        { error: 'A user with this Student ID already has an account' },
        { status: 400 }
      );
    }

    // Create pre-registered student
    const studentData = {
      fullName: fullName.trim(),
      studentId: studentId.toUpperCase().trim(),
      registered: false,
      userId: null,
      createdAt: new Date()
    };

    const docRef = await addDoc(preRegRef, studentData);

    return NextResponse.json({
      success: true,
      student: {
        id: docRef.id,
        ...studentData
      }
    });
  } catch (error: any) {
    console.error('Add pre-registered student error:', error);
    return NextResponse.json(
      { error: 'Failed to add pre-registered student' },
      { status: 500 }
    );
  }
}

// PUT - Update pre-registered student
export async function PUT(request: NextRequest) {
  try {
    const { id, fullName, studentId } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Check if new studentId already exists (if studentId is being changed)
    if (studentId) {
      const preRegRef = collection(db, 'pre_registered_students');
      const studentIdQuery = query(preRegRef, where('studentId', '==', studentId.toUpperCase().trim()));
      const existingPreReg = await getDocs(studentIdQuery);

      // If found and it's not the same record
      const foundDoc = existingPreReg.docs.find(d => d.id !== id);
      if (foundDoc) {
        return NextResponse.json(
          { error: 'A student with this Student ID is already pre-registered' },
          { status: 400 }
        );
      }
    }

    const studentRef = doc(db, 'pre_registered_students', id);
    const updates: any = {};
    if (fullName) updates.fullName = fullName.trim();
    if (studentId) updates.studentId = studentId.toUpperCase().trim();

    await updateDoc(studentRef, updates);

    return NextResponse.json({
      success: true,
      message: 'Pre-registered student updated successfully'
    });
  } catch (error: any) {
    console.error('Update pre-registered student error:', error);
    return NextResponse.json(
      { error: 'Failed to update pre-registered student' },
      { status: 500 }
    );
  }
}

// DELETE - Delete pre-registered student
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

    await deleteDoc(doc(db, 'pre_registered_students', id));

    return NextResponse.json({
      success: true,
      message: 'Pre-registered student deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete pre-registered student error:', error);
    return NextResponse.json(
      { error: 'Failed to delete pre-registered student' },
      { status: 500 }
    );
  }
}
