import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { username, password, fullName, studentId, email, role } = await request.json();

    // Validate required fields
    if (!username || !password || !fullName || !studentId) {
      return NextResponse.json(
        { error: 'Username, password, full name, and student ID are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const usersRef = collection(db, 'users');
    const usernameQuery = query(usersRef, where('username', '==', username));
    const usernameSnapshot = await getDocs(usernameQuery);

    if (!usernameSnapshot.empty) {
      return NextResponse.json(
        { error: 'Username already exists. Please choose a different username.' },
        { status: 400 }
      );
    }

    // Check if studentId already exists in users collection
    const studentIdQuery = query(usersRef, where('studentId', '==', studentId.toUpperCase().trim()));
    const studentIdSnapshot = await getDocs(studentIdQuery);

    if (!studentIdSnapshot.empty) {
      return NextResponse.json(
        { error: 'An account with this Student ID already exists.' },
        { status: 400 }
      );
    }

    // CRITICAL: Check if the student is pre-registered by admin
    const preRegRef = collection(db, 'pre_registered_students');
    const preRegQuery = query(
      preRegRef, 
      where('studentId', '==', studentId.toUpperCase().trim())
    );
    const preRegSnapshot = await getDocs(preRegQuery);

    if (preRegSnapshot.empty) {
      return NextResponse.json(
        { error: 'You are not authorized to register. Please contact the administrator.' },
        { status: 403 }
      );
    }

    // Find the matching pre-registered record (must match both studentId AND fullName)
    let matchedPreReg = null;
    let matchedPreRegDoc = null;

    for (const docSnap of preRegSnapshot.docs) {
      const data = docSnap.data();
      // Match both studentId AND full name (case-insensitive for name)
      if (data.studentId === studentId.toUpperCase().trim() && 
          data.fullName.toLowerCase().trim() === fullName.toLowerCase().trim()) {
        matchedPreReg = data;
        matchedPreRegDoc = docSnap;
        break;
      }
    }

    if (!matchedPreReg) {
      return NextResponse.json(
        { error: 'Your name and Student ID do not match our records. Please contact the administrator.' },
        { status: 403 }
      );
    }

    // Check if already registered
    if (matchedPreReg.registered === true) {
      return NextResponse.json(
        { error: 'This account has already been registered. Please login instead.' },
        { status: 400 }
      );
    }

    // Create new user account
    const newUser = {
      username,
      password, // In production, this should be hashed!
      fullName: fullName.trim(),
      studentId: studentId.toUpperCase().trim(),
      email: email?.trim() || '', // Email is now optional
      role: role || 'student',
      preRegisteredId: matchedPreRegDoc.id,
      createdAt: new Date()
    };

    const userDoc = await addDoc(usersRef, newUser);

    // Update the pre-registered record to mark as registered
    const preRegDocRef = doc(db, 'pre_registered_students', matchedPreRegDoc.id);
    await updateDoc(preRegDocRef, {
      registered: true,
      userId: userDoc.id,
      registeredAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now login.',
      user: {
        id: userDoc.id,
        username: newUser.username,
        fullName: newUser.fullName,
        studentId: newUser.studentId,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
