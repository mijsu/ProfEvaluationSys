import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { username, email } = await request.json();

    // Validate required fields
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const usersRef = collection(db, 'users');
    const usernameQuery = query(usersRef, where('username', '==', username));
    const usernameSnapshot = await getDocs(usernameQuery);

    if (usernameSnapshot.empty) {
      return NextResponse.json(
        { error: 'Username not found' },
        { status: 404 }
      );
    }

    // Check if there's already a pending password reset for this user
    const resetsRef = collection(db, 'passwordResets');
    const resetQuery = query(resetsRef, where('username', '==', username));
    const resetSnapshot = await getDocs(resetQuery);

    // If there's an existing reset, delete it (in a real app, you'd check timestamp)
    if (!resetSnapshot.empty) {
      resetSnapshot.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
    }

    // Create password reset request
    const resetRequest = {
      username,
      email: email || usernameSnapshot.docs[0].data().email || '',
      status: 'pending',
      requestedAt: new Date()
    };

    const resetDoc = await addDoc(resetsRef, resetRequest);

    return NextResponse.json({
      success: true,
      message: 'Password reset request submitted. Please contact your administrator to reset your password.',
      resetId: resetDoc.id
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to submit password reset request' },
      { status: 500 }
    );
  }
}
