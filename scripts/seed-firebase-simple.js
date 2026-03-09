/**
 * Simple Firebase Database Seed Script
 * Run this script to populate your Firebase database with initial data
 * Usage: bun run scripts/seed-firebase-simple.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create Settings
    console.log('Creating settings...');
    await addDoc(collection(db, 'settings'), {
      evaluationOpen: true,
      currentSemester: '1st Semester',
      currentSchoolYear: '2024-2025'
    });
    console.log('✅ Settings created');

    // 2. Create Users
    console.log('Creating users...');
    const adminUser = await addDoc(collection(db, 'users'), {
      username: 'admin',
      password: 'admin123',
      fullName: 'Admin Maria',
      email: 'admin@cnscc.edu.ph',
      role: 'admin',
      createdAt: new Date()
    });

    const student1 = await addDoc(collection(db, 'users'), {
      username: 'student1',
      password: 'student123',
      fullName: 'Sandra Dela Cruz',
      email: 'sandra@cnscc.edu.ph',
      role: 'student',
      createdAt: new Date()
    });

    const student2 = await addDoc(collection(db, 'users'), {
      username: 'student2',
      password: 'student123',
      fullName: 'John Doe',
      email: 'john@cnscc.edu.ph',
      role: 'student',
      createdAt: new Date()
    });
    console.log('✅ Users created');

    // 3. Create Faculty
    console.log('Creating faculty...');
    const faculty1 = await addDoc(collection(db, 'faculty'), {
      name: 'Prof. Maria Santos',
      department: 'English Department',
      email: 'maria.santos@cnscc.edu.ph',
      createdAt: new Date()
    });

    const faculty2 = await addDoc(collection(db, 'faculty'), {
      name: 'Mr. Juan Perez',
      department: 'Mathematics Department',
      email: 'juan.perez@cnscc.edu.ph',
      createdAt: new Date()
    });

    const faculty3 = await addDoc(collection(db, 'faculty'), {
      name: 'Engr. Michael Flores',
      department: 'IT Department',
      email: 'michael.flores@cnscc.edu.ph',
      createdAt: new Date()
    });

    const faculty4 = await addDoc(collection(db, 'faculty'), {
      name: 'Mr. Allan Reyes',
      department: 'IT Department',
      email: 'allan.reyes@cnscc.edu.ph',
      createdAt: new Date()
    });

    const faculty5 = await addDoc(collection(db, 'faculty'), {
      name: 'Dr. Susan Villanueva',
      department: 'Science Department',
      email: 'susan.villanueva@cnscc.edu.ph',
      createdAt: new Date()
    });
    console.log('✅ Faculty created');

    // 4. Create Subjects
    console.log('Creating subjects...');
    const subject1 = await addDoc(collection(db, 'subjects'), {
      code: 'ENGL 101',
      title: 'English Communication Skills 1',
      instructorId: faculty1.id,
      instructorName: 'Prof. Maria Santos',
      semester: '1st Semester',
      schoolYear: '2024-2025'
    });

    const subject2 = await addDoc(collection(db, 'subjects'), {
      code: 'MATH 101',
      title: 'College Algebra',
      instructorId: faculty2.id,
      instructorName: 'Mr. Juan Perez',
      semester: '1st Semester',
      schoolYear: '2024-2025'
    });

    const subject3 = await addDoc(collection(db, 'subjects'), {
      code: 'IT 102',
      title: 'Computer Programming 1',
      instructorId: faculty3.id,
      instructorName: 'Engr. Michael Flores',
      semester: '1st Semester',
      schoolYear: '2024-2025'
    });

    const subject4 = await addDoc(collection(db, 'subjects'), {
      code: 'IT 103',
      title: 'Data Structures',
      instructorId: faculty4.id,
      instructorName: 'Mr. Allan Reyes',
      semester: '1st Semester',
      schoolYear: '2024-2025'
    });

    const subject5 = await addDoc(collection(db, 'subjects'), {
      code: 'PHY 101',
      title: 'Physics',
      instructorId: faculty5.id,
      instructorName: 'Dr. Susan Villanueva',
      semester: '1st Semester',
      schoolYear: '2024-2025'
    });
    console.log('✅ Subjects created');

    // 5. Create Enrollments for student1
    console.log('Creating enrollments...');
    for (const subject of [subject1, subject2, subject3, subject4, subject5]) {
      await addDoc(collection(db, 'enrollments'), {
        studentId: student1.id,
        subjectId: subject.id,
        status: 'pending',
        createdAt: new Date()
      });
    }

    // Create enrollments for student2
    for (const subject of [subject1, subject2, subject3, subject4, subject5]) {
      await addDoc(collection(db, 'enrollments'), {
        studentId: student2.id,
        subjectId: subject.id,
        status: 'pending',
        createdAt: new Date()
      });
    }
    console.log('✅ Enrollments created');

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
