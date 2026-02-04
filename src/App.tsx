import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Shell } from './components/layout';
import './styles/global.css';

// Page imports
import DashboardPage from './pages/Dashboard';
import TasksPage from './pages/Tasks/Tasks';
import ExecutionPage from './pages/Execution';
import CRMPage from './pages/CRM';
import MenteesPage from './pages/Mentees';
import LeadProfilePage from './pages/LeadProfile';
import MenteeProfilePage from './pages/MenteeProfile';
import CalendarPage from './pages/Calendar';
import MenteeHomePage from './pages/MenteeHome';
import OnboardingEditorPage from './pages/OnboardingEditor';
import FinancePage from './pages/Finance';
import TemplatesPage from './pages/Templates';
import ProfilePage from './pages/Profile';
import MenteeCallsPage from './pages/MenteeCalls';
import MenteeTasksPage from './pages/MenteeTasks';
import ResourcesPage from './pages/Resources/Resources';
import AcademyPage from './pages/Academy/Academy';
import ManageAcademyPage from './pages/Academy/ManageAcademy';
import WarmingPage from './pages/Warming/Warming';
import MiningPage from './pages/Mining/Mining';
import HowItWorksPage from './pages/HowItWorks/HowItWorks';
import { SwipeFileLib } from './pages/SwipeFile/SwipeFileLib';
import { AssetsManager } from './pages/Contingency/AssetsManager';
import { SettingsPage } from './pages/Settings/Settings';
import { RoleSelector } from './pages/Login/RoleSelector';
import { MentorLogin } from './pages/Login/MentorLogin';
import { MenteeLogin } from './pages/Login/MenteeLogin';
import MenteeFinancePage from './pages/MenteeFinance';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<RoleSelector />} />
            <Route path="/mentor/login" element={<MentorLogin />} />
            <Route path="/mentee/login" element={<MenteeLogin />} />

            {/* Protected universal routes (Mentor & Mentee) */}
            <Route element={<Shell requireAuth allowedRoles={['mentor', 'mentee']} />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/me/calls" element={<MenteeCallsPage />} />
            </Route>

            {/* Protected mentor routes */}
            <Route element={<Shell requireAuth allowedRoles={['mentor']} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/execution" element={<ExecutionPage />} />
              <Route path="/crm" element={<CRMPage />} />
              <Route path="/lead/:id" element={<LeadProfilePage />} />
              <Route path="/mentees" element={<MenteesPage />} />
              <Route path="/mentee/:id" element={<MenteeProfilePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/warming" element={<WarmingPage />} />
              <Route path="/academy/manage" element={<ManageAcademyPage />} />
              <Route path="/onboarding-editor" element={<OnboardingEditorPage />} />
              <Route path="/swipe-file" element={<SwipeFileLib />} />
              <Route path="/assets" element={<AssetsManager />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Protected mentee routes */}
            <Route element={<Shell requireAuth allowedRoles={['mentee']} />}>
              <Route path="/me" element={<MenteeHomePage />} />
              <Route path="/me/tasks" element={<MenteeTasksPage />} />
              <Route path="/me/finance" element={<MenteeFinancePage />} />
              <Route path="/me/resources" element={<ResourcesPage />} />
              <Route path="/me/academy" element={<AcademyPage />} />
              <Route path="/me/mining" element={<MiningPage />} />
              <Route path="/me/warming" element={<WarmingPage />} />
              <Route path="/warming" element={<WarmingPage />} />
              <Route path="/me/how-it-works" element={<HowItWorksPage />} />
              <Route path="/me/swipe-file" element={<SwipeFileLib />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
