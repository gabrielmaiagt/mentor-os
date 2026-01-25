import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../ui';
import type { TourStep } from '../../types';
import './TourGuide.css';

interface TourGuideProps {
    steps: TourStep[];
    isOpen: boolean;
    onComplete: () => void;
    onSkip: () => void;
}

export const TourGuide: React.FC<TourGuideProps> = ({
    steps,
    isOpen,
    onComplete,
    onSkip,
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const currentStep = steps[currentStepIndex];

    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            const target = document.querySelector(currentStep.target);
            if (!target) return;

            const rect = target.getBoundingClientRect();
            setTargetRect(rect);

            // Calculate tooltip position based on placement
            // Calculate tooltip position based on placement
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;
            const centerX = rect.left + scrollX + (rect.width / 2);
            const centerY = rect.top + scrollY + (rect.height / 2);

            let top = 0;
            let left = 0;

            switch (currentStep.placement) {
                case 'top':
                    top = rect.top + scrollY;
                    left = centerX;
                    break;
                case 'bottom':
                    top = rect.bottom + scrollY;
                    left = centerX;
                    break;
                case 'left':
                    top = centerY;
                    left = rect.left + scrollX;
                    break;
                case 'right':
                    top = centerY;
                    left = rect.right + scrollX;
                    break;
                default: // center or fallback
                    top = centerY;
                    left = centerX;
                    break;
            }

            setPosition({ top, left });

            // Scroll element into view
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

        // Small delay to ensure DOM is ready and animations finished
        const timer = setTimeout(updatePosition, 300);
        window.addEventListener('resize', updatePosition);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, currentStepIndex, currentStep]);

    if (!isOpen || !currentStep) return null;

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    return createPortal(
        <div className="tour-overlay">
            {/* Spotlight effect - using a massive border trick or separate divs */}
            {targetRect && (
                <div
                    className="tour-spotlight"
                    style={{
                        top: targetRect.top + window.scrollY,
                        left: targetRect.left + window.scrollX,
                        width: targetRect.width,
                        height: targetRect.height,
                    }}
                />
            )}

            {/* Tooltip */}
            <div
                className={`tour-tooltip placement-${currentStep.placement}`}
                style={{
                    top: position.top,
                    left: position.left,
                }}
            >
                <button className="tour-close-btn" onClick={onSkip}>
                    <X size={16} />
                </button>

                <div className="tour-content">
                    <h3 className="tour-title">{currentStep.title}</h3>
                    <p className="tour-text">{currentStep.content}</p>
                </div>

                <div className="tour-footer">
                    <div className="tour-progress">
                        {currentStepIndex + 1} de {steps.length}
                    </div>
                    <div className="tour-actions">
                        {currentStepIndex > 0 && (
                            <Button variant="ghost" size="sm" onClick={handlePrev}>
                                <ChevronLeft size={16} /> Anterior
                            </Button>
                        )}
                        <Button variant="primary" size="sm" onClick={handleNext}>
                            {currentStepIndex === steps.length - 1 ? 'Concluir' : 'Próximo'}
                            {currentStepIndex !== steps.length - 1 && <ChevronRight size={16} />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TourGuide;
