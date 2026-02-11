import React, { useState, useEffect } from 'react';
import {
    FlaskConical,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Sparkles,
    Target,
    Gift,
    ShieldCheck,
    Coins
} from 'lucide-react';

interface OfferData {
    promise: string;
    timeline: string;
    mechanismName: string;
    mechanismExplanation: string;
    deliverables: string;
    bonuses: string; // Could be array, keeping simple for now
    price: string;
    anchorPrice: string;
    guarantee: string;
    cta: string;
}

const STEPS = [
    { id: 1, title: 'Grande Promessa', icon: <Target size={18} /> },
    { id: 2, title: 'Mecanismo Único', icon: <Sparkles size={18} /> },
    { id: 3, title: 'Entregáveis', icon: <Gift size={18} /> },
    { id: 4, title: 'Oferta & Preço', icon: <Coins size={18} /> },
    { id: 5, title: 'Garantia & CTA', icon: <ShieldCheck size={18} /> },
];

export const OfferLab: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<OfferData>(() => {
        const saved = localStorage.getItem('offer_lab_data');
        return saved ? JSON.parse(saved) : {
            promise: '',
            timeline: '',
            mechanismName: '',
            mechanismExplanation: '',
            deliverables: '',
            bonuses: '',
            price: '',
            anchorPrice: '',
            guarantee: '',
            cta: ''
        };
    });

    useEffect(() => {
        localStorage.setItem('offer_lab_data', JSON.stringify(formData));
    }, [formData]);

    const handleInputChange = (field: keyof OfferData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (currentStep < STEPS.length) setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
            <header className="mb-8 animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10">
                        <FlaskConical size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Laboratório de Ofertas</h1>
                        <p className="text-zinc-400 mt-1 text-sm">Design system para construção de ofertas de alta conversão.</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Navigation & Form (7 columns) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Stepper - Glass Effect */}
                    <div className="glass-card p-2 rounded-2xl flex justify-between items-center relative overflow-hidden">
                        {/* Background Progress Bar */}
                        <div className="absolute left-0 bottom-0 top-0 bg-indigo-500/5 transition-all duration-500 ease-out"
                            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                        />

                        {STEPS.map((step) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = step.id < currentStep;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setCurrentStep(step.id)}
                                    className={`relative z-10 flex-1 flex flex-col items-center gap-2 py-3 px-1 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/5 shadow-inner' : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive
                                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30 scale-110'
                                        : isCompleted
                                            ? 'bg-zinc-800 border-green-500/50 text-green-400'
                                            : 'bg-zinc-900/50 border-zinc-700 text-zinc-600'
                                        }`}>
                                        {isCompleted ? <CheckCircle2 size={18} /> : step.icon}
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-indigo-400' : isCompleted ? 'text-green-500/70' : 'text-zinc-600'
                                        }`}>
                                        {step.title}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Main Form Area */}
                    <div className="glass-card p-8 rounded-2xl min-h-[500px] flex flex-col justify-between border-t border-white/10 relative overflow-hidden group">

                        {/* Dynamic Background Glow */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />

                        <div className="relative z-10 animate-in fade-in slide-in-from-right-8 duration-500">
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div className="border-b border-white/5 pb-4 mb-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <Target className="text-indigo-400" size={28} />
                                            A Grande Promessa
                                        </h2>
                                        <p className="text-zinc-400 mt-2 text-sm">O compromisso mais audacioso que você pode cumprir.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Qual é o resultado final transformador?</label>
                                            <textarea
                                                className="w-full bg-[#09090b] border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none min-h-[100px] transition-all placeholder:text-zinc-600 font-medium text-lg leading-relaxed shadow-inner"
                                                placeholder="Ex: Faturar R$ 10.000 por mês..."
                                                value={formData.promise}
                                                onChange={(e) => handleInputChange('promise', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Em quanto tempo (Timeline)?</label>
                                            <input
                                                type="text"
                                                className="w-full bg-[#09090b] border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600 h-14 font-medium px-4"
                                                placeholder="Ex: Em 90 dias ou menos"
                                                value={formData.timeline}
                                                onChange={(e) => handleInputChange('timeline', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 text-sm text-indigo-400 mt-6 flex items-start gap-3">
                                        <Sparkles size={18} className="shrink-0 mt-0.5" />
                                        <span><strong>Dica:</strong> Uma boa promessa deve ser específica, desejável e ter um prazo claro.</span>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className="border-b border-white/5 pb-4 mb-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <Sparkles className="text-indigo-400" size={28} />
                                            Mecanismo Único
                                        </h2>
                                        <p className="text-zinc-400 mt-2 text-sm">O veículo exclusivo que entrega a promessa.</p>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="group/input">
                                            <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Nome do Método</label>
                                            <input
                                                type="text"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-700 h-14"
                                                placeholder="Ex: Protocolo Anti-Dívidas..."
                                                value={formData.mechanismName}
                                                onChange={(e) => handleInputChange('mechanismName', e.target.value)}
                                            />
                                        </div>
                                        <div className="group/input">
                                            <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">A Lógica (Por que funciona?)</label>
                                            <textarea
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none min-h-[140px] transition-all placeholder:text-zinc-700 font-medium"
                                                placeholder="Ex: Funciona porque ataca a causa raiz (comportamento) e não o sintoma (dívida)..."
                                                value={formData.mechanismExplanation}
                                                onChange={(e) => handleInputChange('mechanismExplanation', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div className="border-b border-white/5 pb-4 mb-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <Gift className="text-indigo-400" size={28} />
                                            Entregáveis & Bônus
                                        </h2>
                                        <p className="text-zinc-400 mt-2 text-sm">Empilhe valor para tornar o preço irrelevante.</p>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="group/input">
                                            <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">O que está incluso?</label>
                                            <textarea
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none min-h-[100px] transition-all placeholder:text-zinc-700 font-medium"
                                                placeholder="Ex: 12 Encontros Zoom&#10;Acesso Vitalício&#10;Grupo de Networking"
                                                value={formData.deliverables}
                                                onChange={(e) => handleInputChange('deliverables', e.target.value)}
                                            />
                                        </div>
                                        <div className="group/input">
                                            <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Bônus de Aceleração</label>
                                            <textarea
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none min-h-[100px] transition-all placeholder:text-zinc-700 font-medium"
                                                placeholder="Ex: Curso de Finanças Pessoais (R$ 497)&#10;Planilha de Controle (R$ 97)"
                                                value={formData.bonuses}
                                                onChange={(e) => handleInputChange('bonuses', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <div className="border-b border-white/5 pb-4 mb-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <Coins className="text-indigo-400" size={28} />
                                            Oferta Irresistível
                                        </h2>
                                        <p className="text-zinc-400 mt-2 text-sm">Defina o preço e a ancoragem estratégica.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="group/input">
                                            <label className="block text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Preço Real</label>
                                            <input
                                                type="text"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-2xl font-bold text-green-400 focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all placeholder:text-zinc-800 h-16"
                                                placeholder="R$ 1.997"
                                                value={formData.price}
                                                onChange={(e) => handleInputChange('price', e.target.value)}
                                            />
                                        </div>
                                        <div className="group/input">
                                            <label className="block text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Ancoragem (De:)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-xl text-zinc-500 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none transition-all placeholder:text-zinc-800 h-16"
                                                placeholder="R$ 4.997"
                                                value={formData.anchorPrice}
                                                onChange={(e) => handleInputChange('anchorPrice', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div className="space-y-6">
                                    <div className="border-b border-white/5 pb-4 mb-6">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <ShieldCheck className="text-indigo-400" size={28} />
                                            Risco Zero & CTA
                                        </h2>
                                        <p className="text-zinc-400 mt-2 text-sm">Elimine o medo e chame para a ação.</p>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="group/input">
                                            <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Garantia Incondicional</label>
                                            <textarea
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none min-h-[80px] transition-all placeholder:text-zinc-700 font-medium"
                                                placeholder="Ex: Se em 7 dias você não gostar, devolvo 100% do seu dinheiro."
                                                value={formData.guarantee}
                                                onChange={(e) => handleInputChange('guarantee', e.target.value)}
                                            />
                                        </div>
                                        <div className="group/input">
                                            <label className="block text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Texto do Botão (CTA)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all placeholder:text-zinc-700 h-14 font-bold"
                                                placeholder="Ex: QUERO GARANTIR MINHA VAGA"
                                                value={formData.cta}
                                                onChange={(e) => handleInputChange('cta', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-white/5 relative z-10">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${currentStep === 1
                                    ? 'text-zinc-700 cursor-not-allowed'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <ArrowLeft size={18} /> Anterior
                            </button>

                            <button
                                onClick={nextStep}
                                disabled={currentStep === STEPS.length}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {currentStep === STEPS.length ? 'Finalizar Oferta' : 'Próximo Passo'}
                                {currentStep !== STEPS.length && <ArrowRight size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Live Preview (5 columns) */}
                <div className="lg:col-span-5">
                    <div className="sticky top-6 animate-slide-in-right">
                        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                            {/* Browser Bar */}
                            <div className="bg-black/40 p-3 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
                                    <ShieldCheck size={10} /> secure-checkout.com
                                </div>
                                <div className="w-3" />
                            </div>

                            {/* Preview Content */}
                            <div className="p-8 space-y-8 font-sans bg-gradient-to-b from-[#0f0f11] to-[#0a0a0a] min-h-[600px] relative">
                                {/* Dotted Pattern Overlay */}
                                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                                {/* Headline Section */}
                                <div className="text-center space-y-4 relative z-10">
                                    <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                                        Oferta Exclusiva
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-white leading-tight">
                                        Como {formData.promise ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{formData.promise}</span> : <span className="opacity-30 border-b border-dashed border-zinc-600">[Sua Promessa]</span>}
                                        {formData.timeline && <span className="block text-white mt-1"> em {formData.timeline}</span>}
                                    </h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
                                        Descubra o {formData.mechanismName ? <strong className="text-white bg-white/10 px-1 rounded"> {formData.mechanismName}</strong> : <span className="opacity-30 border-b border-dashed border-zinc-600 mx-1">[Seu Método]</span>},
                                        o único caminho para ter resultados sem esforço desnecessário.
                                    </p>
                                </div>

                                {/* Stack Section */}
                                <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">O que você leva:</p>
                                    <ul className="space-y-3">
                                        {formData.deliverables ? (
                                            formData.deliverables.split('\n').map((item, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-zinc-300 items-start">
                                                    <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                                    <span className="font-medium">{item}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-zinc-700 italic text-sm">Seus entregáveis aparecerão aqui...</li>
                                        )}

                                        {formData.bonuses && (
                                            <>
                                                <div className="h-px bg-white/5 my-3" />
                                                <li className="flex gap-2 items-center text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                                    <Gift size={12} /> Bônus Exclusivos
                                                </li>
                                                {formData.bonuses.split('\n').map((item, i) => (
                                                    <li key={`b-${i}`} className="flex gap-3 text-sm text-zinc-300 items-start">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </>
                                        )}
                                    </ul>
                                </div>

                                {/* Price Section */}
                                <div className="text-center pt-2 space-y-1">
                                    {formData.anchorPrice && (
                                        <p className="text-sm text-red-400/60 line-through font-medium">De {formData.anchorPrice}</p>
                                    )}
                                    <p className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                                        {formData.price || <span className="text-zinc-800 text-4xl">R$ 000</span>}
                                    </p>
                                    <p className="text-xs text-zinc-500">Pagamento único ou em até 12x</p>
                                </div>

                                {/* Guarantee */}
                                {formData.guarantee && (
                                    <div className="flex items-start gap-3 bg-green-500/5 p-4 rounded-xl border border-green-500/10">
                                        <ShieldCheck size={24} className="text-green-500 shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-green-400 uppercase mb-1">Garantia Blindada</p>
                                            <p className="text-xs text-green-100/80 leading-relaxed text-left">{formData.guarantee}</p>
                                        </div>
                                    </div>
                                )}

                                {/* CTA Button */}
                                <button className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black rounded-xl shadow-xl shadow-green-600/20 text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] ring-1 ring-white/20">
                                    {formData.cta || "SIM, QUERO ACESSAR AGORA"}
                                </button>

                                <div className="flex justify-center gap-4 opacity-50">
                                    <div className="h-4 w-8 bg-zinc-700/50 rounded" />
                                    <div className="h-4 w-8 bg-zinc-700/50 rounded" />
                                    <div className="h-4 w-8 bg-zinc-700/50 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
