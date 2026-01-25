import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, Bell, Menu, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import './Header.css';

export const Header: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            console.log('Open command palette');
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            console.log('Searching:', searchQuery);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao sair');
        }
    };

    const handleNotificationClick = () => {
        toast.info('Você não tem novas notificações.');
    };

    return (
        <header className="header">
            <div className="header-left">
                <button
                    className="header-mobile-menu"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    aria-label="Menu"
                >
                    <Menu size={20} />
                </button>

                <form className="header-search" onSubmit={handleSearch}>
                    <Search size={18} className="header-search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar lead, mentorado..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="header-search-input"
                    />
                    <div className="header-search-shortcut">
                        <Command size={12} />
                        <span>K</span>
                    </div>
                </form>
            </div>

            <div className="header-right">
                <button
                    className="header-action-btn"
                    aria-label="Notificações"
                    onClick={handleNotificationClick}
                >
                    <Bell size={20} />
                </button>

                <div className="header-user-dropdown" ref={menuRef}>
                    <div
                        className="header-user-avatar"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    {showUserMenu && (
                        <div className="header-user-menu">
                            <button
                                className="header-user-menu-item"
                                onClick={() => navigate('/profile')}
                            >
                                <UserIcon size={16} />
                                <span>Meu Perfil</span>
                            </button>
                            <button className="header-user-menu-item logout" onClick={handleLogout}>
                                <LogOut size={16} />
                                <span>Sair</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
