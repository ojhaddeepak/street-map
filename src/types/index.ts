import type { Feature, Geometry, GeoJsonProperties } from 'geojson';

export type ShapeType = 'Circle' | 'Rectangle' | 'Polygon' | 'LineString';

export interface AppConfig {
    maxShapes: Record<ShapeType, number>;
}

export interface DrawnFeature extends Feature<Geometry, GeoJsonProperties> {
    id: string;
    properties: {
        id: string;
        shapeType: ShapeType;
        radius?: number; // Only for circles
        createdAt: number;
    };
}
