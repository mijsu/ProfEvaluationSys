export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: 'student' | 'admin';
  createdAt: Date;
}

export interface Subject {
  id: string;
  code: string;
  title: string;
  instructorId: string;
  instructorName: string;
  semester: string;
  schoolYear: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  subjectId: string;
  status: 'pending' | 'completed';
}

export interface Faculty {
  id: string;
  name: string;
  department: string;
  email?: string;
  createdAt: Date;
}

export interface Evaluation {
  id: string;
  studentId: string;
  subjectId: string;
  facultyId: string;
  semester: string;
  schoolYear: string;
  ratings: {
    A: { [key: string]: number };
    B: { [key: string]: number };
    C: { [key: string]: number };
    D: { [key: string]: number };
  };
  totalScore: number;
  submittedAt: Date;
}

export interface EvaluationCriteria {
  section: 'A' | 'B' | 'C' | 'D';
  title: string;
  items: string[];
}

export interface SystemSettings {
  evaluationOpen: boolean;
  currentSemester: string;
  currentSchoolYear: string;
}
