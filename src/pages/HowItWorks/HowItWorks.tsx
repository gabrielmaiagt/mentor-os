import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui';
import { Play, CheckCircle, Target, Zap, Calendar, TrendingUp, HelpCircle } from 'lucide-react';
import './HowItWorks.css';

export const HowItWorksPage: React.FC = () => {
    const navigate = useNavigate();

    const steps = [
        {
            icon: <Target size={32} />,
            title: '1. Defina Seu Objetivo',
            description: 'Comece identificando sua meta principal. Queremos escalar vendas? Lançar um produto? Defina claramente para onde você quer ir.',
            color: 'var(--accent-primary)'
        },
        {
            icon: <Zap size={32} />,
            title: '2. Onboarding Personalizado',
            description: 'Complete as etapas do onboarding gamificado. Cada passo te prepara com ferramentas, conhecimento e estrutura necessária.',
            color: 'var(--status-warning)'
        },
        {
            icon: <TrendingUp size={32} />,
            title: '3. Execute e Minere',
            description: 'Coloque a mão na massa! Mine ofertas, teste anúncios, valide seu produto. A execução é onde a mágica acontece.',
            color: 'var(--status-success)'
        },
        {
            icon: <Calendar size={32} />,
            title: '4. Calls Semanais',
            description: 'Tenha calls regulares com seu mentor para review, ajustes de rota e estratégia. Você nunca está sozinho nessa jornada.',
            color: 'var(--status-info)'
        },
        {
            icon: <CheckCircle size={32} />,
            title: '5. Escale Resultados',
            description: 'Com ofertas validadas e sistema rodando, é hora de escalar. Aumente investimento, contrate, automatize.',
            color: 'var(--accent-secondary)'
        }
    ];

    const faqs = [
        {
            question: 'Quanto tempo leva para ver resultados?',
            answer: 'Depende do seu nível de execução e nicho. Em média, mentorados começam a ver primeiros resultados (validação de ofertas) em 2-4 semanas. Resultados financeiros consistentes geralmente aparecem em 2-3 meses.'
        },
        {
            question: 'Quantas horas por semana preciso dedicar?',
            answer: 'Recomendamos no mínimo 10-15 horas semanais para execução efetiva. Quanto mais você dedica (com smart work, não apenas hard work), mais rápido chegam os resultados.'
        },
        {
            question: 'O que é o processo de Mining?',
            answer: 'Mining é o nosso método de descobrir e validar ofertas vencedoras. Você vai testar diferentes ângulos, públicos e produtos até encontrar aqueles que realmente convertem e escalam.'
        },
        {
            question: 'Como funcionam as calls de mentoria?',
            answer: 'Calls semanais de 30-60min onde revisamos seu progresso, resolvemos bloqueios, ajustamos estratégia e definimos próximos passos. São agendadas via plataforma e registradas para consulta posterior.'
        },
        {
            question: 'E se eu travar em alguma etapa?',
            answer: 'Use o botão "Enviar Update" para reportar bloqueios. Seu mentor receberá uma notificação e poderá te ajudar via WhatsApp ou agendar uma call extra se necessário.'
        }
    ];

    return (
        <div className="how-it-works-page">
            {/* Hero Section */}
            <div className="how-hero">
                <div className="how-hero-content">
                    <h1 className="how-title">Como Funciona a Mentoria</h1>
                    <p className="how-subtitle">
                        Um sistema comprovado para transformar sua ideia em um negócio escalável e lucrativo
                    </p>
                </div>
            </div>

            {/* Video Section (Placeholder) */}
            <Card className="how-video-card" padding="none">
                <div className="how-video-placeholder">
                    <Play size={64} />
                    <p>Vídeo de Boas-Vindas</p>
                    <span className="how-video-duration">5:32</span>
                </div>
            </Card>

            {/* Process Steps */}
            <section className="how-section">
                <h2 className="how-section-title">O Processo em 5 Etapas</h2>
                <div className="how-steps-grid">
                    {steps.map((step, index) => (
                        <Card key={index} className="how-step-card" padding="lg">
                            <div className="how-step-icon" style={{ backgroundColor: step.color }}>
                                {step.icon}
                            </div>
                            <h3 className="how-step-title">{step.title}</h3>
                            <p className="how-step-description">{step.description}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="how-section">
                <h2 className="how-section-title">
                    <HelpCircle size={28} />
                    Perguntas Frequentes
                </h2>
                <div className="how-faq-grid">
                    {faqs.map((faq, index) => (
                        <Card key={index} className="how-faq-card" padding="lg">
                            <h3 className="how-faq-question">{faq.question}</h3>
                            <p className="how-faq-answer">{faq.answer}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <Card className="how-cta-card" padding="lg">
                <div className="how-cta-content">
                    <h2>Pronto para Começar?</h2>
                    <p>Volte para sua dashboard e comece a executar suas tarefas!</p>
                    <button className="how-cta-button" onClick={() => navigate('/me')}>
                        Ir para Dashboard
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default HowItWorksPage;
