import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { EmailVerification } from './components/auth/EmailVerification';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
import { Dashboard } from './components/dashboard/Dashboard';
import { BoardList } from './components/board/BoardList';
import { BoardDetail } from './components/board/BoardDetail';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import { SubscriptionPage } from './components/subscription/SubscriptionPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { BlogPage } from './components/blog/BlogPage';

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" replace /> : <LoginForm />
          }
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to="/dashboard" replace /> : <RegisterForm />
          }
        />
        <Route
          path="/verify-email"
          element={
            user ? <Navigate to="/dashboard" replace /> : <EmailVerification />
          }
        />
        <Route
          path="/forgot-password"
          element={
            user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />
          }
        />
        <Route
          path="/reset-password"
          element={
            user ? <Navigate to="/dashboard" replace /> : <ResetPassword />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navbar />
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boards"
          element={
            <ProtectedRoute>
              <Navbar />
              <BoardList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boards/:boardId"
          element={
            <ProtectedRoute>
              <Navbar />
              <BoardDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Navbar />
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <Navbar />
              <SubscriptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Navbar />
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blog"
          element={<BlogPage />}
        />
        <Route
          path="/"
          element={
            <Navigate to={user ? "/dashboard" : "/login"} replace />
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;