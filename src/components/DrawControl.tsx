import { useEffect, useState, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import * as turf from '@turf/turf';
import { v4 as uuidv4 } from 'uuid';
import type { ShapeType, DrawnFeature } from '../types';
import { resolveOverlap, checkEnclosure } from '../utils/geoUtils';

interface DrawControlProps {
    mode: ShapeType | null;
    onFeatureCreated: (feature: DrawnFeature) => void;
    onError: (msg: string) => void;
    features: DrawnFeature[];
}

const DrawControl = ({ mode, onFeatureCreated, onError, features }: DrawControlProps) => {
    const map = useMap();
    const [, setPoints] = useState<L.LatLng[]>([]);
    const [tempShape, setTempShape] = useState<L.Layer | null>(null);
    const pointsRef = useRef<L.LatLng[]>([]); // Ref for latest state in event handlers

    // Clear temp shape when mode changes
    useEffect(() => {
        setPoints([]);
        pointsRef.current = [];
        if (tempShape) {
            map.removeLayer(tempShape);
            setTempShape(null);
        }
    }, [mode, map]);

    useMapEvents({
        click(e: LeafletMouseEvent) {
            if (!mode) return;

            const newPoints = [...pointsRef.current, e.latlng];
            pointsRef.current = newPoints;
            setPoints(newPoints);

            if (mode === 'Circle') {
                // First click sets center, waiting for second click to define radius ??
                // Actually, let's do: Click center, then Move to radius, Click to finish.
                if (newPoints.length === 2) {
                    finishShape(newPoints);
                }
            } else if (mode === 'Rectangle') {
                // Corner 1, Corner 2
                if (newPoints.length === 2) {
                    finishShape(newPoints);
                }
            } else if (mode === 'Polygon' || mode === 'LineString') {
                // Handled, keeps adding points. User must finish explicitly (e.g. dblclick or close loop).
                // Let's rely on double-click to finish for simplicity?
                // But double-click also zooms.
                // Alternative: Click first point to close Polygon.
            }
        },
        mousemove(e: LeafletMouseEvent) {
            if (!mode || pointsRef.current.length === 0) return;

            const currentPoints = pointsRef.current;
            const mousePos = e.latlng;

            // Visualize current shape being drawn
            let layer: L.Layer | null = null;

            if (mode === 'Circle') {
                const center = currentPoints[0];
                const radius = center.distanceTo(mousePos);
                layer = L.circle(center, { radius, color: '#3388ff' });
            } else if (mode === 'Rectangle') {
                const start = currentPoints[0];
                const bounds = L.latLngBounds(start, mousePos);
                layer = L.rectangle(bounds, { color: '#3388ff' });
            } else if (mode === 'Polygon') {
                layer = L.polygon([...currentPoints, mousePos], { color: '#3388ff' });
            } else if (mode === 'LineString') {
                layer = L.polyline([...currentPoints, mousePos], { color: '#3388ff' });
            }

            if (layer) {
                if (tempShape) map.removeLayer(tempShape);
                layer.addTo(map);
                setTempShape(layer);
            }
        },
        contextmenu() {
            // Right click to finish Polygon/LineString
            if ((mode === 'Polygon' || mode === 'LineString') && pointsRef.current.length > 2) {
                finishShape(pointsRef.current);
            }
        }
    });

    const finishShape = (finalPoints: L.LatLng[]) => {
        if (!mode) return;

        let geometry: any;
        let radius: number | undefined;

        if (mode === 'Circle') {
            const center = finalPoints[0];
            radius = center.distanceTo(finalPoints[1]);
            // Convert to Polygon for consistency using turf
            const options = { steps: 64, units: 'kilometers' as const };
            const poly = turf.circle([center.lng, center.lat], radius / 1000, options);
            geometry = poly.geometry;
        } else if (mode === 'Rectangle') {
            const bounds = L.latLngBounds(finalPoints[0], finalPoints[1]);
            const poly = turf.bboxPolygon([
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getNorth()
            ]);
            geometry = poly.geometry;
        } else if (mode === 'Polygon') {
            // Close the loop
            const latlngs = finalPoints.map(p => [p.lng, p.lat]);
            if (latlngs[0][0] !== latlngs[latlngs.length - 1][0] || latlngs[0][1] !== latlngs[latlngs.length - 1][1]) {
                latlngs.push(latlngs[0]);
            }
            geometry = { type: 'Polygon', coordinates: [latlngs] };
        } else if (mode === 'LineString') {
            geometry = {
                type: 'LineString',
                coordinates: finalPoints.map(p => [p.lng, p.lat])
            };
        }

        const feature: DrawnFeature = {
            type: 'Feature',
            id: uuidv4(),
            geometry,
            properties: {
                id: uuidv4(),
                shapeType: mode,
                createdAt: Date.now(),
                ...(radius ? { radius } : {})
            }
        };

        // Validate and Trim if polygon
        if (mode !== 'LineString') {
            const enclosureError = checkEnclosure(feature as any, features);
            if (enclosureError) {
                onError(enclosureError);
                reset();
                return;
            }

            const trimmed = resolveOverlap(feature as any, features);
            if (!trimmed) {
                onError("Shape completely overlaps existing shape.");
                reset();
                return;
            }
            feature.geometry = trimmed.geometry;
        }

        onFeatureCreated(feature);
        reset();
    };

    const reset = () => {
        setPoints([]);
        pointsRef.current = [];
        if (tempShape) {
            map.removeLayer(tempShape);
            setTempShape(null);
        }
    };

    return null;
};

export default DrawControl;
