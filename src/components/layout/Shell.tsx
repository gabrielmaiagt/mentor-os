import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWarmingScheduler } from '../../hooks/useWarmingScheduler';
import useFcmToken from '../../hooks/useFcmToken';
import MobileNav from './MobileNav';
import Sidebar from './Sidebar';
import Header from './Header';
import './Shell.css';

import { useTaskScheduler } from '../../hooks/useTaskScheduler';

interface ShellProps {
    requireAuth?: boolean;
    allowedRoles?: Array<'mentor' | 'mentee'>;
}

export const Shell: React.FC<ShellProps> = ({
    requireAuth = true,
    allowedRoles = ['mentor', 'mentee']
}) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    useWarmingScheduler();

    // Activate Task Scheduler
    useTaskScheduler();

    // Register FCM Token for the current user (always in 'users' collection for Auth UID consistency)
    useFcmToken(user?.id, 'users');

    // IMPORTANT: All hooks must be called before any conditional returns
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    // Show loading state
    if (loading) {
        return (
            <div className="shell-loading">
                <div className="shell-loading-spinner" />
                <p>Carregando...</p>
            </div>
        );
    }

    // Redirect to login if auth required but not authenticated
    if (requireAuth && !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role access
    if (user && !allowedRoles.includes(user.role)) {
        // Redirect mentees to their portal
        if (user.role === 'mentee') {
            return <Navigate to="/me" replace />;
        }
        // Redirect mentors to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="shell">
            <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
            <MobileNav />
            <div className="shell-main">
                <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
                <main className="shell-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Shell;
