import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Badge, Modal } from '../../components/ui';
import { Mail, Shield, Calendar, Settings } from 'lucide-react';
import './Profile.css';

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [name, setName] = useState(user?.displayName || '');
    const [photoUrl, setPhotoUrl] = useState('');

    const handleSaveProfile = () => {
        // Mock save
        // In real app: updateProfile(auth.currentUser, { displayName: name, photoURL: photoUrl })
        setIsEditModalOpen(false);
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-avatar-large">
                    {photoUrl ? <img src={photoUrl} alt="Avatar" /> : (user?.displayName?.charAt(0).toUpperCase() || 'U')}
                </div>
                <div className="profile-title-info">
                    <h1>{user?.displayName || 'Usuário'}</h1>
                    <div className="profile-badges">
                        <Badge variant="info">{user?.role === 'mentor' ? 'Mentor Master' : 'Mentorado'}</Badge>
                        <Badge variant="success">Conta Ativa</Badge>
                    </div>
                </div>
            </div>

            <div className="profile-grid">
                <Card className="profile-info-card" padding="lg">
                    <h2 className="section-title">Informações Pessoais</h2>
                    <div className="info-list">
                        <div className="info-item">
                            <Mail size={18} />
                            <div>
                                <span className="info-label">Email</span>
                                <span className="info-value">{user?.email}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <Shield size={18} />
                            <div>
                                <span className="info-label">Função</span>
                                <span className="info-value">Acesso Total (Mentor)</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <Calendar size={18} />
                            <div>
                                <span className="info-label">Membro desde</span>
                                <span className="info-value">Janeiro 2024</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        className="mt-6"
                        icon={<Settings size={16} />}
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        Editar Perfil
                    </Button>
                </Card>

                <Card className="profile-settings-card" padding="lg">
                    <h2 className="section-title">Segurança</h2>
                    <p className="text-secondary mb-6">Mantenha sua conta segura alterando sua senha regularmente.</p>
                    <div className="settings-actions">
                        <Button variant="ghost">Alterar Senha</Button>
                        <Button variant="ghost" className="text-error">Desativar Conta</Button>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Editar Perfil"
                size="md"
            >
                <div className="edit-profile-form">
                    <div className="form-group">
                        <label>Nome Completo</label>
                        <input
                            type="text"
                            className="input-field"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>URL da Foto (Avatar)</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="https://..."
                            value={photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                        />
                    </div>
                    <div className="modal-actions mt-6">
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveProfile}>Salvar Alterações</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProfilePage;
