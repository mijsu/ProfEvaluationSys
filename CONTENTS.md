# Faculty Evaluation System - Complete Documentation

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Structure](#3-database-structure)
4. [User Roles & Access](#4-user-roles--access)
5. [Features & Functionality](#5-features--functionality)
6. [API Endpoints](#6-api-endpoints)
7. [Frontend Components](#7-frontend-components)
8. [Authentication & Security](#8-authentication--security)
9. [Evaluation Process](#9-evaluation-process)
10. [Reports & Exports](#10-reports--exports)
11. [File Structure](#11-file-structure)
12. [Third-Party Libraries](#12-third-party-libraries)

---

## 1. System Overview

### 1.1 Project Name
**Online Faculty Evaluation System**

### 1.2 Purpose
A web-based application designed for **Camarines Norte State College - College of Trades and Technology** to facilitate the evaluation of faculty members by students. The system streamlines the evaluation process, provides real-time analytics, and generates comprehensive reports.

### 1.3 Key Objectives
- Digitize the faculty evaluation process
- Ensure only authorized students can evaluate
- Provide administrators with comprehensive management tools
- Generate professional reports (PDF and Excel)
- Track evaluation progress in real-time

### 1.4 Institution Details
- **Institution**: Camarines Norte State College
- **Campus**: College of Trades and Technology
- **Location**: Camarines Norte, Philippines

---

## 2. Technology Stack

### 2.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.x | React framework for building the web application with App Router architecture |
| **React** | 19.x | JavaScript library for building user interfaces |
| **TypeScript** | 5.x | Strongly-typed programming language for better code quality |
| **Tailwind CSS** | 4.x | Utility-first CSS framework for rapid UI development |
| **shadcn/ui** | Latest | Re-usable component library built on Radix UI |
| **Radix UI** | Latest | Unstyled, accessible UI component primitives |
| **Lucide React** | Latest | Open-source icon library |
| **Framer Motion** | 12.x | Animation library for React |

### 2.2 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 16.x | Server-side API endpoints |
| **Firebase Firestore** | Latest | NoSQL cloud database |
| **Firebase Auth** | Latest | Authentication service (optional) |

### 2.3 State Management

| Technology | Purpose |
|------------|---------|
| **Zustand** | Lightweight state management for client-side state |
| **TanStack Query** | Server state management and data fetching |
| **React Hook Form** | Form state management and validation |

### 2.4 Development Tools

| Tool | Purpose |
|------|---------|
| **Bun** | JavaScript runtime and package manager |
| **ESLint** | Code linting and quality checking |
| **Prisma** | ORM for local SQLite database (optional backup) |

---

## 3. Database Structure

### 3.1 Firebase Firestore Collections

The system uses Firebase Firestore as the primary database. Below are all the collections and their document structures:

#### Collection: `users`
Stores all user accounts (students and administrators).

```javascript
{
  id: string,              // Auto-generated document ID
  username: string,        // Unique username for login
  password: string,        // User password (NOTE: Should be hashed in production)
  fullName: string,        // Complete name of the user
  studentId: string,       // Student ID number (uppercase)
  email: string,           // Email address (optional)
  role: string,            // "student" or "admin"
  preRegisteredId: string, // Reference to pre-registered record
  createdAt: timestamp,    // Account creation date
  year: string,            // Year level (optional)
  course: string           // Course/Program (optional)
}
```

#### Collection: `pre_registered_students`
Stores students pre-registered by the admin before they can create accounts.

```javascript
{
  id: string,              // Auto-generated document ID
  fullName: string,        // Student's complete name
  studentId: string,       // Student ID (uppercase)
  registered: boolean,     // Whether account has been created
  userId: string,          // Reference to created user account (if registered)
  createdAt: timestamp,    // Pre-registration date
  registeredAt: timestamp  // Account creation date (if registered)
}
```

#### Collection: `faculty`
Stores faculty member information.

```javascript
{
  id: string,              // Auto-generated document ID
  name: string,            // Faculty member's complete name
  department: string,      // Department affiliation
  position: string,        // Academic position/rank
  email: string,           // Email address
  createdAt: timestamp     // Record creation date
}
```

#### Collection: `subjects`
Stores subject/course information.

```javascript
{
  id: string,              // Auto-generated document ID
  code: string,            // Subject code (e.g., "IT 101")
  title: string,           // Subject title
  description: string,     // Subject description
  instructorId: string,    // Reference to faculty document
  semester: string,        // Semester offered
  schoolYear: string,      // School year
  units: number,           // Number of units
  createdAt: timestamp     // Record creation date
}
```

#### Collection: `enrollments`
Stores student-subject enrollment relationships.

```javascript
{
  id: string,              // Auto-generated document ID
  studentId: string,       // Reference to student (users collection)
  subjectId: string,       // Reference to subject
  facultyId: string,       // Reference to faculty (instructor)
  semester: string,        // Semester
  schoolYear: string,      // School year
  evaluationStatus: string,// "pending" or "completed"
  enrolledAt: timestamp    // Enrollment date
}
```

#### Collection: `evaluations`
Stores completed faculty evaluations.

```javascript
{
  id: string,              // Auto-generated document ID
  studentId: string,       // Reference to student who evaluated
  subjectId: string,       // Reference to subject
  facultyId: string,       // Reference to faculty evaluated
  semester: string,        // Semester
  schoolYear: string,      // School year
  totalScore: number,      // Total raw score (out of 100)
  scores: {                // Individual question scores
    section1: [5, 5, 5, 5, 5],  // Commitment (5 questions)
    section2: [5, 5, 5, 5, 5],  // Knowledge of Subject (5 questions)
    section3: [5, 5, 5, 5, 5],  // Teaching for Independent Learning (5 questions)
    section4: [5, 5, 5, 5, 5]   // Management of Learning (5 questions)
  },
  comments: string,        // Optional comments
  submittedAt: timestamp   // Submission date
}
```

#### Collection: `settings`
Stores system configuration.

```javascript
{
  id: string,              // Usually "system_settings"
  evaluationOpen: boolean, // Whether evaluation period is open
  currentSemester: string, // Current semester (e.g., "1st Semester")
  currentSchoolYear: string,// Current school year (e.g., "2024-2025")
  updatedAt: timestamp     // Last update date
}
```

### 3.2 Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │    faculty      │     │    subjects     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │◄────│ instructorId    │
│ username        │     │ name            │     │ id (PK)         │
│ password        │     │ department      │     │ code            │
│ fullName        │     │ position        │     │ title           │
│ studentId       │     │ email           │     │ semester        │
│ role            │     └─────────────────┘     │ schoolYear      │
└─────────────────┘             │               └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        enrollments                              │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                         │
│ studentId (FK → users)                                          │
│ subjectId (FK → subjects)                                       │
│ facultyId (FK → faculty)                                        │
│ evaluationStatus                                                │
└─────────────────────────────────────────────────────────────────┘
        │
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       evaluations                               │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                         │
│ studentId (FK → users)                                          │
│ subjectId (FK → subjects)                                       │
│ facultyId (FK → faculty)                                        │
│ totalScore                                                      │
│ scores (JSON)                                                   │
│ submittedAt                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. User Roles & Access

### 4.1 Administrator

**Access Credentials:**
- Default username: `admin`
- Default password: `admin123`

**Permissions:**
| Feature | Access |
|---------|--------|
| Dashboard Statistics | ✓ |
| Pre-Register Students | ✓ |
| Manage Students | ✓ |
| Manage Faculty | ✓ |
| Manage Subjects | ✓ |
| Manage Evaluation Form | ✓ |
| Manage Enrollments | ✓ |
| View Evaluation Results | ✓ |
| Generate Reports (PDF/Excel) | ✓ |
| System Settings | ✓ |
| Open/Close Evaluations | ✓ |

### 4.2 Student

**Registration Process:**
1. Admin must pre-register the student (Full Name + Student ID)
2. Student creates account using matching credentials
3. Student can then login with their username and password

**Permissions:**
| Feature | Access |
|---------|--------|
| View Enrolled Subjects | ✓ |
| Evaluate Faculty | ✓ (when evaluation is open) |
| Save Evaluation Draft | ✓ |
| Submit Evaluations | ✓ (all must be completed) |
| View Progress | ✓ |
| Change Password | ✓ |

---

## 5. Features & Functionality

### 5.1 Authentication System

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Fields Required**: Role, Username, Password
- **Process**:
  1. System verifies credentials against Firestore `users` collection
  2. Validates user role matches selected role
  3. Returns user data and stores in localStorage
  4. Redirects to appropriate dashboard

#### Registration (Pre-Authorization Required)
- **Endpoint**: `POST /api/auth/register`
- **Fields Required**: Username, Full Name, Student ID, Password, Confirm Password
- **Process**:
  1. System checks if Full Name AND Student ID exist in `pre_registered_students`
  2. Validates both fields match the same pre-registered record
  3. Creates user account in `users` collection
  4. Marks pre-registered record as "registered"
  5. Redirects to login page

#### Password Change
- **Endpoint**: `POST /api/auth/change-password`
- **Fields Required**: User ID, Current Password, New Password
- **Process**:
  1. Verifies current password
  2. Updates password in database
  3. Returns success message

### 5.2 Pre-Registration System

**Purpose**: Ensures only authorized students can create accounts.

**Process**:
1. Admin adds student to `pre_registered_students` collection
2. Student attempts to create account
3. System validates:
   - Full Name matches (case-insensitive)
   - Student ID matches (uppercase comparison)
4. Account is created only if both match

### 5.3 Admin Dashboard

**Statistics Displayed**:
- Total Students
- Total Faculty
- Evaluation Status (Open/Closed)
- Completed Evaluations
- Pending Evaluations

**Quick Actions**:
- Toggle evaluation period open/closed
- Navigate to all management sections

### 5.4 Faculty Evaluation Form

**Structure**: 20 questions across 4 categories (5 questions each)

#### Category 1: Commitment
| # | Question |
|---|----------|
| 1 | Shows enthusiasm in teaching the subject |
| 2 | Is well-prepared for the class |
| 3 | Is available for consultation |
| 4 | Maintains a good teacher-student relationship |
| 5 | Demonstrates fairness and impartiality |

#### Category 2: Knowledge of Subject
| # | Question |
|---|----------|
| 6 | Demonstrates mastery of the subject matter |
| 7 | Presents lessons in an organized manner |
| 8 | Updates subject matter content |
| 9 | Relates subject matter to other disciplines |
| 10 | Uses appropriate teaching resources |

#### Category 3: Teaching for Independent Learning
| # | Question |
|---|----------|
| 11 | Encourages critical thinking |
| 12 | Promotes student participation |
| 13 | Uses varied teaching strategies |
| 14 | Provides timely and constructive feedback |
| 15 | Inspires students to learn independently |

#### Category 4: Management of Learning
| # | Question |
|---|----------|
| 16 | Maintains an orderly learning environment |
| 17 | Manages class time effectively |
| 18 | Implements appropriate assessment methods |
| 19 | Provides clear instructions and expectations |
| 20 | Addresses student concerns appropriately |

**Rating Scale**:
| Score | Description |
|-------|-------------|
| 5 | Outstanding |
| 4 | Very Satisfactory |
| 3 | Satisfactory |
| 2 | Fair |
| 1 | Poor |

**Scoring**:
- Maximum raw score per question: 5
- Maximum total raw score: 100 (20 questions × 5)
- Display score: Raw score ÷ 5 = Score out of 20
- Percentage: (Display score ÷ 20) × 100

### 5.5 Draft Saving System

**Purpose**: Allows students to save evaluations as drafts before final submission.

**Process**:
1. Student completes evaluation for a subject
2. Draft is saved to browser's localStorage
3. Progress bar shows completion status
4. Student must complete ALL evaluations before submitting
5. All drafts are submitted together
6. localStorage is cleared after successful submission

### 5.6 Progress Tracking

**Display**:
- Total subjects enrolled
- Number of evaluations completed/submitted
- Number of drafts saved
- Remaining evaluations
- Progress percentage with visual bar

---

## 6. API Endpoints

### 6.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | New user registration |
| POST | `/api/auth/change-password` | Change user password |
| POST | `/api/auth/forgot-password` | Request password reset |

### 6.2 Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Get dashboard statistics |
| GET/POST/PUT/DELETE | `/api/admin/students` | CRUD for students |
| GET/POST/PUT/DELETE | `/api/admin/faculty` | CRUD for faculty |
| GET/POST/PUT/DELETE | `/api/admin/subjects` | CRUD for subjects |
| GET/POST/PUT/DELETE | `/api/admin/enrollments` | CRUD for enrollments |
| GET/POST/PUT/DELETE | `/api/admin/pre-registered-students` | CRUD for pre-registration |
| GET | `/api/admin/evaluations/list` | List all evaluations |
| POST | `/api/admin/evaluations/fix-scores` | Fix incorrect scores |
| GET | `/api/admin/settings` | Get system settings |
| POST | `/api/admin/settings` | Update system settings |
| GET | `/api/admin/reports` | Get evaluation data for reports |

### 6.3 Report Export Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/reports/pdf` | Generate PDF report |
| GET | `/api/admin/reports/excel` | Generate Excel report |

### 6.4 Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/subjects` | Get enrolled subjects |
| POST | `/api/student/evaluations` | Submit single evaluation |
| POST | `/api/student/evaluations/submit-all` | Submit all draft evaluations |

---

## 7. Frontend Components

### 7.1 Main Pages (src/app/page.tsx)

| Component | Description |
|-----------|-------------|
| `RoleSelectionPage` | Landing page for selecting Student or Admin role |
| `LoginPage` | Login form with role, username, password |
| `RegisterPage` | Registration form for students |
| `ForgotPasswordPage` | Password recovery request form |
| `EvaluationPage` | Student's subject list and evaluation progress |
| `EvaluationFormPage` | Faculty evaluation form (20 questions) |
| `ChangePasswordPage` | Password change form |

### 7.2 Admin Components (src/components/admin/)

| Component | Description |
|-----------|-------------|
| `AdminDashboard.tsx` | Main dashboard with statistics and navigation |
| `ManagePreRegisteredStudents.tsx` | Pre-register students before they can create accounts |
| `ManageStudents.tsx` | View and manage student accounts |
| `ManageFaculty.tsx` | CRUD operations for faculty members |
| `ManageSubjects.tsx` | CRUD operations for subjects |
| `ManageEnrollments.tsx` | Enroll students to subjects |
| `ManageEvaluationForm.tsx` | Configure evaluation questions |
| `ViewResults.tsx` | View evaluation results and analytics |
| `GenerateReports.tsx` | Generate PDF and Excel reports |
| `Settings.tsx` | System configuration |

### 7.3 UI Components (src/components/ui/)

The system uses **shadcn/ui** component library with the following components:

| Component | Description |
|-----------|-------------|
| `button.tsx` | Button component with variants |
| `input.tsx` | Text input component |
| `select.tsx` | Dropdown select component |
| `dialog.tsx` | Modal dialog component |
| `table.tsx` | Data table component |
| `card.tsx` | Card container component |
| `badge.tsx` | Badge/tag component |
| `toast.tsx` | Toast notification component |
| `progress.tsx` | Progress bar component |
| `checkbox.tsx` | Checkbox input component |
| `radio-group.tsx` | Radio button group component |
| `tabs.tsx` | Tab navigation component |
| `dropdown-menu.tsx` | Dropdown menu component |
| `avatar.tsx` | Avatar/image component |
| `calendar.tsx` | Calendar date picker |
| `chart.tsx` | Chart/visualization component |
| `form.tsx` | Form wrapper with validation |
| `label.tsx` | Form label component |
| `separator.tsx` | Horizontal/vertical divider |
| `skeleton.tsx` | Loading skeleton component |
| `switch.tsx` | Toggle switch component |
| `textarea.tsx` | Multi-line text input |
| `tooltip.tsx` | Tooltip hover component |
| `alert.tsx` | Alert notification component |
| `scroll-area.tsx` | Scrollable container |

---

## 8. Authentication & Security

### 8.1 Authentication Flow

```
┌──────────────────┐
│   Role Selection │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│    Login Page    │────►│   Registration   │
│  (Existing Users)│     │ (Pre-authorized) │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         │ Validate               │ Validate against
         │ credentials            │ pre_registered_students
         │                        │
         ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│  Store user in   │     │ Create account   │
│  localStorage    │     │ in Firestore     │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────┐
         │  Role-based Route  │
         │  Admin / Student   │
         └────────────────────┘
```

### 8.2 Security Considerations

| Aspect | Implementation |
|--------|----------------|
| Password Storage | Plain text (NOTE: Should use bcrypt in production) |
| Session Management | localStorage-based |
| Role-based Access | Client-side routing with role validation |
| API Protection | Firestore security rules (should be configured) |
| CSRF Protection | Built into Next.js |

### 8.3 Pre-Authorization System

**Why it's needed:**
- Prevents unauthorized users from creating accounts
- Ensures only enrolled students can participate
- Maintains data integrity

**How it works:**
1. Admin adds student details (Full Name + Student ID)
2. System stores in `pre_registered_students` collection
3. Student attempts registration
4. System validates against pre-registered list
5. Account created only if both fields match

---

## 9. Evaluation Process

### 9.1 Complete Evaluation Flow

```
┌────────────────────────────────────────────────────────────────┐
│                     ADMINISTRATOR                               │
├────────────────────────────────────────────────────────────────┤
│ 1. Pre-register students (Full Name + Student ID)              │
│ 2. Add Faculty members                                         │
│ 3. Create Subjects                                             │
│ 4. Enroll students to subjects                                 │
│ 5. Open evaluation period                                      │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                       STUDENT                                   │
├────────────────────────────────────────────────────────────────┤
│ 1. Create account (must be pre-registered)                     │
│ 2. Login with username and password                            │
│ 3. View enrolled subjects                                      │
│ 4. Complete evaluation for each subject:                       │
│    - Select subject                                            │
│    - Answer 20 questions (4 categories)                        │
│    - Save as draft                                             │
│ 5. Submit all evaluations (must complete all)                  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                     ADMINISTRATOR                               │
├────────────────────────────────────────────────────────────────┤
│ 1. View evaluation results                                     │
│ 2. Generate reports (PDF/Excel)                                │
│ 3. Close evaluation period                                     │
└────────────────────────────────────────────────────────────────┘
```

### 9.2 Evaluation Status Tracking

| Status | Description | Action Available |
|--------|-------------|------------------|
| Pending | No draft or submission | "EVALUATE" button |
| Draft Saved | Saved in localStorage | Can edit before submit |
| Completed | Submitted to database | View only |

### 9.3 Score Calculation

```
Raw Score = Sum of all 20 question ratings (max 100)
Display Score = Raw Score ÷ 5 (max 20)
Percentage = (Display Score ÷ 20) × 100 (max 100%)

Example:
- Raw Score: 85
- Display Score: 17.00 out of 20
- Percentage: 85%
```

---

## 10. Reports & Exports

### 10.1 PDF Report Features

**Generated using**: jsPDF + jspdf-autotable

**Report Sections**:
1. **Header** - Institution name, campus, report title
2. **Summary Statistics** - Total evaluations, averages, counts
3. **Faculty Performance Ranking** - Ranked by average score
4. **Subject Performance Analysis** - Per-subject statistics
5. **Detailed Evaluation Records** - All individual evaluations

**Design Features**:
- Professional maroon and white color scheme
- Institution branding
- Page numbers
- Export date/time
- Multiple pages for large datasets

### 10.2 Excel Report Features

**Generated using**: SheetJS (xlsx)

**Sheet Tabs**:
1. **Summary** - Overall statistics
2. **Faculty Performance** - Ranked faculty scores
3. **Subject Analysis** - Subject-wise statistics
4. **All Evaluations** - Complete data dump

**Features**:
- Merged header cells
- Proper column widths
- Number formatting
- Ranking system
- Professional layout

### 10.3 Report Data Included

| Data Point | Description |
|------------|-------------|
| Student Name | Name of evaluating student |
| Subject Code | Course code |
| Subject Title | Course name |
| Faculty Name | Instructor evaluated |
| Score | Numerical score (out of 20) |
| Percentage | Score as percentage |
| Semester | Academic semester |
| School Year | Academic year |
| Date Submitted | Submission timestamp |

---

## 11. File Structure

```
my-project/
├── public/                      # Static assets
│   ├── favicon.png             # Site favicon
│   ├── logo.svg                # SVG logo
│   └── manifest.json           # PWA manifest
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main page (all views)
│   │   ├── globals.css         # Global styles
│   │   └── api/                # API Routes
│   │       ├── auth/           # Authentication
│   │       │   ├── login/
│   │       │   ├── register/
│   │       │   ├── change-password/
│   │       │   └── forgot-password/
│   │       ├── admin/          # Admin endpoints
│   │       │   ├── dashboard/
│   │       │   ├── students/
│   │       │   ├── faculty/
│   │       │   ├── subjects/
│   │       │   ├── enrollments/
│   │       │   ├── pre-registered-students/
│   │       │   ├── evaluations/
│   │       │   ├── reports/
│   │       │   │   ├── pdf/
│   │       │   │   └── excel/
│   │       │   └── settings/
│   │       └── student/        # Student endpoints
│   │           ├── subjects/
│   │           └── evaluations/
│   │
│   ├── components/             # React components
│   │   ├── admin/              # Admin dashboard components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ManagePreRegisteredStudents.tsx
│   │   │   ├── ManageStudents.tsx
│   │   │   ├── ManageFaculty.tsx
│   │   │   ├── ManageSubjects.tsx
│   │   │   ├── ManageEnrollments.tsx
│   │   │   ├── ManageEvaluationForm.tsx
│   │   │   ├── ViewResults.tsx
│   │   │   ├── GenerateReports.tsx
│   │   │   └── Settings.tsx
│   │   └── ui/                 # shadcn/ui components
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── firebase.ts         # Firebase configuration
│   │   ├── db.ts               # Database utilities
│   │   └── utils.ts            # Helper functions
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-toast.ts        # Toast notifications
│   │   └── use-mobile.ts       # Mobile detection
│   │
│   ├── store/                  # State management
│   │   └── useStore.ts         # Zustand store
│   │
│   └── types/                  # TypeScript definitions
│       ├── index.ts
│       └── evaluation.ts
│
├── prisma/                     # Prisma ORM (optional)
│   └── schema.prisma
│
├── scripts/                    # Utility scripts
│   ├── seed-firebase.js
│   └── seed-firebase-simple.js
│
├── upload/                     # Upload directory
│   ├── logo1.png
│   └── logo2.png
│
├── package.json                # Dependencies
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── next.config.ts              # Next.js configuration
```

---

## 12. Third-Party Libraries

### 12.1 Core Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| `next` | 16.x | React framework |
| `react` | 19.x | UI library |
| `react-dom` | 19.x | React DOM renderer |
| `typescript` | 5.x | Type system |
| `tailwindcss` | 4.x | CSS framework |

### 12.2 Firebase

| Library | Purpose |
|---------|---------|
| `firebase` | Firebase SDK for Firestore, Auth, Storage |

### 12.3 UI Components

| Library | Purpose |
|---------|---------|
| `@radix-ui/*` | Accessible UI primitives |
| `lucide-react` | Icon library |
| `framer-motion` | Animations |
| `class-variance-authority` | Component variants |
| `clsx` | Conditional classes |
| `tailwind-merge` | Merge Tailwind classes |

### 12.4 Form & Validation

| Library | Purpose |
|---------|---------|
| `react-hook-form` | Form management |
| `@hookform/resolvers` | Form resolvers |
| `zod` | Schema validation |

### 12.5 Data & State

| Library | Purpose |
|---------|---------|
| `zustand` | State management |
| `@tanstack/react-query` | Server state |
| `@tanstack/react-table` | Data tables |

### 12.6 Document Generation

| Library | Purpose |
|---------|---------|
| `jspdf` | PDF generation |
| `jspdf-autotable` | PDF tables |
| `xlsx` | Excel generation |

### 12.7 Utilities

| Library | Purpose |
|---------|---------|
| `date-fns` | Date manipulation |
| `uuid` | UUID generation |
| `sharp` | Image processing |
| `recharts` | Charts and visualizations |

---

## 13. Configuration

### 13.1 Firebase Configuration

Located in: `src/lib/firebase.ts`

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBTIXZcNDAJU-VwA93fVNdvqgWmIgZIpwA",
  authDomain: "evaluation-b38b8.firebaseapp.com",
  projectId: "evaluation-b38b8",
  storageBucket: "evaluation-b38b8.firebasestorage.app",
  messagingSenderId: "658850406057",
  appId: "1:658850406057:web:02c9580815489ac65293b8"
};
```

### 13.2 System Settings

Default configuration stored in `settings` collection:

| Setting | Default Value | Description |
|---------|---------------|-------------|
| `evaluationOpen` | `true` | Whether evaluations are open |
| `currentSemester` | "2nd Semester" | Current academic semester |
| `currentSchoolYear` | "2024-2025" | Current academic year |

---

## 14. Default Credentials

### 14.1 Administrator Account
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Administrator

### 14.2 Test Student Accounts
These need to be created through the registration process after pre-registration.

---

## 15. Maintenance & Support

### 15.1 Common Tasks

| Task | Location |
|------|----------|
| Add new admin | Direct database insert |
| Reset password | Direct database update |
| View logs | Check `/dev.log` |
| Run linting | `bun run lint` |
| Update dependencies | `bun install` |

### 15.2 Backup Recommendations

1. **Firebase Firestore**: Enable automated backups in Firebase Console
2. **Code**: Maintain version control with Git
3. **Configuration**: Document any environment-specific settings

---

## 16. Glossary

| Term | Definition |
|------|------------|
| **Pre-registration** | Process where admin adds student details before they can create accounts |
| **Enrollment** | Association of a student with a subject and faculty member |
| **Evaluation** | Assessment of a faculty member by a student using the 20-question form |
| **Draft** | Saved but not submitted evaluation stored in browser localStorage |
| **Submission** | Final submission of all completed evaluations to the database |
| **Semester** | Academic term (1st Semester, 2nd Semester, Summer) |
| **School Year** | Academic year format (e.g., 2024-2025) |

---

## 17. Contact & Support

**Institution**: Camarines Norte State College - College of Trades and Technology

**System**: Online Faculty Evaluation System

**Version**: 1.0.0

---

*Document Generated: February 2025*

*This documentation is provided for reference and training purposes.*
