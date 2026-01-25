import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Shell } from './components/layout';
import './styles/global.css';

// Page imports
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
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

// Placeholder pages for remaining routes
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <h1 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-2xl)' }}>{title}</h1>
    <p style={{ color: 'var(--text-secondary)' }}>Esta página será implementada em breve.</p>
  </div>
);

// Mentee Portal pages
const MenteeHowItWorksPage = () => <PlaceholderPage title="Como Funciona" />;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected mentor routes */}
            <Route element={<Shell requireAuth allowedRoles={['mentor']} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/execution" element={<ExecutionPage />} />
              <Route path="/crm" element={<CRMPage />} />
              <Route path="/lead/:id" element={<LeadProfilePage />} />
              <Route path="/mentees" element={<MenteesPage />} />
              <Route path="/mentee/:id" element={<MenteeProfilePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/finance" element={<FinancePage />} /> {/* Connected FinancePage */}
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/onboarding-editor" element={<OnboardingEditorPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Protected mentee routes */}
            <Route element={<Shell requireAuth allowedRoles={['mentee']} />}>
              <Route path="/me" element={<MenteeHomePage />} />
              <Route path="/me/calls" element={<MenteeCallsPage />} />
              <Route path="/me/how-it-works" element={<MenteeHowItWorksPage />} />
              <Route path="/profile" element={<ProfilePage />} />
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
