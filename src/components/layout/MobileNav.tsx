import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Zap,
    Target,
    Users,
    DollarSign,
    Calendar,
    Home,
    UserCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './MobileNav.css';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

const mentorMobileItems: NavItem[] = [
    { path: '/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { path: '/crm', label: 'CRM', icon: <Target size={20} /> },
    { path: '/execution', label: 'Execução', icon: <Zap size={20} /> },
    { path: '/mentees', label: 'Alunos', icon: <Users size={20} /> },
    { path: '/finance', label: 'R$', icon: <DollarSign size={20} /> },
];

const menteeMobileItems: NavItem[] = [
    { path: '/me', label: 'Home', icon: <Home size={20} /> },
    { path: '/me/calls', label: 'Calls', icon: <Calendar size={20} /> },
    { path: '/profile', label: 'Perfil', icon: <UserCircle size={20} /> },
];

export const MobileNav: React.FC = () => {
    const { user } = useAuth();
    const navItems = user?.role === 'mentee' ? menteeMobileItems : mentorMobileItems;

    return (
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
            </div>
        </nav>
    );
};

export default MobileNav;
