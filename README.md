# Casa 3D

Maqueta 3D interactiva del piso (primera planta sobre un garaje), migrada de
`casa-3d.html` (Three.js r128) a Next.js + React Three Fiber.

```bash
npm install
npm run dev        # http://localhost:3000/casa
```

Comprobaciones: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dónde está cada cosa

- `lib/casa3d/plan.ts`: toda la distribución (muros, huecos, muebles, vistas) en
  píxeles del plano original, 1:1 con `casa-3d.html`. Para mover algo, se edita aquí.
- `lib/casa3d/units.ts`: conversión px → m (119 px = 1 m, origen en (78, 68)).
- `lib/casa3d/parcel.ts`: la parcela en unidades del boceto `plano-parcela.html`
  (1:1 con el SVG), cotas, cerramiento y escalera exterior. El boceto no tiene
  escala: se encaja estirando su rectángulo «Casa» sobre la huella real, girado
  90° (arriba del boceto = SO). `parcelShapes.ts` lo convierte en geometría.
- `lib/casa3d/shapes.ts` y `solids.ts`: helpers puros (equivalentes a `B()`,
  `box()`, `cyl()`, `wall()`) y las listas de sólidos de cada grupo.
- `lib/casa3d/sun.ts`: cálculo solar para Madrid y conversión de intensidades.
- `lib/casa3d/textures.ts` y `materials.ts`: texturas de canvas con semilla y
  materiales compartidos.
- Modo videojuego: `quality.ts` (relieves generados, brillos, barniz y tela),
  `pbr.ts` (texturas fotografiadas por material), `reflection.ts` (reflejos del
  suelo y la piscina) y `components/casa3d/GameMode.tsx`. Las texturas están en
  `public/texturas/` y se rehacen con `node scripts/texturas.mjs` (CC0 de
  Poly Haven y ambientCG; el script dice de dónde sale cada una).
- `components/casa3d/`: escena (R3F) y UI. `app/casa/page.tsx`: la página.
- Fotos: `PHOTOS` en `plan.ts` (posición e imagen en `public/fotos/`).

`casa-3d.html` se conserva en la raíz como referencia.
