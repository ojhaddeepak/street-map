# OpenStreetMap Drawing App

A React + TypeScript application for drawing and managing spatial features on an OpenStreetMap base layer. This project demonstrates handling of complex spatial constraints like non-overlapping polygons and enclosure detection using Turf.js.

## 🚀 Features

- **Map Rendering**: Smooth interactive map using Leaflet and OpenStreetMap tiles.
- **Drawing Tools**: Support for Circles, Rectangles, Polygons, and LineStrings.
- **Spatial Constraints**:
  - **Auto-trimming**: Polygons that overlap existing shapes are automatically trimmed (subtracted) to prevent overlap.
  - **Enclosure Protection**: Prevents drawing polygons that completely enclose or are enclosed by existing polygons.
  - **LineString Exception**: LineStrings are free from overlap constraints.
- **Dynamic Limits**: Configurable maximum number of shapes per type.
- **Export**: Download all drawn features as a standard GeoJSON file.

## 🛠️ Setup & Run

1.  **Clone the repository** (if applicable) or download the source.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npm run dev
    ```
4.  Open the URL shown in the terminal (usually `http://localhost:5173`) in your browser.

## 🧠 Polygon Overlap Logic

The application enforces a "Non-overlapping rule" for polygonal features (Circle, Rectangle, Polygon). This is implemented using `turf.js` operations in `src/utils/geoUtils.ts`.

### Algorithm:
1.  **Conversion**: Circles and Rectangles are converted to GeoJSON Polygons immediately upon drawing.
2.  **Enclosure Check**: Before resolving overlaps, we check if the new shape is fully inside an existing one (`turf.booleanWithin`) or fully contains an existing one (`turf.booleanContains`). If true, the action is blocked with an error.
3.  **Overlap Resolution (Auto-trim)**:
    - We iterate through all existing polygons.
    - If the new polygon intersects an existing one (`turf.booleanIntersects`), we calculate the **difference** (`turf.difference`).
    - The new polygon is replaced by this "trimmed" version.
    - If the new polygon is completely consumed (result is null), the drawing is cancelled.

## 📂 Sample GeoJSON Export

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "uuid-1",
      "properties": {
        "id": "uuid-1",
        "shapeType": "Rectangle",
        "createdAt": 1709923200000
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-0.1, 51.5],
            [-0.09, 51.5],
            [-0.09, 51.51],
            [-0.1, 51.51],
            [-0.1, 51.5]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": "uuid-2",
      "properties": {
        "id": "uuid-2",
        "shapeType": "LineString",
        "createdAt": 1709923250000
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-0.08, 51.5],
          [-0.085, 51.52]
        ]
      }
    }
  ]
}
```

## 📦 Dependencies

- **React 19**: UI Framework
- **TypeScript**: Static typing
- **Leaflet / React-Leaflet**: Mapping library
- **Turf.js**: Geospatial analysis and boolean operations
- **Uuid**: Unique identifier generation
- **Lucide-react**: Icons
- **Vite**: Build tool

## 🎨 Project Structure

- `src/components`: UI components (`MapContainer`, `Toolbar`, `DrawControl`)
- `src/utils`: Geometry helpers (`geoUtils.ts`)
- `src/types`: TypeScript definitions
- `src/hooks`: Custom hooks
