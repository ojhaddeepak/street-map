import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { ShapeType, DrawnFeature } from './types';
import Toolbar from './components/Toolbar';
import DrawControl from './components/DrawControl';
import { TOOLS_CONFIG } from './utils/geoUtils';
import L from 'leaflet';
// Removed unused Download import

// Fix leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [features, setFeatures] = useState<DrawnFeature[]>([]);
  const [mode, setMode] = useState<ShapeType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    features.forEach(f => {
      const type = f.properties.shapeType;
      c[type] = (c[type] || 0) + 1;
    });
    return c as Record<ShapeType, number>;
  }, [features]);

  const handleFeatureCreated = (feature: DrawnFeature) => {
    setFeatures(prev => [...prev, feature]);
    setMode(null); // Exit mode after draw
  };

  const handleExport = () => {
    const collection = {
      type: 'FeatureCollection',
      features: features
    };
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'features.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-dismiss error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Toolbar
        currentMode={mode}
        setMode={setMode}
        onExport={handleExport}
        counts={counts}
        maxConfig={TOOLS_CONFIG}
      />

      {error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ef4444',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          zIndex: 2000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '10px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DrawControl
          mode={mode}
          features={features}
          onFeatureCreated={handleFeatureCreated}
          onError={(msg) => setError(msg)}
        />

        {/* Render Features */}
        {features.map((f) => (
          <GeoJSON
            key={f.id}
            data={f}
            style={() => ({
              color: f.properties.shapeType === 'LineString' ? '#f59e0b' : '#3b82f6',
              weight: 3,
              fillOpacity: 0.2
            })}
          />
        ))}
      </MapContainer>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'rgba(255,255,255,0.8)',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        pointerEvents: 'none'
      }}>
        {mode ? `Drawing: ${mode} (Right click to finish Polygon/Line)` : 'Select a tool to start drawing'}
      </div>
    </div>
  );
}

export default App;
