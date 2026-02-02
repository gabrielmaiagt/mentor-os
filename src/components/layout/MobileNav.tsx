import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Zap,
    Target,
    Users,
    CheckSquare,
    MoreHorizontal,
    Home,
    Calendar,
    UserCircle,
    GraduationCap,
    X,
    DollarSign,
    FileText,
    Flame,
    FolderOpen,
    Settings,
    Layers,
    Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './MobileNav.css';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

// Core items for bottom nav (max 5)
const mentorMobileItems: NavItem[] = [
    { path: '/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { path: '/crm', label: 'CRM', icon: <Target size={20} /> },
    { path: '/tasks', label: 'Missões', icon: <CheckSquare size={20} /> },
    { path: '/execution', label: 'Execução', icon: <Zap size={20} /> },
];

const menteeMobileItems: NavItem[] = [
    { path: '/me', label: 'Home', icon: <Home size={20} /> },
    { path: '/me/academy', label: 'Academy', icon: <GraduationCap size={20} /> },
    { path: '/me/calls', label: 'Calls', icon: <Calendar size={20} /> },
    { path: '/profile', label: 'Perfil', icon: <UserCircle size={20} /> },
];

// Secondary items for "More" menu
const mentorMoreItems: NavItem[] = [
    { path: '/mentees', label: 'Mentorados', icon: <Users size={20} /> },
    { path: '/calendar', label: 'Calendário', icon: <Calendar size={20} /> },
    { path: '/finance', label: 'Financeiro', icon: <DollarSign size={20} /> },
    { path: '/templates', label: 'Templates', icon: <FileText size={20} /> },
    { path: '/swipe-file', label: 'Swipe File', icon: <Layers size={20} /> },
    { path: '/warming', label: 'Aquecimento', icon: <Flame size={20} /> },
    { path: '/assets', label: 'Ativos', icon: <Shield size={20} /> },
    { path: '/resources', label: 'Recursos', icon: <FolderOpen size={20} /> },
    { path: '/settings', label: 'Configurações', icon: <Settings size={20} /> },
];

const menteeMoreItems: NavItem[] = [
    { path: '/me/mining', label: 'Mineração', icon: <Target size={20} /> },
    { path: '/me/warming', label: 'Aquecimento', icon: <Flame size={20} /> },
    { path: '/me/swipe-file', label: 'Swipe File', icon: <Layers size={20} /> },
    { path: '/me/resources', label: 'Recursos', icon: <FolderOpen size={20} /> },
];

export const MobileNav: React.FC = () => {
    const { user } = useAuth();
    const [moreOpen, setMoreOpen] = React.useState(false);

    const navItems = user?.role === 'mentee' ? menteeMobileItems : mentorMobileItems;
    const moreItems = user?.role === 'mentee' ? menteeMoreItems : mentorMoreItems;

    return (
        <>
            <nav className="mobile-nav">
                <div className="mobile-nav-container">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `mobile-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <div className="mobile-nav-icon">{item.icon}</div>
                            <span className="mobile-nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                    <button
                        className={`mobile-nav-item mobile-nav-more ${moreOpen ? 'active' : ''}`}
                        onClick={() => setMoreOpen(true)}
                    >
                        <div className="mobile-nav-icon"><MoreHorizontal size={20} /></div>
                        <span className="mobile-nav-label">Mais</span>
                    </button>
                </div>
            </nav>

            {/* More Menu Drawer */}
            {moreOpen && (
                <>
                    <div className="more-menu-overlay" onClick={() => setMoreOpen(false)} />
                    <div className="more-menu">
                        <div className="more-menu-header">
                            <h3>Menu</h3>
                            <button className="more-menu-close" onClick={() => setMoreOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="more-menu-items">
                            {moreItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className="more-menu-item"
                                    onClick={() => setMoreOpen(false)}
                                >
                                    <span className="more-menu-icon">{item.icon}</span>
                                    <span className="more-menu-label">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default MobileNav;
