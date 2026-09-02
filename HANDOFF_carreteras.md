# Handoff: red de carreteras y tránsito en Cappilingua

Contexto para Claude Code. El asset ya está hecho; falta la integración
en Three.js.

---

## 1. Qué contiene `road_tiles.glb`

Tres mallas independientes, todas con **origen en (0,0,0)** y footprint de
**20 × 20 unidades** (exactamente `CHUNK_SIZE`):

| Malla | Descripción |
|---|---|
| `tile_road_straight` | recta, corre a lo largo del eje Z |
| `tile_road_curve` | curva de 90°, conecta el borde +Z con el borde +X |
| `tile_road_cross` | cruce en X, cuatro brazos |

Geometría, en unidades de mundo:

- Asfalto: 8 de ancho, centrado en el eje del tile, a `y = 0.02`
- Aceras: 3 de ancho a cada lado, altura `y = 0.15`
- Margen: 3 a cada lado, **no modelado** (ahí se ve el plano de `Floor.js`)
- Ejes de carril: `±2` respecto al centro del tile
- Curva: línea central a radio 10 con centro en la esquina del tile;
  asfalto de radio 6 a 14; aceras de 3 a 6 y de 14 a 17

Todas comparten **un solo material** con el atlas 1024×1024 y el normal
map. Los tres tiles ocupan regiones distintas del atlas, así que se
pueden fusionar en una sola geometría sin tocar las UVs.

---

## 2. El grid existente (no modificar)

De `ChunkGrid.js` / `Floor.js`:

```
CHUNK_SIZE = 20
GRID_DIM   = 10
MAP_SIZE   = 200        // mapa de -100 a +100 en X y Z
```

Centro de la celda `(cx, cz)`:

```js
const cellCenter = c => (c - 4.5) * 20;
// celda (0,0) -> (-90, -90);  celda (9,9) -> (90, 90)
```

**Ojo con el factor 0.94 de `Chunk.js`.** Ese margen de 1.2 unidades es
para ver la separación del grid en desarrollo. La carretera **no debe
heredarlo**: si lo hace, aparece un corte de 1.2 unidades de asfalto cada
20 unidades y en una línea continua se nota muchísimo. La carretera va en
su propia capa, apoyada sobre el plano de 200×200 de `Floor.js`.

---

## 3. La carretera NO se streamea

Con avenidas cada 3 celdas quedan unas 30 celdas de carretera. Fusionadas
en un solo `BufferGeometry` son ~4.000 triángulos y **un draw call**.

Cargar todo de una vez cuesta menos que la lógica para streamearlo, y
elimina de raíz el pop-in que aparece con `LOAD_RADIUS = 1`.

Referencia del problema: con `FRUSTUM_SIZE = 20` y elevación isométrica de
35.264°, la huella de cámara sobre el suelo mide `20 / sin(35.264°) ≈ 34.6`
unidades a zoom 1, y `≈ 69` a `ZOOM_MIN = 0.5`. El 3×3 de `LOAD_RADIUS = 1`
solo garantiza 20 unidades cargadas en la peor dirección.

**Tareas:**

- Subir `LOAD_RADIUS` a 2 (5×5 = 25 chunks) para **los edificios**.
- La carretera: cargar completa al inicio, fuera del sistema de chunks.

---

## 4. Layout propuesto

Avenidas en los índices de celda **2, 5 y 8**, en ambos ejes. Da 3
avenidas por eje, 9 intersecciones, y manzanas de 2×2 chunks (40×40
unidades) para los edificios.

El layout debe ser una matriz 10×10 de `{ tipo, rotación }`, no código
imperativo. Tipos: `STRAIGHT_NS`, `STRAIGHT_EW`, `CURVE`, `CROSS`, `NONE`.

**Orientación base:** verificar visualmente una vez cuál es la orientación
del tile recto y de la curva al cargar el `.glb`, y derivar las otras tres
rotaciones desde ahí (`rotation.y = k * Math.PI / 2`). La conversión Y-up
del exportador de glTF mapea el eje Y de Blender al `-Z` de Three, así que
no conviene asumir el signo: es más rápido comprobarlo que deducirlo.

Rotar un objeto no altera sus UVs, así que la región del atlas se mantiene
correcta en las cuatro orientaciones.

---

## 5. Material

```js
const mat = new THREE.MeshStandardMaterial({
  map: atlas,
  normalMap: normal,
  roughness: 0.9,
  metalness: 0.0,
});
```

- `atlas.magFilter = THREE.NearestFilter` — **obligatorio**. Con filtrado
  bilineal, los bordes de una región del atlas chupan píxeles de la región
  vecina y aparece asfalto del cruce en la orilla del tile recto.
- El **normal map SÍ va con filtrado lineal** (el default). Con
  `NearestFilter` las juntas de las losas salen dentadas.
- El normal map necesita **al menos una luz direccional** en la escena. Con
  `MeshBasicMaterial` o sin luces se ignora por completo.
- Las tangentes vienen en el `.glb`. Si el loader se queja, revisar que el
  export se hizo con `export_tangents=True`.

---

## 6. Tránsito

**Los carriles no se derivan de la geometría.** Son datos aparte: una
polilínea de puntos que alimenta un `CatmullRomCurve3`. No hacer raycast
contra la malla de la carretera.

Circulación **por la derecha** (Corea). Para una avenida N-S en la columna
`cx`, con `x0 = cellCenter(cx)`:

- carril hacia `+Z`: `x = x0 + 2`
- carril hacia `-Z`: `x = x0 - 2`

Para el MVP: definir 2 o 3 rutas cerradas a mano como arreglos de puntos
derivados de los centros de celda. No construir un grafo todavía.

```js
const path = new THREE.CatmullRomCurve3(puntos, true);
// por auto, cada frame:
//   t += speed * dt
//   p   = path.getPointAt(t % 1)
//   tan = path.getTangentAt(t % 1)
//   dummy.position.copy(p)
//   dummy.lookAt(p.clone().add(tan))
//   dummy.updateMatrix()
//   mesh.setMatrixAt(i, dummy.matrix)
// al final: mesh.instanceMatrix.needsUpdate = true
```

La simulación es **global y siempre activa**, sin relación con el
streaming de chunks. 25 actualizaciones de matriz por frame no cuestan
nada, y apagarlas por chunk haría que aparezcan y desaparezcan autos en el
borde de la pantalla.

**Los vehículos del pack de ithappy** vienen con carrocería, ruedas y
vidrios como objetos separados y con varios materiales. Así no se pueden
instanciar. Hay que hacer merge de cada auto en una sola malla con un
material antes de exportar.

---

## 7. Presupuesto de rendimiento

Con cámara ortográfica el frustum culling ayuda poco porque casi todo está
en pantalla. Lo que importa son los **draw calls**, no los triángulos.

| Elemento | Draw calls |
|---|---|
| Red de carreteras (fusionada) | 1 |
| Vehículos (`InstancedMesh`) | 1 |
| Edificios | 3–4 según tipos |
| Personaje + NPCs | 2 |

Objetivo: menos de 15 para toda la escena.

Sombras dinámicas: ninguna. El AO del bordillo ya está pintado en el
albedo del atlas. Para los autos, un plano con blob shadow.

---

## 8. Orden sugerido

1. Cargar el `.glb` y verificar la orientación base de recta y curva.
2. Definir la matriz 10×10 de layout.
3. Fusionar toda la red en un `BufferGeometry` y añadirla a la escena,
   fuera del sistema de chunks.
4. Un auto siguiendo un loop de una sola avenida.
5. Pasar a `InstancedMesh` con N autos y offsets de `t`.

No tocar la lógica de streaming de `ChunkGrid.js` salvo para subir
`LOAD_RADIUS`.
