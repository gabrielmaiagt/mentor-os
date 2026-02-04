import React, { useState } from 'react';
import { MentorshipFinance } from './components/MentorshipFinance';
import { TrafficFinance } from './components/TrafficFinance';
import { Users, TrendingUp } from 'lucide-react';
import './Finance.css';

const FinancePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'MENTORSHIP' | 'TRAFFIC'>('TRAFFIC');

    return (
        <div className="finance-page">
            <div className="finance-header">
                <h1 className="finance-title">Financeiro</h1>
                <div className="finance-tabs">
                    <button
                        className={`finance-tab ${activeTab === 'TRAFFIC' ? 'active' : ''}`}
                        onClick={() => setActiveTab('TRAFFIC')}
                    >
                        <TrendingUp size={18} />
                        <span>Tráfego & Ofertas</span>
                    </button>
                    <button
                        className={`finance-tab ${activeTab === 'MENTORSHIP' ? 'active' : ''}`}
                        onClick={() => setActiveTab('MENTORSHIP')}
                    >
                        <Users size={18} />
                        <span>Mentorias</span>
                    </button>
                </div>
            </div>

            <div className="finance-content">
                {activeTab === 'TRAFFIC' ? <TrafficFinance /> : <MentorshipFinance />}
            </div>
        </div>
    );
};

export default FinancePage;
