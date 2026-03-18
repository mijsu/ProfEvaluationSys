import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET - Fetch all subjects
export async function GET() {
  try {
    const subjectsRef = collection(db, 'subjects');
    const querySnapshot = await getDocs(subjectsRef);

    const subjects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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

// POST - Create new subject
export async function POST(request: NextRequest) {
  try {
    const { code, title, instructorId, instructorName, semester, schoolYear } = await request.json();

    if (!code || !title || !instructorId || !instructorName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const subjectData = {
      code,
      title,
      instructorId,
      instructorName,
      semester: semester || '1st Semester',
      schoolYear: schoolYear || '2024-2025'
    };

    const docRef = await addDoc(collection(db, 'subjects'), subjectData);

    return NextResponse.json({
      success: true,
      subject: {
        id: docRef.id,
        ...subjectData
      }
    });
  } catch (error: any) {
    console.error('Create subject error:', error);
    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}

// PUT - Update subject
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    const subjectRef = doc(db, 'subjects', id);
    await updateDoc(subjectRef, updates);

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully'
    });
  } catch (error: any) {
    console.error('Update subject error:', error);
    return NextResponse.json(
      { error: 'Failed to update subject' },
      { status: 500 }
    );
  }
}

// DELETE - Delete subject
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, 'subjects', id));

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete subject error:', error);
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    );
  }
}
