/**
 * Export data to CSV format
 * @param data - Array of objects to export
 * @param filename - Name of the file to download
 * @param headers - Optional custom headers (if not provided, uses object keys)
 */
export const exportToCSV = (data: any[], filename: string, headers?: string[]): void => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);

    // Create CSV content
    const csvRows = [];

    // Add header row
    csvRows.push(csvHeaders.join(','));

    // Add data rows
    data.forEach(row => {
        const values = csvHeaders.map(header => {
            const value = row[header];

            // Handle different types
            if (value === null || value === undefined) return '';
            if (value instanceof Date) return value.toISOString();

            // Escape commas and quotes in strings
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }

            return stringValue;
        });

        csvRows.push(values.join(','));
    });

    // Create blob and download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

/**
 * Format transaction data for export
 */
export const formatTransactionsForExport = (transactions: any[]) => {
    return transactions.map(t => ({
        'ID': t.id,
        'Mentorado': t.menteeName || 'N/A',
        'Valor': t.amount,
        'Status': t.status,
        'Vencimento': t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : '',
        'Pagamento': t.paidAt ? new Date(t.paidAt).toLocaleDateString('pt-BR') : '',
        'Tipo': t.type || 'PAYMENT',
        'Descrição': t.description || ''
    }));
};

/**
 * Format deals data for export
 */
export const formatDealsForExport = (deals: any[]) => {
    return deals.map(d => ({
        'Lead': d.leadName,
        'WhatsApp': d.leadWhatsapp,
        'Oferta': d.offerName,
        'Valor': d.pitchAmount,
        'Estágio': d.stage,
        'Heat': d.heat,
        'Criado': d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-BR') : '',
        'Atualizado': d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('pt-BR') : ''
    }));
};

/**
 * Format mentees data for export
 */
export const formatMenteesForExport = (mentees: any[]) => {
    return mentees.map(m => ({
        'Nome': m.name,
        'Email': m.email || '',
        'WhatsApp': m.whatsapp || '',
        'Estágio': m.currentStage,
        'Início': m.startAt ? new Date(m.startAt).toLocaleDateString('pt-BR') : '',
        'Atualização': m.lastUpdateAt ? new Date(m.lastUpdateAt).toLocaleDateString('pt-BR') : '',
        'Status': m.blocked ? 'Bloqueado' : 'Ativo'
    }));
};
