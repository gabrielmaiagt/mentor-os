import React from 'react';
import { TrafficFinance } from '../Finance/components/TrafficFinance';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import './MenteeFinance.css';

export const MenteeFinancePage: React.FC = () => {
    const { firebaseUser } = useAuth();
    const [menteeId, setMenteeId] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

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
            <TrafficFinance menteeId={menteeId} />
        </div>
    );
};

export default MenteeFinancePage;
