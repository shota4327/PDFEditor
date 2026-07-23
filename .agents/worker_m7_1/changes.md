# Changes Log — Milestone M7

## Modified Files

1. `src/components/ThumbnailCard.tsx`
   - Replaced Framer Motion `<motion.div>` wrapper with a standard HTML `<div>` root element.
   - Merged `draggableProps.style` directly on the root `<div>` to avoid transform hijacking during drag-and-drop operations with `@hello-pangea/dnd`.
   - Removed Framer Motion `whileHover={{ y: ... }}` and rely on Tailwind `hover:shadow-md transition-shadow duration-200` to prevent transform conflicts.
   - Added optional prop `thumbnailHeight?: number` (default `192`) and styled thumbnail container `div` with inline `height: ${thumbnailHeight}px`.

2. `src/components/ThumbnailGrid.tsx`
   - Added optional prop `zoomLevel?: number` (default `100`).
   - Calculated `cardMinWidth = Math.round(200 * (zoomLevel / 100))` and `thumbnailHeight = Math.round(192 * (zoomLevel / 100))`.
   - Applied dynamic inline style `style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${cardMinWidth}px, 1fr))` }}` to the grid container, replacing fixed Tailwind grid-cols classes.
   - Passed `thumbnailHeight={thumbnailHeight}` to `ThumbnailCard`.

3. `src/components/Toolbar.tsx`
   - Updated `ToolbarProps` interface to accept `zoomLevel?: number`, `onZoomIn?: () => void`, `onZoomOut?: () => void`, `onZoomReset?: () => void`.
   - Imported `ZoomIn` and `ZoomOut` icons from `lucide-react`.
   - Added Zoom controls UI container with required test attributes:
     - `data-testid="zoom-controls"`
     - `data-testid="zoom-out-btn"` (disabled when `zoomLevel <= 50 || isProcessing`)
     - `data-testid="zoom-level-indicator"` (displaying `${zoomLevel}%`)
     - `data-testid="zoom-in-btn"` (disabled when `zoomLevel >= 200 || isProcessing`)
     - `data-testid="zoom-reset-btn"` (disabled when `zoomLevel === 100 || isProcessing`)

4. `src/App.tsx`
   - Added `const [zoomLevel, setZoomLevel] = useState<number>(100);` state.
   - Implemented `handleZoomIn` (+25%, max 200%), `handleZoomOut` (-25%, min 50%), `handleZoomReset` (set to 100%).
   - Passed `zoomLevel`, `onZoomIn`, `onZoomOut`, `onZoomReset` to `Toolbar`.
   - Passed `zoomLevel={zoomLevel}` to `ThumbnailGrid`.

5. `tests/unit/components.test.tsx`
   - Added unit test suite for Toolbar Zoom controls (buttons, indicator display, min/max disabled states, callback execution).
   - Added unit test verifying `ThumbnailCard` applies custom `thumbnailHeight`.
   - Added unit test verifying `ThumbnailGrid` computes and applies `gridTemplateColumns` minmax style dynamically based on `zoomLevel`.
