import { useNavigate, useLocation } from 'react-router-dom';
import { PreferenceSetup } from '@/components/PreferenceSetup';
import { useAuthStore } from '@/store/authStore';

export default function PreferencesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const from = (location.state as { from?: string } | null)?.from || '/';

  const handleComplete = () => {
    navigate(from, { replace: true });
  };

  const handleSkip = () => {
    navigate(from, { replace: true });
  };

  return (
    <PreferenceSetup
      initialGrade={user?.grade}
      initialSubjects={user?.subjects}
      onComplete={handleComplete}
      onSkip={handleSkip}
      showSkip
    />
  );
}