import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST() {
  try {
    console.log('[Fix Scores] Starting to fix evaluation scores...');
    
    const evaluationsRef = collection(db, 'evaluations');
    const snapshot = await getDocs(evaluationsRef);
    
    let fixedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const data = docSnapshot.data();
        const oldScore = data.totalScore;
        
        // Calculate the correct total score
        // Sum all ratings and divide by 5 (since 20 questions × 5 max = 100, divide by 5 to get score out of 20)
        let sum = 0;
        if (data.ratings) {
          Object.values(data.ratings).forEach((section: any) => {
            if (section && typeof section === 'object') {
              Object.values(section).forEach((rating: number) => {
                sum += rating;
              });
            }
          });
        }
        
        const newScore = sum / 5;
        
        // Only update if the score needs fixing
        if (Math.abs(oldScore - newScore) > 0.01) {
          await updateDoc(doc(db, 'evaluations', docSnapshot.id), {
            totalScore: newScore
          });
          fixedCount++;
          console.log(`[Fix Scores] Fixed evaluation ${docSnapshot.id}: ${oldScore} → ${newScore}`);
        }
      } catch (error: any) {
        errorCount++;
        errors.push(`Evaluation ${docSnapshot.id}: ${error.message}`);
        console.error(`[Fix Scores] Error fixing evaluation ${docSnapshot.id}:`, error);
      }
    }
    
    console.log(`[Fix Scores] Completed: ${fixedCount} fixed, ${errorCount} errors`);
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} evaluations${errorCount > 0 ? ` with ${errorCount} errors` : ''}`,
      fixedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('[Fix Scores] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fix scores', details: error.message },
      { status: 500 }
    );
  }
}
