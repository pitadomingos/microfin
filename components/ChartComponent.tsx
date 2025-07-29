
import React, { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, ChartData, ChartOptions, DoughnutController, PieController, BarController, LineController } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend,
    DoughnutController, PieController, BarController, LineController
);

interface ChartComponentProps {
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    data: ChartData<any>;
    options?: ChartOptions<any>;
    height?: number;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ type, data, options, height }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const chartRef = useRef<ChartJS>(null);

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'class') {
                    const isDark = (mutation.target as HTMLElement).classList.contains('dark');
                    setIsDarkMode(isDark);
                }
            }
        });

        observer.observe(document.documentElement, { attributes: true });

        // Initial check
        setIsDarkMode(document.documentElement.classList.contains('dark'));
        
        return () => observer.disconnect();
    }, []);

    const defaultOptions: ChartOptions<any> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: isDarkMode ? '#e5e7eb' : '#374151',
                    font: { size: 12 }
                }
            },
            tooltip: {
                backgroundColor: isDarkMode ? '#374151' : '#fff',
                titleColor: isDarkMode ? '#e5e7eb' : '#333',
                bodyColor: isDarkMode ? '#e5e7eb' : '#666',
            }
        },
        scales: type === 'bar' || type === 'line' ? {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                }
            },
            y: {
                grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                }
            }
        } : {},
    };

    const mergedOptions = { ...defaultOptions, ...options };

    useEffect(() => {
        const chart = chartRef.current;
        if (chart) {
            if (chart.options.plugins?.legend?.labels) {
                chart.options.plugins.legend.labels.color = isDarkMode ? '#e5e7eb' : '#374151';
            }
            if(chart.options.scales?.x?.ticks) chart.options.scales.x.ticks.color = isDarkMode ? '#9ca3af' : '#6b7280';
            if(chart.options.scales?.y?.ticks) chart.options.scales.y.ticks.color = isDarkMode ? '#9ca3af' : '#6b7280';
            chart.update();
        }
    }, [isDarkMode]);
    
    return (
        <div style={{ position: 'relative', height: `${height || 300}px` }}>
            <Chart ref={chartRef} type={type} data={data} options={mergedOptions} />
        </div>
    );
};

export default ChartComponent;
