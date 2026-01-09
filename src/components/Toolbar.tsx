import React from 'react';
import { Circle, Square, Hexagon, Component, Download } from 'lucide-react';
import type { ShapeType } from '../types';

interface ToolbarProps {
    currentMode: ShapeType | null;
    setMode: (mode: ShapeType | null) => void;
    onExport: () => void;
    counts: Record<ShapeType, number>;
    maxConfig: Record<ShapeType, number>;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentMode, setMode, onExport, counts, maxConfig }) => {
    const tools: { id: ShapeType; icon: React.ElementType; label: string }[] = [
        { id: 'Circle', icon: Circle, label: 'Circle' },
        { id: 'Rectangle', icon: Square, label: 'Rectangle' },
        { id: 'Polygon', icon: Hexagon, label: 'Polygon' },
        { id: 'LineString', icon: Component, label: 'LineString' },
    ];

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 1000,
            background: 'white',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: 'black'
        }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>Tools</h3>
            {tools.map((tool) => {
                const count = counts[tool.id] || 0;
                const max = maxConfig[tool.id];
                const disabled = count >= max;

                return (
                    <button
                        key={tool.id}
                        onClick={() => setMode(currentMode === tool.id ? null : tool.id)}
                        disabled={disabled && currentMode !== tool.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px',
                            background: currentMode === tool.id ? '#e0e7ff' : disabled ? '#f3f4f6' : 'transparent',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            color: disabled ? '#9ca3af' : 'inherit'
                        }}
                        title={disabled ? `Limit reached (${max})` : tool.label}
                    >
                        <tool.icon size={18} />
                        <span style={{ fontSize: '12px' }}>{tool.label} ({count}/{max})</span>
                    </button>
                );
            })}

            <hr style={{ margin: '4px 0', border: '0', borderTop: '1px solid #eee' }} />

            <button
                onClick={onExport}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                <Download size={18} />
                <span style={{ fontSize: '12px' }}>Export GeoJSON</span>
            </button>
        </div>
    );
};

export default Toolbar;
