import React, { useState } from 'react';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Badge, Modal } from '../../components/ui';
import { Mail, Shield, Calendar, Settings, Lock, Building, Phone } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import './Profile.css';

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Profile Form State
    const [name, setName] = useState(user?.displayName || '');
    const [photoUrl, setPhotoUrl] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');

    // Password Form State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Load additional user data from Firestore
    React.useEffect(() => {
        const loadUserData = async () => {
            if (!auth.currentUser) return;
            try {
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setCompanyName(data.companyName || '');
                    setWhatsapp(data.whatsapp || '');
                    if (data.avatarUrl) setPhotoUrl(data.avatarUrl);
                }
            } catch (e) {
                console.error('Error loading user data:', e);
            }
        };
        loadUserData();
    }, []);

    const handleSaveProfile = async () => {
        if (!auth.currentUser) return;
        setLoading(true);
        try {
            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, {
                displayName: name,
                photoURL: photoUrl || null
            });

            // Update Firestore user document
            await setDoc(doc(db, 'users', auth.currentUser.uid), {
                displayName: name,
                avatarUrl: photoUrl,
                companyName,
                whatsapp,
                updatedAt: new Date()
            }, { merge: true });

            toast.success('Perfil atualizado!');
            setIsEditModalOpen(false);
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao salvar', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!auth.currentUser || !auth.currentUser.email) return;

        if (newPassword !== confirmPassword) {
            toast.error('Senhas não conferem');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            // Re-authenticate user
            const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Update password
            await updatePassword(auth.currentUser, newPassword);

            toast.success('Senha alterada com sucesso!');
            setIsPasswordModalOpen(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                toast.error('Senha atual incorreta');
            } else {
                toast.error('Erro ao alterar senha', error.message);
            }
        } finally {
            setLoading(false);
        }
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
                            <Phone size={18} />
                            <div>
                                <span className="info-label">WhatsApp</span>
                                <span className="info-value">{whatsapp || 'Não informado'}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <Building size={18} />
                            <div>
                                <span className="info-label">Empresa</span>
                                <span className="info-value">{companyName || 'Não informado'}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <Shield size={18} />
                            <div>
                                <span className="info-label">Função</span>
                                <span className="info-value">{user?.role === 'mentor' ? 'Acesso Total (Mentor)' : 'Mentorado'}</span>
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
                        <Button variant="ghost" icon={<Lock size={16} />} onClick={() => setIsPasswordModalOpen(true)}>
                            Alterar Senha
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Edit Profile Modal */}
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
                        <label>URL da Foto (opcional)</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="https://..."
                            value={photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Nome da Empresa</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Sua empresa"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>WhatsApp</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="+55 11 99999-9999"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                        />
                    </div>
                    <div className="modal-actions mt-6">
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveProfile} disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title="Alterar Senha"
                size="sm"
            >
                <div className="edit-profile-form">
                    <div className="form-group">
                        <label>Senha Atual</label>
                        <input
                            type="password"
                            className="input-field"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Nova Senha</label>
                        <input
                            type="password"
                            className="input-field"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirmar Nova Senha</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <div className="modal-actions mt-6">
                        <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleChangePassword} disabled={loading}>
                            {loading ? 'Alterando...' : 'Alterar Senha'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProfilePage;
