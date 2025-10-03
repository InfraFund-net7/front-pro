'use client';
import React, { useState, useEffect } from 'react';
import { PowerBIEmbed as PowerBIEmbedComponent } from 'powerbi-client-react';  // درست: PowerBIEmbed (named export)
import * as pbijs from 'powerbi-client';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface PowerBIEmbedProps {
    reportId: string;
    workspaceId: string;
}

interface KPI {
    title: string;
    value: number;
    color: string;
}

const PowerBIEmbedContainer: React.FC<PowerBIEmbedProps> = ({ reportId, workspaceId }) => {
    const [embedConfig, setEmbedConfig] = useState<pbijs.IEmbedConfiguration | null>(null);
    const [useFallback, setUseFallback] = useState<boolean>(false);

    useEffect(() => {
        // Sample Token از Microsoft Docs (برای تست – fake اما demo-ready)
        const sampleToken = 'H4sI....AAA='; // از مثال REST API

        // مستقیم config ست کن (بدون API route)
        setEmbedConfig({
            type: 'report',
            id: reportId,
            groupId: workspaceId,
            embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`,
            accessToken: sampleToken,
            tokenType: pbijs.models.TokenType.Embed,
            settings: {
                panes: { filters: { expanded: false, visible: true } },
                background: pbijs.models.BackgroundType.Transparent,
            },
        });
    }, [reportId, workspaceId]);

    // Fallback Data (شبیه BEXEL Sample)
    const sCurveData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Planned Value (PV)',
                data: [0, 83333, 166667, 250000, 333333, 416667, 500000, 583333, 666667, 750000, 833333, 1000000],
                borderColor: '#007bff',
                fill: false,
            },
            {
                label: 'Earned Value (EV)',
                data: [0, 80000, 160000, 240000, 320000, 400000, 480000, 560000, 640000, 720000, 800000, 950000],
                borderColor: '#28a745',
                fill: false,
            },
            {
                label: 'Actual Cost (AC)',
                data: [0, 85000, 170000, 260000, 350000, 430000, 520000, 600000, 680000, 770000, 860000, 1020000],
                borderColor: '#dc3545',
                fill: false,
            },
        ],
    };

    const sCurveOptions = {
        responsive: true,
        plugins: { title: { display: true, text: 'EVA S-Curve (BEXEL Sample Model)' } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Value (USD)' } } },
    };

    const varianceData = {
        labels: ['SV', 'CV'],
        datasets: [
            {
                label: 'Variance (USD)',
                data: [-50000, -70000],
                backgroundColor: ['#ffc107', '#dc3545'],
            },
        ],
    };
    const varianceOptions = {
        responsive: true,
        plugins: { title: { display: true, text: 'Schedule & Cost Variances' } },
    };

    const kpis: KPI[] = [
        { title: 'CPI', value: 0.93, color: '#dc3545' },
        { title: 'SPI', value: 0.95, color: '#ffc107' },
        { title: 'SV', value: -50000, color: '#ffc107' },
        { title: 'CV', value: -70000, color: '#dc3545' },
    ];

    if (useFallback || !embedConfig) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', fontFamily: 'Arial' }}>
                <h1 style={{ textAlign: 'center', color: '#007bff' }}>Earned Value Analysis - BEXEL Replica (Fallback)</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    {kpis.map((kpi, i) => (
                        <div
                            key={i}
                            style={{
                                backgroundColor: kpi.color,
                                color: 'transparent',
                                padding: '10px',
                                textAlign: 'center',
                                borderRadius: '5px',
                            }}
                        >
                            <h3>{kpi.title}</h3>
                            <p>{kpi.value}</p>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                    <div style={{ height: '400px' }}>
                        <Line data={sCurveData} options={sCurveOptions} />
                    </div>
                    <div style={{ height: '400px' }}>
                        <Bar data={varianceData} options={varianceOptions} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '80vh', width: '100%' }}>
            <PowerBIEmbedComponent 
                embedConfig={embedConfig}
                cssClassName="EVAReport"
                eventHandlers={new Map([
                    ['error', () => {
                        console.log('Power BI Error - Switching to Fallback');
                        setUseFallback(true);
                    }],
                    ['loaded', () => console.log('Power BI Loaded Successfully')],
                ])}
                getEmbeddedComponent={(report: any) => {
                    console.log('Report Instance:', report);
                }}
            />
        </div>
    );
};

export default PowerBIEmbedContainer;