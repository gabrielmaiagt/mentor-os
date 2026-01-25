import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Crosshair, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui';
import './Login.css';

export const LoginPage: React.FC = () => {
    const { user, signIn, signUp, loading } = useAuth();
    const navigate = useNavigate();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<'mentor' | 'mentee'>('mentor');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // If already logged in, redirect
    if (user) {
        return <Navigate to={user.role === 'mentee' ? '/me' : '/dashboard'} replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (isSignUp) {
                await signUp(email, password, displayName, role);
            } else {
                await signIn(email, password);
            }
            // Navigation handled by auth state change
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ocorreu um erro. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="login-loading">
                <Loader2 className="login-spinner" size={32} />
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">
                        <Crosshair size={40} className="login-logo-icon" />
                    </div>
                    <h1 className="login-title">MentorOS</h1>
                    <p className="login-subtitle">
                        {isSignUp ? 'Crie sua conta para começar' : 'Entre para acessar seu cockpit'}
                    </p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    {isSignUp && (
                        <>
                            <div className="login-field">
                                <label htmlFor="displayName" className="login-label">Nome</label>
                                <div className="login-input-wrapper">
                                    <User size={18} className="login-input-icon" />
                                    <input
                                        id="displayName"
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Seu nome"
                                        required={isSignUp}
                                        className="login-input"
                                    />
                                </div>
                            </div>

                            <div className="login-field" style={{ flexDirection: 'row', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                                <input
                                    type="checkbox"
                                    id="isMentee"
                                    checked={role === 'mentee'}
                                    onChange={(e) => setRole(e.target.checked ? 'mentee' : 'mentor')}
                                />
                                <label htmlFor="isMentee" style={{ marginBottom: 0, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                    Cadastrar como Mentorado
                                </label>
                            </div>
                        </>
                    )}

                    <div className="login-field">
                        <label htmlFor="email" className="login-label">Email</label>
                        <div className="login-input-wrapper">
                            <Mail size={18} className="login-input-icon" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                className="login-input"
                            />
                        </div>
                    </div>

                    <div className="login-field">
                        <label htmlFor="password" className="login-label">Senha</label>
                        <div className="login-input-wrapper">
                            <Lock size={18} className="login-input-icon" />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="login-input"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={isSubmitting}
                    >
                        {isSignUp ? 'Criar conta' : 'Entrar'}
                    </Button>
                </form>

                <div className="login-footer">
                    <p>
                        {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                        <button
                            type="button"
                            className="login-toggle"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? 'Entre aqui' : 'Cadastre-se'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
