import React from 'react';
import { ExternalLink, Plus, Edit, ChevronDown, Trash2 } from 'lucide-react';
import { Card, Badge, Button } from '../ui';
import { getOfferStatusConfig } from '../../types';
import type { OfferMined, OfferStatus } from '../../types';
import './OfferMinedCard.css';

interface OfferMinedCardProps {
    offer: OfferMined;
    onIncrementAds: (offerId: string) => void;
    onEdit: (offer: OfferMined) => void;
    onChangeStatus: (offerId: string, status: OfferStatus) => void;
    onDelete?: (offerId: string) => void;
    showMentorActions?: boolean;
}

export const OfferMinedCard: React.FC<OfferMinedCardProps> = ({
    offer,
    onIncrementAds,
    onEdit,
    onChangeStatus,
    onDelete,
    showMentorActions = false,
}) => {
    const statusConfig = getOfferStatusConfig(offer.status);

    const getDaysSince = (date: Date) => {
        return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    };

    const daysSinceUpdate = getDaysSince(offer.lastTouchedAt);

    return (
        <Card className="offer-mined-card" padding="md" variant="interactive">
            {/* Header */}
            <div className="offer-header">
                <div className="offer-info">
                    <h3 className="offer-name">{offer.name}</h3>
                    <a
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="offer-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink size={12} />
                        Ver anúncio
                    </a>
                </div>
                <Badge
                    variant={
                        offer.status === 'WINNER' ? 'success' :
                            offer.status === 'TESTING' ? 'warning' :
                                offer.status === 'DISCARDED' ? 'default' :
                                    'info'
                    }
                    size="sm"
                >
                    {statusConfig?.label}
                </Badge>
            </div>

            {/* Ad Count - Big Badge */}
            <div className="offer-ad-count">
                <span className="ad-count-number">{offer.adCount}</span>
                <span className="ad-count-label">anúncios</span>
            </div>

            {/* Meta Info */}
            {offer.angles && offer.angles.length > 0 && (
                <div className="offer-angles">
                    {offer.angles.map((angle, i) => (
                        <span key={i} className="offer-angle">{angle}</span>
                    ))}
                </div>
            )}

            {offer.notes && (
                <p className="offer-notes">{offer.notes}</p>
            )}

            <div className="offer-meta">
                <span className="offer-platform">{offer.platform || 'META'}</span>
                <span className="offer-updated">
                    {daysSinceUpdate === 0 ? 'Hoje' : `${daysSinceUpdate}d atrás`}
                </span>
            </div>

            {/* Actions */}
            <div className="offer-actions">
                <Button
                    variant="secondary"
                    size="sm"
                    className="increment-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onIncrementAds(offer.id);
                    }}
                >
                    <Plus size={14} /> +1
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit size={14} />}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(offer);
                    }}
                />

                {offer.status === 'CANDIDATE' && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChangeStatus(offer.id, 'TESTING');
                        }}
                    >
                        Testar
                    </Button>
                )}

                {offer.status === 'TESTING' && (
                    <>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChangeStatus(offer.id, 'WINNER');
                            }}
                        >
                            ✓ Vencedora
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChangeStatus(offer.id, 'DISCARDED');
                            }}
                        >
                            Descartar
                        </Button>
                    </>
                )}

                {(showMentorActions && onDelete) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(offer.id);
                        }}
                    />
                )}
            </div>
        </Card>
    );
};

export default OfferMinedCard;
