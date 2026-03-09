/**
 * Firebase Database Seed Script
 * Run this script to populate your Firebase database with initial data
 * Usage: bun run scripts/seed-firebase.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, limit, writeBatch, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTIXZcNDAJU-VwA93fVNdvqgWmIgZIpwA",
  authDomain: "evaluation-b38b8.firebaseapp.com",
  projectId: "evaluation-b38b8",
  storageBucket: "evaluation-b38b8.firebasestorage.app",
  messagingSenderId: "658850406057",
  appId: "1:658850406057:web:02c9580815489ac65293b8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data
const sampleUsers = [
  {
    username: 'admin',
    password: 'admin123',
    fullName: 'Admin Maria',
    email: 'admin@cnscc.edu.ph',
    role: 'admin',
    createdAt: new Date()
  },
  {
    username: 'student1',
    password: 'student123',
    fullName: 'Sandra Dela Cruz',
    email: 'sandra@cnscc.edu.ph',
    role: 'student',
    createdAt: new Date()
  },
  {
    username: 'student2',
    password: 'student123',
    fullName: 'John Doe',
    email: 'john@cnscc.edu.ph',
    role: 'student',
    createdAt: new Date()
  }
];

const sampleFaculty = [
  {
    name: 'Prof. Maria Santos',
    department: 'English Department',
    email: 'maria.santos@cnscc.edu.ph',
    createdAt: new Date()
  },
  {
    name: 'Mr. Juan Perez',
    department: 'Mathematics Department',
    email: 'juan.perez@cnscc.edu.ph',
    createdAt: new Date()
  },
  {
    name: 'Engr. Michael Flores',
    department: 'IT Department',
    email: 'michael.flores@cnscc.edu.ph',
    createdAt: new Date()
  },
  {
    name: 'Mr. Allan Reyes',
    department: 'IT Department',
    email: 'allan.reyes@cnscc.edu.ph',
    createdAt: new Date()
  },
  {
    name: 'Dr. Susan Villanueva',
    department: 'Science Department',
    email: 'susan.villanueva@cnscc.edu.ph',
    createdAt: new Date()
  }
];

const sampleSubjects = [];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create Settings
    console.log('Creating settings...');
    const settingsRef = collection(db, 'settings');
    const settingsQuery = query(settingsRef, limit(1));
    const settingsSnapshot = await getDocs(settingsQuery);

    if (settingsSnapshot.empty) {
      await addDoc(settingsRef, {
        evaluationOpen: true,
        currentSemester: '1st Semester',
        currentSchoolYear: '2024-2025'
      });
      console.log('✅ Settings created');
    } else {
      console.log('ℹ️  Settings already exist');
    }

    // 2. Create Users
    console.log('Creating users...');
    const usersRef = collection(db, 'users');

    for (const user of sampleUsers) {
      // Check if user already exists
      const q = query(usersRef, where('username', '==', user.username));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(usersRef, user);
        console.log(`✅ User created: ${user.username}`);
      } else {
        console.log(`ℹ️  User already exists: ${user.username}`);
      }
    }

    // 3. Create Faculty
    console.log('Creating faculty...');
    const facultyRef = collection(db, 'faculty');

    const facultyIds = {};

    for (const faculty of sampleFaculty) {
      // Check if faculty already exists
      const q = query(facultyRef, where('name', '==', faculty.name));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const docRef = await addDoc(facultyRef, faculty);
        facultyIds[faculty.name] = docRef.id;
        console.log(`✅ Faculty created: ${faculty.name}`);
      } else {
        facultyIds[faculty.name] = snapshot.docs[0].id;
        console.log(`ℹ️  Faculty already exists: ${faculty.name}`);
      }
    }

    // 4. Get student IDs
    console.log('Getting student IDs...');
    const studentsQuery = query(usersRef, where('role', '==', 'student'));
    const studentsSnapshot = await getDocs(studentsQuery);
    const studentIds = studentsSnapshot.docs.map(doc => doc.id);

    // 5. Create Subjects
    console.log('Creating subjects...');
    const subjectsRef = collection(db, 'subjects');
    const subjectData = [
      {
        code: 'ENGL 101',
        title: 'English Communication Skills 1',
        instructorId: facultyIds['Prof. Maria Santos'],
        instructorName: 'Prof. Maria Santos',
        semester: '1st Semester',
        schoolYear: '2024-2025'
      },
      {
        code: 'MATH 101',
        title: 'College Algebra',
        instructorId: facultyIds['Mr. Juan Perez'],
        instructorName: 'Mr. Juan Perez',
        semester: '1st Semester',
        schoolYear: '2024-2025'
      },
      {
        code: 'IT 102',
        title: 'Computer Programming 1',
        instructorId: facultyIds['Engr. Michael Flores'],
        instructorName: 'Engr. Michael Flores',
        semester: '1st Semester',
        schoolYear: '2024-2025'
      },
      {
        code: 'IT 103',
        title: 'Data Structures',
        instructorId: facultyIds['Mr. Allan Reyes'],
        instructorName: 'Mr. Allan Reyes',
        semester: '1st Semester',
        schoolYear: '2024-2025'
      },
      {
        code: 'PHY 101',
        title: 'Physics',
        instructorId: facultyIds['Dr. Susan Villanueva'],
        instructorName: 'Dr. Susan Villanueva',
        semester: '1st Semester',
        schoolYear: '2024-2025'
      }
    ];

    const subjectIds = {};

    for (const subject of subjectData) {
      const q = query(subjectsRef, where('code', '==', subject.code));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const docRef = await addDoc(subjectsRef, subject);
        subjectIds[subject.code] = docRef.id;
        console.log(`✅ Subject created: ${subject.code}`);
      } else {
        subjectIds[subject.code] = snapshot.docs[0].id;
        console.log(`ℹ️  Subject already exists: ${subject.code}`);
      }
    }

    // 6. Create Enrollments (enroll students in subjects)
    console.log('Creating enrollments...');
    const enrollmentsRef = collection(db, 'enrollments');

    for (const studentId of studentIds) {
      for (const [code, subjectId] of Object.entries(subjectIds)) {
        const q = query(
          enrollmentsRef,
          where('studentId', '==', studentId),
          where('subjectId', '==', subjectId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          await addDoc(enrollmentsRef, {
            studentId,
            subjectId,
            status: 'pending',
            createdAt: new Date()
          });
          console.log(`✅ Enrollment created for student ${studentId} in ${code}`);
        } else {
          console.log(`ℹ️  Enrollment already exists for student ${studentId} in ${code}`);
        }
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin: username=admin, password=admin123');
    console.log('   Student 1: username=student1, password=student123');
    console.log('   Student 2: username=student2, password=student123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase().then(() => {
  process.exit(0);
});
