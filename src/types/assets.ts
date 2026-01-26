export type AssetType = 'PROFILE' | 'PAGE' | 'BM' | 'AD_ACCOUNT' | 'PIXEL' | 'DOMAIN';
export type AssetStatus = 'WARMING' | 'ACTIVE' | 'RESTRICTED' | 'PERMANENT_BAN' | 'REVIEW';

export interface Asset {
    id: string;
    userId: string; // Owner
    type: AssetType;
    name: string;
    status: AssetStatus;

    // Details
    login?: string; // For Profiles
    password?: string; // Encrypted/Hint
    proxy?: string; // IP
    userAgent?: string;

    // Relationships
    parentId?: string; // e.g. Ad Account belongs to BM
    linkedAssetIds?: string[]; // Generic links

    // Financial
    spendLimit?: number;
    totalSpent?: number;
    currency?: string;

    // Health
    healthScore: number; // 0-100
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

    notes?: string;
    purchaseDate?: Date;
    replacementDate?: Date; // When it was replaced after ban

    createdAt: Date;
    updatedAt: Date;
}

// Helper to get friendly names
export const getAssetLabel = (type: AssetType) => {
    switch (type) {
        case 'PROFILE': return 'Perfil (Facebook)';
        case 'PAGE': return 'Página (Fanpage)';
        case 'BM': return 'Business Manager';
        case 'AD_ACCOUNT': return 'Conta de Anúncio';
        case 'PIXEL': return 'Pixel';
        case 'DOMAIN': return 'Domínio';
    }
};

export const getAssetIcon = (type: AssetType) => {
    // This will be used in UI components, just a placeholder thought
    return type;
};
