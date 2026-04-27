import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import StudentCourses from './pages/StudentCourses';
import StudentClasses from './pages/StudentClasses';
import StudentProfile from './pages/StudentProfile';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudents from './components/admin/AdminStudents';
import AdminBatches from './components/admin/AdminBatches';
import AdminCourses from './components/admin/AdminCourses';
import AdminModules from './components/admin/AdminModules';
import AdminVideos from './components/admin/AdminVideos';
import AdminLayout from './layouts/DashboardLayout';
import StudentLayout from './layouts/DashboardLayout';
import MockTests from './components/student/MockTests';
import Certificates from './components/student/Certificates';
import Assignments from './components/student/Assignments';
import ProjectApprovals from './components/admin/ProjectApprovals';
import CertificateApprovals from './components/admin/CertificateApprovals';
import ContentManagement from './components/admin/ContentManagement';
import AdminAssessments from './components/admin/AdminAssessments';
import AdminAttendance from './pages/AttendanceDashboard';
import StudentAttendance from './pages/StudentAttendance';
import VideoViewer from './pages/VideoViewer';
import AttendanceLanding from './pages/AttendanceLanding';

function App() {
    return (
        <AuthProvider>
            <DataProvider>
                <Router>
                    <div className="App">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/video-player" element={<VideoViewer />} />
                            <Route path="/attendance-features" element={<AttendanceLanding />} />

                            {/* Student Routes */}
                            <Route element={<StudentLayout />}>
                                <Route path="/student" element={<StudentDashboard />} />
                                <Route path="/student/courses" element={<StudentCourses />} />
                                <Route path="/student/classes" element={<StudentClasses />} />
                                <Route path="/student/assignments" element={<Assignments />} />
                                <Route path="/student/mock-tests" element={<MockTests />} />
                                <Route path="/student/attendance" element={<StudentAttendance />} />
                                <Route path="/student/attendance/dashboard" element={<StudentAttendance />} />
                                <Route path="/student/attendance/history" element={<StudentAttendance />} />
                                <Route path="/student/attendance/calendar" element={<StudentAttendance />} />
                                <Route path="/student/attendance/online" element={<StudentAttendance />} />
                                <Route path="/student/attendance/scan" element={<StudentAttendance />} />
                                <Route path="/student/attendance/analytics" element={<StudentAttendance />} />
                                <Route path="/student/attendance/reports" element={<StudentAttendance />} />
                                <Route path="/student/attendance/notifications" element={<StudentAttendance />} />
                                <Route path="/student/certificates" element={<Certificates />} />
                                <Route path="/student/profile" element={<StudentProfile />} />
                            </Route>

                            {/* Admin Routes */}
                            <Route element={<AdminLayout />}>
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/admin/students" element={<AdminStudents />} />
                                <Route path="/admin/batches" element={<AdminBatches />} />
                                <Route path="/admin/courses" element={<ContentManagement />} />
                                <Route path="/admin/modules" element={<AdminModules />} />
                                <Route path="/admin/videos" element={<AdminVideos />} />
                                <Route path="/admin/attendance" element={<AdminAttendance />} />
                                <Route path="/admin/attendance/dashboard" element={<AdminAttendance />} />
                                <Route path="/admin/attendance/online" element={<AdminAttendance />} />
                                <Route path="/admin/attendance/offline" element={<AdminAttendance />} />
                                <Route path="/admin/attendance/reports" element={<AdminAttendance />} />

                                <Route path="/admin/attendance/analytics" element={<AdminAttendance />} />
                                <Route path="/admin/certificates" element={<CertificateApprovals />} />
                                <Route path="/admin/projects" element={<ProjectApprovals />} />
                                <Route path="/admin/assessments" element={<AdminAssessments />} />
                            </Route>

                            {/* Default Route */}
                            <Route path="/" element={<Navigate to="/login" />} />
                        </Routes>
                    </div>
                </Router>
            </DataProvider>
        </AuthProvider>
    );
}

export default App;
