import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/Toast.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { FullPageLoader } from "./components/Loader.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import RepSignupPage from "./pages/RepSignupPage.jsx";
import RepPendingPage from "./pages/RepPendingPage.jsx";
import GoogleContinuePage from "./pages/GoogleContinuePage.jsx";

import StudentDashboard from "./pages/StudentDashboard.jsx";
import ExploreFeedPage from "./pages/ExploreFeedPage.jsx";
import BookmarksPage from "./pages/BookmarksPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CoursePage from "./pages/CoursePage.jsx";
import MaterialDetailPage from "./pages/MaterialDetailPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import StudyAnalyticsPage from "./pages/StudyAnalyticsPage.jsx";

import RepDashboard from "./pages/RepDashboard.jsx";
import RepUploadPage from "./pages/RepUploadPage.jsx";
import RepCoursesPage from "./pages/RepCoursesPage.jsx";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminApprovalsPage from "./pages/AdminApprovalsPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import AdminMaterialsPage from "./pages/AdminMaterialsPage.jsx";
import AdminCoursesPage from "./pages/AdminCoursesPage.jsx";
import AdminReportsPage from "./pages/AdminReportsPage.jsx";
import AdminLogPage from "./pages/AdminLogPage.jsx";

import NotFoundPage from "./pages/NotFoundPage.jsx";

function RoleHome() {
  const { user } = useAuth();
  if (user.role === "student") return <StudentDashboard />;
  if (user.role === "rep") return <RepDashboard />;
  if (user.role === "admin") return <AdminDashboard />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <FullPageLoader />;

  return (
    <ToastProvider>
      <Routes>
        {/* Public / auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/rep-signup" element={<RepSignupPage />} />
        <Route path="/rep-pending" element={<RepPendingPage />} />
        <Route path="/google-continue" element={<GoogleContinuePage />} />

        {/* Role landing */}
        <Route path="/" element={<ProtectedRoute><RoleHome /></ProtectedRoute>} />

        {/* Student routes */}
        <Route path="/explore" element={<ProtectedRoute roles={["student"]}><ExploreFeedPage /></ProtectedRoute>} />
        <Route path="/bookmarks" element={<ProtectedRoute roles={["student"]}><BookmarksPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute roles={["student"]}><ProfilePage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute roles={["student"]}><StudyAnalyticsPage /></ProtectedRoute>} />
        <Route path="/course/:id" element={<ProtectedRoute roles={["student"]}><CoursePage /></ProtectedRoute>} />
        <Route path="/material/:id" element={<ProtectedRoute roles={["student"]}><MaterialDetailPage /></ProtectedRoute>} />
        <Route path="/quiz/:id" element={<ProtectedRoute roles={["student"]}><QuizPage /></ProtectedRoute>} />

        {/* Course Rep routes */}
        <Route path="/rep/upload" element={<ProtectedRoute roles={["rep"]}><RepUploadPage /></ProtectedRoute>} />
        <Route path="/rep/courses" element={<ProtectedRoute roles={["rep"]}><RepCoursesPage /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/approvals" element={<ProtectedRoute roles={["admin"]}><AdminApprovalsPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/materials" element={<ProtectedRoute roles={["admin"]}><AdminMaterialsPage /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute roles={["admin"]}><AdminCoursesPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={["admin"]}><AdminReportsPage /></ProtectedRoute>} />
        <Route path="/admin/log" element={<ProtectedRoute roles={["admin"]}><AdminLogPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  );
}
