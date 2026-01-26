import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui';
import { GraduationCap, Target, ArrowRight } from 'lucide-react';
import './RoleSelector.css';

export const RoleSelector: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="role-selector-page">
            <div className="role-selector-container">
                <div className="role-selector-header">
                    <h1 className="role-selector-title">Bem-vindo ao MentorOS</h1>
                    <p className="role-selector-subtitle">Escolha como você quer acessar a plataforma</p>
                </div>

                <div className="role-cards-grid">
                    {/* Mentor Card */}
                    <Card
                        className="role-card role-card-mentor"
                        onClick={() => navigate('/mentor/login')}
                    >
                        <div className="role-card-icon">
                            <Target size={48} />
                        </div>
                        <h2 className="role-card-title">Sou Mentor</h2>
                        <p className="role-card-description">
                            Acesso ao painel de gestão, CRM, calendário e todas as ferramentas para gerenciar sua mentoria.
                        </p>
                        <div className="role-card-action">
                            Fazer Login <ArrowRight size={20} />
                        </div>
                    </Card>

                    {/* Mentee Card */}
                    <Card
                        className="role-card role-card-mentee"
                        onClick={() => navigate('/mentee/login')}
                    >
                        <div className="role-card-icon">
                            <GraduationCap size={48} />
                        </div>
                        <h2 className="role-card-title">Sou Mentorado</h2>
                        <p className="role-card-description">
                            Acesse sua jornada, aulas, materiais, calls e acompanhe todo seu progresso na mentoria.
                        </p>
                        <div className="role-card-action">
                            Entrar / Cadastrar <ArrowRight size={20} />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
