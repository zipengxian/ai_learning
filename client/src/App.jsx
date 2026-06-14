import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import DashboardPage from './pages/DashboardPage';
import RecommendPage from './pages/RecommendPage';
import CommunityPage from './pages/CommunityPage';
import PostDetailPage from './pages/PostDetailPage';
import ProfilePage from './pages/ProfilePage';
import GrammarPage from './pages/GrammarPage';
import VocabularyPage from './pages/VocabularyPage';
import ListeningPage from './pages/ListeningPage';
import SpeakingPage from './pages/SpeakingPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 使用 Layout 作为父路由，子路由通过 Outlet 渲染 */}
          <Route element={<Layout />}>
            {/* 公开路由 */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* 受保护路由 */}
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <CoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <ProtectedRoute>
                  <CourseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id/vocabulary"
              element={
                <ProtectedRoute>
                  <VocabularyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id/grammar"
              element={
                <ProtectedRoute>
                  <GrammarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id/listening"
              element={
                <ProtectedRoute>
                  <ListeningPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id/speaking"
              element={
                <ProtectedRoute>
                  <SpeakingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommend"
              element={
                <ProtectedRoute>
                  <RecommendPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedRoute>
                  <CommunityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community/:id"
              element={
                <ProtectedRoute>
                  <PostDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;