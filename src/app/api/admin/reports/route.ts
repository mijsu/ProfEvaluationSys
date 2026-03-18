import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const facultyFilter = searchParams.get('facultyId');
    const semesterFilter = searchParams.get('semester');

    // Get all evaluations
    const evaluationsRef = collection(db, 'evaluations');
    const querySnapshot = await getDocs(evaluationsRef);

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: true,
        reportData: {
          totalEvaluations: 0,
          averageScore: 0,
          facultyPerformance: [],
          subjectPerformance: [],
          semesterData: [],
          recentEvaluations: []
        }
      });
    }

    const evaluations = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        subjectId: data.subjectId,
        facultyId: data.facultyId,
        ratings: data.ratings,
        totalScore: data.totalScore,
        semester: data.semester || '1st Semester',
        schoolYear: data.schoolYear || '2024-2025',
        submittedAt: data.submittedAt?.toDate?.() || new Date()
      };
    });

    // Get student names
    const studentsRef = collection(db, 'users');
    const studentsSnapshot = await getDocs(studentsRef);
    const studentMap = new Map();
    studentsSnapshot.docs.forEach(doc => {
      studentMap.set(doc.id, doc.data().fullName);
    });

    // Get subject information
    const subjectsRef = collection(db, 'subjects');
    const subjectsSnapshot = await getDocs(subjectsRef);
    const subjectMap = new Map();
    subjectsSnapshot.docs.forEach(doc => {
      subjectMap.set(doc.id, {
        code: doc.data().code,
        title: doc.data().title
      });
    });

    // Get faculty names
    const facultyRef = collection(db, 'faculty');
    const facultySnapshot = await getDocs(facultyRef);
    const facultyMap = new Map();
    facultySnapshot.docs.forEach(doc => {
      facultyMap.set(doc.id, {
        name: doc.data().name,
        id: doc.id
      });
    });

    // Apply filters
    let filteredEvaluations = evaluations;
    if (facultyFilter) {
      filteredEvaluations = filteredEvaluations.filter(e => e.facultyId === facultyFilter);
    }
    if (semesterFilter) {
      const [sem] = semesterFilter.split(' ');
      filteredEvaluations = filteredEvaluations.filter(e => e.semester.includes(sem));
    }

    // Calculate total evaluations and average score
    const totalEvaluations = filteredEvaluations.length;
    // Convert stored scores (out of 20) to percentages
    const averagePercentage = totalEvaluations > 0 ? (filteredEvaluations.reduce((sum, e) => sum + (e.totalScore || 0), 0) / totalEvaluations) / 20 * 100 : 0;

    // Calculate faculty performance
    const facultyPerformanceMap = new Map<string, { totalScore: number; count: number; name: string; id: string }>();
    filteredEvaluations.forEach(evaluation => {
      const facultyId = evaluation.facultyId;
      const faculty = facultyMap.get(facultyId);
      if (!faculty) return;

      const current = facultyPerformanceMap.get(facultyId) || { totalScore: 0, count: 0, name: faculty.name, id: faculty.id };
      // Scores are already out of 20
      current.totalScore += evaluation.totalScore || 0;
      current.count += 1;
      facultyPerformanceMap.set(facultyId, current);
    });

    const facultyPerformance = Array.from(facultyPerformanceMap.values()).map(f => ({
      name: f.name,
      id: f.id,
      // Convert to percentage: (average out of 20) / 20 * 100
      average: f.count > 0 ? Math.round((f.totalScore / f.count) / 20 * 100) : 0,
      evaluations: f.count
    })).sort((a, b) => b.average - a.average);

    // Calculate subject performance
    const subjectPerformanceMap = new Map<string, { totalScore: number; count: number; code: string; title: string }>();
    filteredEvaluations.forEach(evaluation => {
      const subjectId = evaluation.subjectId;
      const subject = subjectMap.get(subjectId);
      if (!subject) return;

      const current = subjectPerformanceMap.get(subjectId) || { totalScore: 0, count: 0, code: subject.code, title: subject.title };
      // Scores are already out of 20
      current.totalScore += evaluation.totalScore || 0;
      current.count += 1;
      subjectPerformanceMap.set(subjectId, current);
    });

    const subjectPerformance = Array.from(subjectPerformanceMap.values()).map(s => ({
      code: s.code,
      title: s.title,
      // Convert to percentage: (average out of 20) / 20 * 100
      average: s.count > 0 ? Math.round((s.totalScore / s.count) / 20 * 100) : 0,
      evaluations: s.count
    })).sort((a, b) => b.average - a.average);

    // Calculate semester data
    const semesterDataMap = new Map<string, { totalScore: number; count: number }>();
    filteredEvaluations.forEach(evaluation => {
      const semesterKey = `${evaluation.semester} ${evaluation.schoolYear}`;
      const current = semesterDataMap.get(semesterKey) || { totalScore: 0, count: 0 };
      // Scores are already out of 20
      current.totalScore += evaluation.totalScore || 0;
      current.count += 1;
      semesterDataMap.set(semesterKey, current);
    });

    const semesterData = Array.from(semesterDataMap.entries()).map(([semester, data]) => ({
      semester,
      total: data.count,
      // Convert to percentage: (average out of 20) / 20 * 100
      average: data.count > 0 ? Math.round((data.totalScore / data.count) / 20 * 100) : 0
    })).sort((a, b) => b.semester.localeCompare(a.semester));

    // Get recent evaluations
    const recentEvaluations = filteredEvaluations
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10)
      .map(e => ({
        id: e.id,
        faculty: facultyMap.get(e.facultyId)?.name || 'Unknown',
        facultyId: e.facultyId,
        subject: subjectMap.get(e.subjectId)?.code || 'Unknown',
        subjectTitle: subjectMap.get(e.subjectId)?.title || 'Unknown',
        score: e.totalScore || 0,
        date: e.submittedAt
      }));

    return NextResponse.json({
      success: true,
      reportData: {
        totalEvaluations,
        averageScore: Math.round(averagePercentage * 100) / 100,
        facultyPerformance,
        subjectPerformance,
        semesterData,
        recentEvaluations
      }
    });
  } catch (error: any) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}
