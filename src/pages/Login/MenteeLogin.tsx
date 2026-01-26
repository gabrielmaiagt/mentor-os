import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, Button, Input } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { GraduationCap, Lock, Mail, User } from 'lucide-react';
import './MenteeLogin.css';

export const MenteeLogin: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Bem-vindo de volta!');
            navigate('/me');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                toast.error('Email ou senha incorretos');
            } else {
                toast.error('Erro ao fazer login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Create user profile
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email,
                displayName: name,
                role: 'mentee',
                createdAt: new Date()
            });

            // Create mentee profile
            await setDoc(doc(db, 'mentees', userCredential.user.uid), {
                userId: userCredential.user.uid,
                name,
                email,
                phone: '',
                status: 'ACTIVE',
                nivel: 'INICIANTE',
                xp: 0,
                level: 1,
                badges: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                onboardingCompleted: false
            });

            toast.success('Conta criada! Bem-vindo à mentoria! 🎉');
            navigate('/me');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Este email já está em uso');
            } else {
                toast.error('Erro ao criar conta');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mentee-login-page">
            <div className="mentee-login-container">
                <Card className="mentee-login-card">
                    <div className="mentee-login-header">
                        <div className="mentee-login-icon">
                            <GraduationCap size={40} />
                        </div>
                        <h1 className="mentee-login-title">
                            {mode === 'login' ? 'Bem-vindo de volta!' : 'Comece sua jornada'}
                        </h1>
                        <p className="mentee-login-subtitle">
                            {mode === 'login'
                                ? 'Acesse sua área de mentorado'
                                : 'Crie sua conta e dê o primeiro passo'}
                        </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => setMode('login')}
                        >
                            Login
                        </button>
                        <button
                            className={`mode-btn ${mode === 'signup' ? 'active' : ''}`}
                            onClick={() => setMode('signup')}
                        >
                            Cadastro
                        </button>
                    </div>

                    {mode === 'login' ? (
                        <form onSubmit={handleLogin} className="mentee-login-form">
                            <div className="form-group">
                                <label>Email</label>
                                <div className="input-with-icon">
                                    <Mail size={18} />
                                    <Input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Senha</label>
                                <div className="input-with-icon">
                                    <Lock size={18} />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Entrando...' : 'Entrar'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignup} className="mentee-login-form">
                            <div className="form-group">
                                <label>Nome Completo</label>
                                <div className="input-with-icon">
                                    <User size={18} />
                                    <Input
                                        type="text"
                                        placeholder="Seu nome"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <div className="input-with-icon">
                                    <Mail size={18} />
                                    <Input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Senha</label>
                                <div className="input-with-icon">
                                    <Lock size={18} />
                                    <Input
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Confirmar Senha</label>
                                <div className="input-with-icon">
                                    <Lock size={18} />
                                    <Input
                                        type="password"
                                        placeholder="Digite novamente"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Criando conta...' : 'Criar Conta'}
                            </Button>
                        </form>
                    )}

                    <div className="mentee-login-footer">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="back-link"
                        >
                            ← Voltar
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
