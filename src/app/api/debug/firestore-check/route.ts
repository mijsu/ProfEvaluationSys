import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const collections = ['users', 'faculty', 'subjects', 'evaluations', 'enrollments', 'settings'];
    const results: any = {};

    for (const colName of collections) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      results[colName] = {
        count: snapshot.docs.length,
        data: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      };
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error('Firestore check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check Firestore' },
      { status: 500 }
    );
  }
}
