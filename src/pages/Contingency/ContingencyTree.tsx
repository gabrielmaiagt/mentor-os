import React, { useMemo } from 'react';
import type { Asset, AssetType } from '../../types/assets';
import { User, Server, CreditCard, Activity, Globe, Shield } from 'lucide-react';
import './ContingencyTree.css';

interface ContingencyTreeProps {
    assets: Asset[];
}

// Recursive Tree Node Component
const TreeNode: React.FC<{ asset: Asset; allAssets: Asset[]; level: number }> = ({ asset, allAssets, level }) => {
    // Find children: Assets where parentId === asset.id
    const children = allAssets.filter(a => a.parentId === asset.id);

    const getIcon = (type: AssetType) => {
        switch (type) {
            case 'PROFILE': return <User size={20} />;
            case 'BM': return <Server size={20} />;
            case 'AD_ACCOUNT': return <CreditCard size={20} />;
            case 'PIXEL': return <Activity size={20} />;
            case 'DOMAIN': return <Globe size={20} />;
            default: return <Shield size={20} />;
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'ACTIVE') return 'text-success border-success';
        if (status === 'WARMING') return 'text-warning border-warning';
        return 'text-error border-error opacity-50';
    };

    return (
        <div className="tree-node flex flex-col items-center">
            {/* The Node Card */}
            <div className={`
                relative z-10 flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-neutral-900 
                ${getStatusColor(asset.status)} transition-all hover:scale-105 cursor-pointer shadow-xl
                min-w-[200px] justify-between
            `}>
                <div className="flex items-center gap-3">
                    {getIcon(asset.type)}
                    <div className="text-left">
                        <p className="font-bold text-sm text-white">{asset.name}</p>
                        <p className="text-[10px] uppercase font-mono tracking-wider opacity-70">{asset.status}</p>
                    </div>
                </div>
            </div>

            {/* Connector Line to Children */}
            {children.length > 0 && (
                <div className="flex flex-col items-center w-full">
                    {/* Vertical line down from parent */}
                    <div className="h-8 w-0.5 bg-neutral-700"></div>

                    {/* Horizontal bar branching to children */}
                    <div className="relative w-full flex justify-center">
                        {children.length > 1 && (
                            <div className="absolute top-0 h-0.5 bg-neutral-700"
                                style={{
                                    width: `calc(100% - ${100 / children.length}%)`,
                                    left: `calc(${50 / children.length}%)`
                                }}
                            />
                        )}

                        {/* Children Container */}
                        <div className="flex w-full justify-around pt-0">
                            {children.map(child => (
                                <div key={child.id} className="flex flex-col items-center w-full relative">
                                    {/* Connector from horizontal bar to child */}
                                    {/* <div className="h-4 w-0.5 bg-neutral-700 absolute -top-0"></div> */}
                                    <TreeNode asset={child} allAssets={allAssets} level={level + 1} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const ContingencyTree: React.FC<ContingencyTreeProps> = ({ assets }) => {
    // Roots are typically Profiles (or assets with no parentId)
    // We prioritize Profiles as roots for this view
    const roots = useMemo(() => {
        const potentialRoots = assets.filter(a => !a.parentId && a.type === 'PROFILE');
        // Fallback: If no profiles, look for any orphans
        if (potentialRoots.length === 0) return assets.filter(a => !a.parentId);
        return potentialRoots;
    }, [assets]);

    if (assets.length === 0) return (
        <div className="text-center p-12 text-secondary">
            Nenhum ativo para visualizar.
        </div>
    );

    return (
        <div className="contingency-tree-container overflow-x-auto p-8 rounded-2xl bg-neutral-950/50 border border-white/5 min-h-[400px] scrollbar-thin">
            <div className="flex gap-16 min-w-max justify-center">
                {roots.map(root => (
                    <div key={root.id} className="flex-1">
                        <TreeNode asset={root} allAssets={assets} level={0} />
                    </div>
                ))}
            </div>
        </div>
    );
};
