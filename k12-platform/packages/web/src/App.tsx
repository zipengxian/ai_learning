import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const HomePage = lazy(() => import('@/pages/HomePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const PreferencesPage = lazy(() => import('@/pages/PreferencesPage'));
const StudyCenterPage = lazy(() => import('@/pages/StudyCenterPage'));
const LearningPage = lazy(() => import('@/pages/LearningPage'));
const PracticePage = lazy(() => import('@/pages/PracticePage'));
const WrongBookPage = lazy(() => import('@/pages/WrongBookPage'));
const AIChatPage = lazy(() => import('@/pages/AIChatPage'));
const EssayGradingPage = lazy(() => import('@/pages/EssayGradingPage'));
const QuestionGenerationPage = lazy(() => import('@/pages/QuestionGenerationPage'));
const PhotoSearchPage = lazy(() => import('@/pages/PhotoSearchPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <LoadingSpinner size="lg" text="页面加载中..." />
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/preferences" element={<PreferencesPage />} />
              <Route path="/study" element={<StudyCenterPage />} />
              <Route path="/study/:knowledgePointId" element={<LearningPage />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/practice/:knowledgePointId" element={<PracticePage />} />
              <Route path="/wrong-book" element={<WrongBookPage />} />
              <Route path="/ai-chat" element={<AIChatPage />} />
              <Route path="/essay-grading" element={<EssayGradingPage />} />
              <Route path="/generate-questions" element={<QuestionGenerationPage />} />
              <Route path="/photo-search" element={<PhotoSearchPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;