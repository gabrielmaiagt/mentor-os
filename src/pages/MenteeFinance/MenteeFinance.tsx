import React, { useState } from 'react';
import { TrafficFinance } from '../Finance/components/TrafficFinance';
import { OperationalFinance } from '../Finance/components/OperationalFinance';
import { PersonalFinance } from '../Finance/components/PersonalFinance';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TrendingUp, Briefcase, Home } from 'lucide-react';
import './MenteeFinance.css';

export const MenteeFinancePage: React.FC = () => {
    const { firebaseUser } = useAuth();
    const [menteeId, setMenteeId] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = useState<'TRAFFIC' | 'OPERATIONAL' | 'PERSONAL'>('TRAFFIC');

    // Get mentee ID from Firebase user
    React.useEffect(() => {
        const fetchMenteeId = async () => {
            if (!firebaseUser?.email) {
                setLoading(false);
                return;
            }

            try {
                // Try to find by UID first
                let q = query(collection(db, 'mentees'), where('uid', '==', firebaseUser.uid));
                let snapshot = await getDocs(q);

                // If not found, try by email
                if (snapshot.empty) {
                    q = query(collection(db, 'mentees'), where('email', '==', firebaseUser.email));
                    snapshot = await getDocs(q);
                }

                if (!snapshot.empty) {
                    setMenteeId(snapshot.docs[0].id);
                }
            } catch (error) {
                console.error('Error fetching mentee ID:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenteeId();
    }, [firebaseUser]);

    if (loading) {
        return (
            <div className="mentee-finance-page">
                <div className="loading-state">Carregando...</div>
            </div>
        );
    }

    if (!menteeId) {
        return (
            <div className="mentee-finance-page">
                <div className="error-state">
                    <h2>Perfil não encontrado</h2>
                    <p>Não foi possível carregar seu perfil de mentorado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mentee-finance-page">
            <div className="mentee-finance-header">
                <div className="finance-tabs" style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
                    <button
                        className={`finance-tab ${activeTab === 'TRAFFIC' ? 'active' : ''}`}
                        onClick={() => setActiveTab('TRAFFIC')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'TRAFFIC' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'TRAFFIC' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        <TrendingUp size={18} />
                        <span>Ofertas & Tráfego</span>
                    </button>
                    <div className="divider-vertical" style={{ width: '1px', backgroundColor: 'var(--border-subtle)', margin: '0 8px' }} />
                    <button
                        className={`finance-tab ${activeTab === 'OPERATIONAL' ? 'active' : ''}`}
                        onClick={() => setActiveTab('OPERATIONAL')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'OPERATIONAL' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'OPERATIONAL' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        <Briefcase size={18} />
                        <span>Operacional</span>
                    </button>
                    <button
                        className={`finance-tab ${activeTab === 'PERSONAL' ? 'active' : ''}`}
                        onClick={() => setActiveTab('PERSONAL')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'PERSONAL' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'PERSONAL' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        <Home size={18} />
                        <span>Pessoal</span>
                    </button>
                </div>
            </div>

            <div className="finance-content">
                {activeTab === 'TRAFFIC' && <TrafficFinance menteeId={menteeId} />}
                {activeTab === 'OPERATIONAL' && <OperationalFinance menteeId={menteeId} />}
                {activeTab === 'PERSONAL' && <PersonalFinance menteeId={menteeId} />}
            </div>
        </div>
    );
};

export default MenteeFinancePage;
