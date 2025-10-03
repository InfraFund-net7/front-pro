'use client';
import PowerBIEmbed from '../../components/PowerBIEmbed';

export default function EarnedValuePage() {
    const reportId = '2bfcg54d-e11e-44a9-8c14-1374af9530ba';
    const workspaceId = '4d74333d-77aa-461f-85e7-e125a9782e07';

    return (
        <main style={{ padding: '20px' }}>
            <h1 style={{ textAlign: 'center', color: '#007bff' }}>Earned Value Analysis - Test with Sample Token</h1>
            <PowerBIEmbed reportId={reportId} workspaceId={workspaceId} />
        </main>
    );
}