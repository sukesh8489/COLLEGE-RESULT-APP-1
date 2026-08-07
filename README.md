# Jaya Sakthi Engineering College - Academic Portal

An integrated, role-based Academic Results and Internal Assessment Management Portal designed for **Jaya Sakthi Engineering College** (Affiliated with Anna University).

This platform streamlines academic administration, mark entry, attendance tracking, and student performance monitoring across departments with real-time cloud data storage via Firebase Firestore.

---

## 🌟 Key Features

### 🎓 1. Student Portal
* **Academic Dashboard**: View personalized student details, current semester, batch, and enrollment status.
* **Internal Assessment Results**: Access IAT-1, IAT-2, and Model Exam marks with pass/fail indicators.
* **Attendance Overview**: Real-time subject-wise and overall attendance percentage tracking.
* **GPA & CGPA Calculations**: Automated grade calculation based on course credit weightage.

### 👨‍🏫 2. Teaching Staff Portal
* **Mark Entry & Updating**: Enter and update internal assessment marks for assigned subjects.
* **Attendance Logging**: Update student attendance records subject-wise.
* **Class Roster Management**: Add new students or bulk-import student records for assigned classes.

### 👔 3. Head of Department (HOD) Portal
* **Faculty Management**: Create and manage staff accounts within the department.
* **Subject Allocation**: Assign curriculum subjects to teaching faculty members.
* **Department Analytics**: Track overall department pass percentage, class averages, and academic performance metrics.

### 🛡️ 4. Main Admin Portal
* **Department Configuration**: Add, update, or manage college departments (CSE, ECE, EEE, MECH, IT, CIVIL, AD, AI&DS).
* **HOD Account Management**: Provision credentials and assign HODs for each academic department.
* **Global Academic Settings**: Manage subjects, course credits, and college-wide regulation settings.

---

## 🚀 Tech Stack

* **Frontend**: React 18, TypeScript, Vite
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **Backend / Database**: Firebase Firestore (Real-time Cloud Database)
* **Deployment**: Cloud Run / Node.js

---

## 🛠️ Getting Started

### Prerequisites
* **Node.js**: `v18.x` or later
* **npm** or **bun**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/jayasakthi-academic-portal.git
   cd jayasakthi-academic-portal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` or `firebase-applet-config.json` file with your Firebase configuration credentials:
   ```json
   {
     "apiKey": "YOUR_FIREBASE_API_KEY",
     "authDomain": "YOUR_PROJECT.firebaseapp.com",
     "projectId": "YOUR_PROJECT_ID",
     "storageBucket": "YOUR_PROJECT.appspot.com",
     "messagingSenderId": "YOUR_SENDER_ID",
     "appId": "YOUR_APP_ID"
   }
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🔐 Default Access & Portals

* **Student View**: Enter any valid Register Number (e.g., `311121104001`).
* **HOD Login**: Select Department and log in with HOD credentials.
* **Staff Login**: Log in with Staff ID and assigned password.
* **Main Admin**: Access using administrator credentials.

---

## 📜 License

This project is developed for **Jaya Sakthi Engineering College**. All rights reserved.
