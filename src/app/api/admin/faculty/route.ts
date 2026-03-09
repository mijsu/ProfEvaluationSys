import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET - Fetch all faculty
export async function GET() {
  try {
    const facultyRef = collection(db, 'faculty');
    const querySnapshot = await getDocs(facultyRef);

    const faculty = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));

    return NextResponse.json({
      success: true,
      faculty
    });
  } catch (error: any) {
    console.error('Get faculty error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculty' },
      { status: 500 }
    );
  }
}

// POST - Create new faculty
export async function POST(request: NextRequest) {
  try {
    const { name, department, email } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const facultyData = {
      name,
      department: department || '',
      email: email || '',
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'faculty'), facultyData);

    return NextResponse.json({
      success: true,
      faculty: {
        id: docRef.id,
        ...facultyData
      }
    });
  } catch (error: any) {
    console.error('Create faculty error:', error);
    return NextResponse.json(
      { error: 'Failed to create faculty' },
      { status: 500 }
    );
  }
}

// PUT - Update faculty
export async function PUT(request: NextRequest) {
  try {
    const { id, name, department, email } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const facultyRef = doc(db, 'faculty', id);
    await updateDoc(facultyRef, {
      name,
      department: department || '',
      email: email || ''
    });

    return NextResponse.json({
      success: true,
      message: 'Faculty updated successfully'
    });
  } catch (error: any) {
    console.error('Update faculty error:', error);
    return NextResponse.json(
      { error: 'Failed to update faculty' },
      { status: 500 }
    );
  }
}

// DELETE - Delete faculty
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, 'faculty', id));

    return NextResponse.json({
      success: true,
      message: 'Faculty deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete faculty error:', error);
    return NextResponse.json(
      { error: 'Failed to delete faculty' },
      { status: 500 }
    );
  }
}
