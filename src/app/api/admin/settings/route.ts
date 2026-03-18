import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, updateDoc, doc, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET - Fetch system settings
export async function GET() {
  try {
    const settingsRef = collection(db, 'settings');
    const q = query(settingsRef, limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: true,
        settings: {
          evaluationOpen: true,
          currentSemester: '1st Semester',
          currentSchoolYear: '2024-2025'
        }
      });
    }

    const settings = querySnapshot.docs[0].data();

    return NextResponse.json({
      success: true,
      settings: {
        id: querySnapshot.docs[0].id,
        ...settings
      }
    });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST - Update settings
export async function POST(request: NextRequest) {
  try {
    const { evaluationOpen, currentSemester, currentSchoolYear } = await request.json();

    const settingsRef = collection(db, 'settings');
    const q = query(settingsRef, limit(1));
    const querySnapshot = await getDocs(q);

    const settingsData = {
      evaluationOpen: evaluationOpen !== undefined ? evaluationOpen : true,
      currentSemester: currentSemester || '1st Semester',
      currentSchoolYear: currentSchoolYear || '2024-2025'
    };

    if (querySnapshot.empty) {
      await addDoc(settingsRef, settingsData);
    } else {
      const settingId = querySnapshot.docs[0].id;
      await updateDoc(doc(db, 'settings', settingId), settingsData);
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: settingsData
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
