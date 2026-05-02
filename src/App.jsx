import React, { lazy, Suspense } from 'react';
import { 
    createBrowserRouter, 
    RouterProvider, 
    Navigate,
    createRoutesFromElements,
    Route
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Lazy load layouts
const AdminLayout = lazy(() => import('./layouts/DashboardLayout'));
const StudentLayout = lazy(() => import('./layouts/DashboardLayout'));

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentCourses = lazy(() => import('./pages/StudentCourses'));
const StudentClasses = lazy(() => import('./pages/StudentClasses'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminStudents = lazy(() => import('./components/admin/AdminStudents'));
const AdminBatches = lazy(() => import('./components/admin/AdminBatches'));
const AdminModules = lazy(() => import('./components/admin/AdminModules'));
const AdminVideos = lazy(() => import('./components/admin/AdminVideos'));
const MockTests = lazy(() => import('./components/student/MockTests'));
const Certificates = lazy(() => import('./components/student/Certificates'));
const Assignments = lazy(() => import('./components/student/Assignments'));
const ProjectApprovals = lazy(() => import('./components/admin/ProjectApprovals'));
const CertificateApprovals = lazy(() => import('./components/admin/CertificateApprovals'));
const ContentManagement = lazy(() => import('./components/admin/ContentManagement'));
const AdminAssessments = lazy(() => import('./components/admin/AdminAssessments'));
const AdminClasses = lazy(() => import('./components/admin/AdminClasses'));
const AdminAttendance = lazy(() => import('./pages/AttendanceDashboard'));
const StudentAttendance = lazy(() => import('./pages/StudentAttendance'));
const VideoViewer = lazy(() => import('./pages/VideoViewer'));
const AttendanceLanding = lazy(() => import('./pages/AttendanceLanding'));
const AdminAnnouncements = lazy(() => import('./components/admin/AdminAnnouncements'));
const StudentAnnouncements = lazy(() => import('./components/student/StudentAnnouncements'));
const AdminSettings = lazy(() => import('./components/admin/AdminSettings'));

// Loading component
const PageLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0F172A', color: 'white' }}>
        <div className="loader">Loading Cynex Portal...</div>
    </div>
);

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
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
                <Route path="/student/announcements" element={<StudentAnnouncements />} />
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
                <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                <Route path="/admin/classes" element={<AdminClasses />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" />} />
        </>
    ),
    {
        future: {
            v7_startTransition: true,
            v7_relativeSplatPath: true,
            v7_fetcherPersist: true,
            v7_normalizeFormMethod: true,
            v7_partialHydration: true,
            v7_skipActionErrorRevalidation: true,
        },
    }
);

function App() {
    return (
        <AuthProvider>
            <DataProvider>
                <div className="App">
                    <Suspense fallback={<PageLoader />}>
                        <RouterProvider router={router} future={{ v7_startTransition: true }} />
                    </Suspense>
                </div>
            </DataProvider>
        </AuthProvider>
    );
}

export default App;
