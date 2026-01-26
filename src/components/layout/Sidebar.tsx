import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Zap,
    Users,
    UserCircle,
    Calendar,
    DollarSign,
    FileText,
    Target,
    Crosshair,
    Home,
    FolderOpen,
    GraduationCap,
    Flame,
    Pickaxe
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import './Sidebar.css';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    roles?: Array<'mentor' | 'mentee'>;
}

const mentorNavItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/execution', label: 'Execução', icon: <Zap size={20} /> },
    { path: '/crm', label: 'CRM', icon: <Target size={20} /> },
    { path: '/mentees', label: 'Mentorados', icon: <Users size={20} /> },
    { path: '/calendar', label: 'Calendário', icon: <Calendar size={20} /> },
    { path: '/finance', label: 'Financeiro', icon: <DollarSign size={20} /> },
    { path: '/academy/manage', label: 'Academy', icon: <GraduationCap size={20} /> },
    { path: '/templates', label: 'Templates', icon: <FileText size={20} /> },
    { path: '/warming', label: 'Aquecimento X1', icon: <Flame size={20} /> },
    { path: '/resources', label: 'Recursos', icon: <FolderOpen size={20} /> },
    { path: '/onboarding-editor', label: 'Onboarding', icon: <UserCircle size={20} /> },
];

const menteeNavItems: NavItem[] = [
    { path: '/me', label: 'Minha Jornada', icon: <Home size={20} /> },
    { path: '/me/mining', label: 'Mineração', icon: <Pickaxe size={20} /> },
    { path: '/me/academy', label: 'Academy', icon: <GraduationCap size={20} /> },
    { path: '/me/warming', label: 'Aquecimento X1', icon: <Flame size={20} /> },
    { path: '/me/calls', label: 'Minhas Calls', icon: <Calendar size={20} /> },
    { path: '/me/resources', label: 'Recursos', icon: <FolderOpen size={20} /> },
    { path: '/profile', label: 'Meu Perfil', icon: <UserCircle size={20} /> },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
    const { user, signOut } = useAuth();
    const { features } = useFeatureFlags();

    const filterNavItems = (items: NavItem[]) => {
        return items.filter(item => {
            if (item.path.includes('mining') && !features.enableMining) return false;
            if (item.path.includes('warming') && !features.enableWarming) return false;
            if (item.path.includes('academy') && !features.enableAcademy) return false;
            if (item.path.includes('swipe-file') && !features.enableSwipeFile) return false; // Swipe file nav logic if meant to be here
            if (item.path.includes('ranking') && !features.enableRanking) return false; // Usually inside profile but good to have safeguard
            if (item.path.includes('resources') && !features.enableResources) return false;
            return true;
        });
    };

    const navItems = user?.role === 'mentee' ? filterNavItems(menteeNavItems) : mentorNavItems;

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Crosshair size={28} className="sidebar-logo-icon" />
                        <span className="sidebar-logo-text">MentorOS</span>
                    </div>
                    {/* Close button for mobile */}
                    <button className="sidebar-close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <ul className="sidebar-nav-list">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `sidebar-nav-item ${isActive ? 'active' : ''}`
                                    }
                                    onClick={onClose} // Close menu on nav click
                                >
                                    <span className="sidebar-nav-icon">{item.icon}</span>
                                    <span className="sidebar-nav-label">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{user?.displayName || 'Usuário'}</span>
                            <span className="sidebar-user-role">
                                {user?.role === 'mentor' ? 'Mentor' : 'Mentorado'}
                            </span>
                        </div>
                    </div>
                    <button
                        className="sidebar-logout-btn"
                        onClick={signOut}
                        title="Sair"
                    >
                        Sair
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
