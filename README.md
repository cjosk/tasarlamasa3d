# Neon Table Designer

A full-featured 3D neon tabletop designer built with React, Vite, Tailwind CSS, and react-three-fiber. Designers can compose glowing neon layouts, adjust glass reflections, toggle performance modes, and sync their creations to Firebase for sharing.

## ✨ Features
- **3D workspace** powered by react-three-fiber with neon emissive materials, bloom glow, and optional glass overlays.
- **Shape library** supporting neon lines, circles, text, and custom SVG uploads with transform controls for move, rotate, and scale.
- **Visual inspector** with live HEX color picker, intensity, glow radius, and thickness sliders.
- **Performance toggle** to switch between high-fidelity bloom and eco mode for lower-powered devices.
- **Authentication** with Firebase email/password and Google OAuth providers.
- **Cloud persistence** storing scene JSON and generated thumbnails in Firestore + Firebase Storage.
- **Export tools** for high-resolution PNG captures and GLB scene exports powered by the Three.js GLTF exporter.
- **Undo / redo history** and responsive UI that adapts to mobile with a floating save/share action bar.
- **Onboarding guide** highlighting the three essential steps to create and save a neon table.

## 🧱 Project Structure
```
index.html         # Root entry served by Vite (Option 2)
src/
  components/
    auth/          # Authentication modal and gate
    layout/        # App shell and responsive navigation
    modals/        # Save/share dialogs
    panels/        # Designer side panels and toggles
    three/         # R3F canvas, neon meshes, and materials
    toolbar/       # Shape + transform toolbar
    ui/            # Reusable UI helpers (loading, onboarding)
  pages/           # Landing, Designer, and Library views
  providers/       # Firebase + design context providers
  state/           # Zustand store for design + history
  types/           # Shared TypeScript types
  utils/           # Helper utilities (nanoid, exporters)
```

## ⚙️ Vite entry configuration options
The original scaffold placed `index.html` inside `src/`, which caused `npm run dev` to serve a 404. Vite looks for the HTML entry
at the configured project root, so you can resolve the issue in either of the following ways:

### Option 1 — keep `index.html` in `src/`
- Move `index.html` back into the `src` folder.
- Update `vite.config.ts` to point the dev server and build to that folder:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true
  },
  optimizeDeps: {
    include: ['three/examples/jsm/loaders/GLTFLoader']
  }
});
```

### Option 2 — move `index.html` to the project root *(current setup)*
- Place `index.html` at the repository root (as shown in the tree above).
- Use this `vite.config.ts` which preserves the standard root while keeping useful aliases and build outputs:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: '.',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  optimizeDeps: {
    include: ['three/examples/jsm/loaders/GLTFLoader']
  }
});
```

Either approach ensures `npm run dev` serves the designer at `http://localhost:5173` without a 404.

## 🚀 Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Duplicate `.env.example` to `.env.local`.
   - Populate your Firebase project credentials:
     ```env
     VITE_FIREBASE_API_KEY=...
     VITE_FIREBASE_AUTH_DOMAIN=...
     VITE_FIREBASE_PROJECT_ID=...
     VITE_FIREBASE_STORAGE_BUCKET=...
     VITE_FIREBASE_MESSAGING_SENDER_ID=...
     VITE_FIREBASE_APP_ID=...
     VITE_FIREBASE_MEASUREMENT_ID=...
     ```
   - Ensure Authentication (Email/Password + Google), Firestore, and Storage are enabled in the Firebase console.

3. **Run locally**
   ```bash
   npm run dev
   ```
   Vite serves the application at `http://localhost:5173` by default.

4. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## ☁️ Firebase Data Model
```
designs/{designId}
  owner: string (Firebase Auth UID)
  title: string
  public: boolean
  createdAt: timestamp
  updatedAt: timestamp
  sceneJSON: DesignStateData
  thumbnailPath: string
  thumbnailUrl: string

storage/
  design-thumbnails/{designId}.png
  exports/{designId}.glb (optional future use)
```

## 📦 Deployment
- The project is Vercel-ready out of the box. Connect the GitHub repository, configure environment variables, and deploy the default `work` branch.
- Remember to set the same Firebase environment variables in your Vercel project settings.

## 🧪 How to Test
- **Unit / integration tests** are not bundled, but linting can be run via:
  ```bash
  npm run lint
  ```
- **Manual QA checklist**
  - Sign in with email & Google.
  - Add shapes, adjust colors/intensity, and confirm neon glow renders with bloom.
  - Toggle transform modes and validate drag/rotate/scale interactions.
  - Enable/disable glass layer and tweak opacity/tint.
  - Use undo/redo to revert changes.
  - Toggle performance mode and ensure bloom responds.
  - Save the design, confirm thumbnail uploads, and reload from the library.
  - Export PNG and GLB and verify downloads open correctly.
  - Test mobile view (responsive layout, bottom action bar, transform gestures).

## 🧩 How to Extend
- **Add new neon primitives:** extend `ShapeKind` and render branch inside `NeonShapeMesh`.
- **Persist performance settings:** sync `performance` state to user preferences in Firestore.
- **Collaborative editing:** integrate Firestore real-time listeners to merge edits across clients.
- **Theming:** tweak Tailwind tokens in `tailwind.config.cjs` to support light/dark variants.
- **Automated testing:** add component tests with React Testing Library and visual regression with Playwright.

## 📄 License
MIT © 2025 Neon Table Designer contributors
