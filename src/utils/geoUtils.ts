import * as turf from '@turf/turf';
import type { DrawnFeature, ShapeType } from '../types';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

export const TOOLS_CONFIG: Record<ShapeType, number> = {
    Circle: 5,
    Rectangle: 5,
    Polygon: 10,
    LineString: 10
};

/**
 * Checks if a feature fully encloses another or is enclosed by another.
 * Returns error string if invalid.
 */
export function checkEnclosure(
    newPoly: Feature<Polygon | MultiPolygon>,
    existingFeatures: DrawnFeature[]
): string | null {
    const polygons = existingFeatures.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') as Feature<Polygon | MultiPolygon>[];

    for (const existing of polygons) {
        // Check if new falls completely inside existing
        if (turf.booleanWithin(newPoly, existing)) {
            return 'Cannot place a polygon completely inside another.';
        }
        // Check if existing falls completely inside new
        if (turf.booleanContains(newPoly, existing)) {
            return 'Cannot enclose an existing polygon.';
        }
    }
    return null;
}

/**
 * Resolves overlaps by trimming the new polygon against existing ones.
 * Returns the modified feature or null if it was completely removed.
 */
export function resolveOverlap(
    newPoly: Feature<Polygon | MultiPolygon>,
    existingFeatures: DrawnFeature[]
): Feature<Polygon | MultiPolygon> | null {
    let currentPoly = newPoly;

    const polygons = existingFeatures.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') as Feature<Polygon | MultiPolygon>[];

    for (const existing of polygons) {
        try {
            // Check intersection first to avoid unnecessary diff ops
            if (turf.booleanIntersects(currentPoly, existing)) {
                const diff = turf.difference(turf.featureCollection([currentPoly, existing]));
                if (!diff) return null; // Fully consumed
                currentPoly = diff as Feature<Polygon | MultiPolygon>;
            }
        } catch (e) {
            console.error('GeoUtils Error:', e);
            // In case of turf errors (sometimes usually precision), we keep going? or fail?
            // Safer to fail restrictive.
            // return null; 
        }
    }

    return currentPoly;
}
