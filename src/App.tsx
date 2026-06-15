/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudents from './pages/AdminStudents';
import AdminTeachers from './pages/AdminTeachers';
import AdminResults from './pages/AdminResults';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherTests from './pages/TeacherTests';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentResults from './pages/student/StudentResults';
import StudentReportCard from './pages/student/StudentReportCard';
import StudentProfile from './pages/student/StudentProfile';
import StudentTests from './pages/student/StudentTests';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/teachers" element={<AdminTeachers />} />
          <Route path="/admin/results" element={<AdminResults />} />
          <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
          
          <Route path="/teacher" element={<Navigate to="/teacher/results" replace />} />
          <Route path="/teacher/results" element={<TeacherDashboard />} />
          <Route path="/teacher/tests" element={<TeacherTests />} />
          
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/tests" element={<StudentTests />} />
          <Route path="/student/report-card" element={<StudentReportCard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/*" element={<Navigate to="/student" replace />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
