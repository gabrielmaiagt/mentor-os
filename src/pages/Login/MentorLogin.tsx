import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, Button, Input } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { Target, Lock, Mail } from 'lucide-react';
import './MentorLogin.css';

export const MentorLogin: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Verify user is a mentor
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            if (!userDoc.exists() || userDoc.data()?.role !== 'mentor') {
                await auth.signOut();
                toast.error('Acesso restrito. Esta área é exclusiva para mentores.');
                setLoading(false);
                return;
            }

            toast.success('Login realizado!');
            navigate('/dashboard');
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

    return (
        <div className="mentor-login-page">
            <div className="mentor-login-container">
                <Card className="mentor-login-card">
                    <div className="mentor-login-header">
                        <div className="mentor-login-icon">
                            <Target size={40} />
                        </div>
                        <h1 className="mentor-login-title">Acesso Mentor</h1>
                        <p className="mentor-login-subtitle">Área restrita para mentores credenciados</p>
                    </div>

                    <form onSubmit={handleLogin} className="mentor-login-form">
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

                    <div className="mentor-login-footer">
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
