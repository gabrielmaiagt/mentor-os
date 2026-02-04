import React, { useState } from 'react';
import { MentorshipFinance } from './components/MentorshipFinance';
import { TrafficFinance } from './components/TrafficFinance';
import { OperationalFinance } from './components/OperationalFinance';
import { PersonalFinance } from './components/PersonalFinance';
import { Users, TrendingUp, Briefcase, Home } from 'lucide-react';
import './Finance.css';

const FinancePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'MENTORSHIP' | 'TRAFFIC' | 'OPERATIONAL' | 'PERSONAL'>('TRAFFIC');

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
                    <div className="divider-vertical" />
                    <button
                        className={`finance-tab ${activeTab === 'OPERATIONAL' ? 'active' : ''}`}
                        onClick={() => setActiveTab('OPERATIONAL')}
                    >
                        <Briefcase size={18} />
                        <span>Operacional</span>
                    </button>
                    <button
                        className={`finance-tab ${activeTab === 'PERSONAL' ? 'active' : ''}`}
                        onClick={() => setActiveTab('PERSONAL')}
                    >
                        <Home size={18} />
                        <span>Pessoal</span>
                    </button>
                </div>
            </div>

            <div className="finance-content">
                {activeTab === 'TRAFFIC' && <TrafficFinance />}
                {activeTab === 'MENTORSHIP' && <MentorshipFinance />}
                {activeTab === 'OPERATIONAL' && <OperationalFinance />}
                {activeTab === 'PERSONAL' && <PersonalFinance />}
            </div>
        </div>
    );
};

export default FinancePage;
