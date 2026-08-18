# System Design — Cappilingua (MoveExperiments)

Referencia de arquitectura y reglas de performance para este proyecto. Está pensada para mantenerse presente en cada sesión de trabajo (ver `CLAUDE.md` en la raíz, que la importa).

## Stack

- **Three.js** (r185) para render 3D, **Vite** como bundler/dev-server, JS vanilla con módulos ES (sin framework de UI).
- Patrón "Experience" (estilo Three.js Journey / Bruno Simon): un singleton `Experience` orquesta un único loop de render y expone `scene`, `camera`, `renderer`, `resources`, `time`, `sizes` a todo lo demás vía `new Experience()`.
- Cámara ortográfica fija en ángulo isométrico (`Camera.js`), sin rotación libre — solo sigue al jugador y hace zoom.
- Personaje jugable: modelo GLTF con esqueleto único que trae *todas* las variantes de outfit como mallas separadas; se muestra un subconjunto vía `visible` (`Player.js`, `VISIBLE_MESH_NAMES`). Animaciones vienen de FBX aparte y se aplican al mismo esqueleto vía `AnimationMixer`.
- NPCs: geometría primitiva (cápsula + esfera), sin modelo importado.
- UI de diálogo: DOM puro superpuesto al canvas (`DialogUI.js`), no texto renderizado en Three.js.

## Árbol de responsabilidades

```
Experience (singleton)
├── Sizes        → tamaño de ventana + pixelRatio (evento 'resize')
├── Time         → rAF loop único (evento 'tick')
├── Resources    → carga de assets, punto único (evento 'ready')
├── Camera       → ortográfica isométrica, sigue a un target
├── Renderer     → WebGLRenderer + sombras
└── World        → arma la escena cuando Resources dispara 'ready'
    ├── Environment (luces)
    ├── Floor
    ├── Player (modelo + mixer + movimiento)
    ├── TargetMarker (feedback visual de click)
    ├── Npc[] (geometría compartida a nivel de módulo)
    ├── Input (raycasting on-demand, click/wheel)
    └── DialogUI (DOM)
```

## Reglas de performance

Estas reglas ya están aplicadas en el código existente; mantenerlas al agregar features nuevas.

### 1. Un único loop de render
Todo lo que se anima cuelga de `Time` → evento `tick` → `Experience.update()` → `camera.update / world.update / renderer.update`. No crear un segundo `requestAnimationFrame` en ningún componente nuevo; si algo necesita actualizarse por frame, se cuelga del `tick` existente o se llama desde `World.update()`.

### 2. Cero allocations dentro del loop de update
`update()` corre 60 veces por segundo. No instanciar `new THREE.Vector3()`, `new THREE.Quaternion()`, arrays, ni objetos literales ahí dentro — reusar campos de instancia como scratch (ver `Player._dir`, `Npc.approachPoint` es la excepción tolerada porque solo corre al click, no por frame). Antes de agregar un cálculo por frame, preguntar: ¿esto se ejecuta en `update()`? Si sí, sus vectores/temporales deben vivir como propiedad de la clase, creados una sola vez en el constructor.

### 3. Geometría y materiales compartidos a nivel de módulo
Cuando una entidad se puede repetir (NPCs, marcadores, proyectiles futuros), la geometría y el material base se declaran **fuera de la clase, a nivel de módulo** (ver `bodyGeometry`/`headGeometry`/`headMaterial` en `Npc.js`, `geometry`/`material` en `TargetMarker.js`). Cada instancia solo crea el `Mesh` (y clona el material únicamente si necesita variar una propiedad por instancia, como la opacidad del marker). Nunca instanciar geometría dentro del constructor de una entidad que puede haber muchas.

Si el número de NPCs/props similares crece más allá de unas pocas decenas, migrar a `THREE.InstancedMesh` en vez de N meshes independientes.

### 4. Carga de assets centralizada
Todo asset (GLTF, FBX, textura) se declara en `Sources.js` y se carga una sola vez a través de `Resources`, que dispara `ready` cuando todo terminó. Ninguna entidad debe llamar a un loader por su cuenta ni recargar un asset ya presente en `resources.items`. Si se agrega un tipo de asset nuevo (ej. DRACO-compressed GLTF, KTX2 texturas), extender `Resources.setLoaders()`/`startLoading()`, no crear loaders sueltos en otros archivos.

### 5. `pixelRatio` con cap
`Sizes` cappea `devicePixelRatio` a 2 (`MAX_PIXEL_RATIO`). En pantallas 3x+ sin este cap el fragment shader triplica costo sin ganancia visual perceptible. Mantener el cap si se toca `Sizes` o `Renderer`; no usar `window.devicePixelRatio` crudo en ningún lado.

### 6. Delta clamp
`Time` cappea `delta` a 50ms (`MAX_DELTA`). Evita que un tab inactivo o un frame largo hagan saltar de golpe animación/movimiento/física al volver. Cualquier cálculo nuevo que dependa de `dt` debe usar `experience.time.delta`, nunca medir tiempo por su cuenta.

### 7. Sombras acotadas
- Una sola luz `castShadow = true` (el sol direccional). No agregar más luces con sombra sin evaluar el costo — cada una es un render pass extra de la escena.
- `shadow.mapSize` se fija al mínimo que se vea bien para el tamaño de escena actual (1024 para un plano de 30×30 con cámara de sombra ortográfica fija). Si el mundo crece, ajustar el frustum de la shadow camera (`shadow.camera.left/right/top/bottom`) antes que subir la resolución.
- `castShadow`/`receiveShadow` se activan solo en las mallas que realmente se ven (`VISIBLE_MESH_NAMES` en `Player.js`), no en todo el `traverse`. Al agregar un modelo nuevo con variantes ocultas, seguir el mismo patrón de whitelist explícita.

### 8. Raycasting solo event-driven
`Input.js` raycastea únicamente dentro de listeners de `pointerdown`/`wheel`, nunca dentro de `update()`. Si se necesita detectar hover u otra interacción continua, evaluar primero si alcanza con distancias/bounding checks baratos (como `Npc.isNear`, que es solo `Math.hypot` sobre posiciones, no raycasting) antes de raycastear por frame.

### 9. Checks de proximidad O(n) están bien a esta escala
`World.update()` itera `this.npcs` con `Math.hypot` cada frame — aceptable mientras la cantidad de NPCs sea chica (decenas). Si crece a cientos, introducir partición espacial (grid/quadtree) antes de seguir escalando el loop lineal.

### 10. UI de diálogo en DOM, no en el canvas
Texto, botones y feedback de los ejercicios viven en `DialogUI.js` como DOM real superpuesto, no como sprites/canvas-texture en la escena 3D. Es más barato, accesible y fácil de estilar. La única excepción tolerada es el globo "!" de los NPCs (`Npc.js`, `CanvasTexture` creada **una vez** en el constructor, nunca recreada por frame) — si se necesita texto dinámico sobre un NPC, evaluar DOM posicionado con `project()` antes de generar canvas-textures por frame.

### 11. Dispose explícito al destruir
`Experience.destroy()` recorre la escena y llama `.dispose()` en geometría y materiales, y en el renderer. Cualquier recurso GPU nuevo (textura, render target, geometría no compartida) debe quedar alcanzable desde ese `traverse` o disponer de su propio cleanup — no confiar en el garbage collector de JS para memoria de GPU.

### 12. Debug/GUI detrás de flag
`lil-gui` y sus folders solo se crean si `this.debug.active` (ver `Environment.js`). No dejar `console.log` por frame ni GUIs siempre activas en el flujo normal; todo instrumento de debug cuelga de `Debug.active`.

### 13. Bundle mínimo
Importar de `three/examples/jsm/...` únicamente los loaders/helpers que se usan (`GLTFLoader`, `FBXLoader` — ya es así). No importar módulos de ejemplo completos (post-processing, controls no usados, etc.) "por si acaso"; cada import de `three/examples` que no se usa es peso muerto en el bundle de Vite.

## Streaming de mundo (mapas grandes / ciudad)

El tamaño del mapa vive en `World/mapConfig.js` (`CHUNK_SIZE`, `GRID_DIM`, `MAP_SIZE`) — es la fuente única de verdad que usan `Floor`, `Input` y el streaming. Hay una primera implementación mínima del mecanismo de streaming (`World/Chunk.js` + `World/ChunkGrid.js`): una grilla 4×4 de celdas vacías (solo un plano de color + su coordenada) que se cargan/descargan con fade según la celda del jugador, para validar el mecanismo antes de meterle contenido real. Estas son las reglas a seguir a medida que ese mecanismo crezca — están pensadas para encajar en la arquitectura `Experience` existente, no para reemplazarla.

### 14. Particionar el mundo en chunks de tamaño fijo
El mapa se divide en una grilla de celdas de tamaño constante. La celda del jugador se calcula como `(cx, cz) = floor(posición / tamañoCelda)`. Toda decisión de carga/descarga se basa en esta coordenada entera, nunca en posición absoluta. Como la cámara es ortográfica con `FRUSTUM_SIZE` fijo y zoom acotado (`ZOOM_MIN`/`ZOOM_MAX` en `Input.js`), la porción de mundo visible en el plano tiene un tamaño máximo conocido de antemano — el radio de carga se puede fijar en base a eso, sin necesidad de calcular visibilidad de frustum 3D.

### 15. Streaming estático y población dinámica son sistemas separados
La geometría estática (edificios, calles, terreno) necesita continuidad — no puede aparecer/desaparecer de golpe a la vista del jugador. Los NPCs y elementos dinámicos, en cambio, se pueden spawnear/despawnear sin transición porque su ausencia no rompe la ilusión. `World.update()` hoy itera `this.npcs` completo cada frame; a escala de ciudad, ese loop debe limitarse a los NPCs de la celda activa y sus vecinas, gestionados por un sistema de población independiente del streaming de geometría.

### 16. Histéresis en el disparador de carga
Nunca usar la misma distancia para cargar y descargar un chunk — un jugador parado en el borde generaría carga/descarga en cada frame (thrashing). Se cargan chunks dentro de `R_load`, se descargan recién fuera de `R_unload`, con `R_unload > R_load`. El chequeo de cambio de celda se hace una vez por tick (una resta + floor), colgado del mismo `time.tick` que ya orquesta todo lo demás.

### 17. Separar datos lógicos (siempre cargados) de datos pesados (bajo demanda)
Cada chunk tiene dos capas:
- **Ligera**: metadata siempre en memoria — spawn points de NPCs, zonas caminables, triggers de diálogo. Es el equivalente de `Sources.js` pero indexado por celda.
- **Pesada**: mallas, texturas, animaciones. Esto es lo único que realmente se streamea.

`Resources.js` actual carga todo al boot y dispara `ready` una sola vez; para streaming se necesita un gestor que cargue/descargue assets por chunk en cualquier momento, con conteo de referencias — si dos celdas vecinas comparten un mismo prop (farola, árbol), no se carga ni se dispone dos veces.

### 18. Cola de carga asíncrona con prioridad y concurrencia limitada
No cargar varios chunks en el mismo frame sin control: el parseo de GLTF bloquea el hilo principal y genera hitches visibles. Usar una cola con concurrencia limitada (2-3 cargas simultáneas) priorizada por distancia al jugador — el chunk donde está parado se prioriza sobre el que recién entra al radio de carga.

### 19. LOD/impostores solo si hace falta
Con cámara fija isométrica y vista siempre acotada al jugador, no hay "horizonte" lejano visible, así que LOD agresivo es menos crítico que en un juego en tercera persona con cámara libre. Solo evaluar impostores/versiones simplificadas si hay estructuras grandes visibles desde varias celdas de distancia dentro del radio de renderizado.

### 20. Instancing para props repetidos
Cuando un chunk tiene múltiples copias del mismo prop (farolas, árboles, autos estacionados), usarlas como `THREE.InstancedMesh` en vez de un `Mesh` por copia — mismo espíritu que la regla 3 (geometría compartida a nivel de módulo), pero para múltiples instancias transformadas en una sola draw call.

### 21. Culling automático alcanza para el caso base
Three.js hace frustum culling por objeto automáticamente. Combinado con streaming por distancia, esto debería alcanzar sin necesidad de occlusion culling manual. Occlusion culling es una optimización de última milla, no algo a implementar de entrada.

### 22. Dispose por chunk, no solo al destruir la Experience
El patrón de `Experience.destroy()` (traverse + dispose de geometría/material) se replica por chunk individual: al descargar una celda hay que sacar sus objetos de la escena y disponer geometría/material/textura explícitamente. Sin esto, cada recorrido de ida y vuelta por el mapa filtra memoria de GPU — en navegador esto se nota mucho más rápido que en un engine nativo.

### 23. Empaquetado de assets por chunk, no un único bundle
Cada chunk es su propio archivo (o referencia assets compartidos vía manifest), en vez de un `.glb`/bundle único de toda la ciudad. `Sources.js` pasa de ser una lista fija cargada al boot a ser un índice resuelto en tiempo real: "qué archivo(s) cargar para la celda (cx, cz)".

### 24. Costuras (seams) entre chunks
El origen de cada chunk debe anclarse a múltiplos exactos del tamaño de celda, y los bordes de terreno/textura deben calzar exactamente con los del chunk vecino. Evita líneas o saltos visibles en la unión — mismo principio que tiling de texturas: continuidad en el borde, no solo proximidad de posición.

### 25. `GRID_DIM` casi no tiene techo de performance — el límite está en otro lado
Como `ChunkGrid._neededChunks` es O(radio²) y no O(GRID_DIM²) (solo recorre la vecindad de carga, nunca la grilla entera), agrandar `GRID_DIM` en `mapConfig.js` no agrega costo por frame. Los límites reales, en orden de cuándo aparecen:
- **Caches "por celda visitada alguna vez"**: cualquier Map indexado por `(cx, cz)` que se llena a medida que el jugador explora (como `labelCache` en `Chunk.js`) crece sin techo si no se acota — con una grilla chica no se nota, con una grande es una fuga de memoria real. Acotar con eviction (LRU) o no cachear si el dato es barato de regenerar.
- **Precisión de punto flotante**: WebGL usa float32 para posiciones de vértices. A partir de coordenadas de mundo del orden de ~10.000–100.000 unidades empieza a haber jitter/z-fighting visible porque la precisión se degrada lejos del origen. Es el problema que GTA resuelve con "floating origin" (recentrar el mundo periódicamente alrededor del jugador en vez de usar coordenadas absolutas gigantes). Con los tamaños de chunk actuales, llegar ahí requeriría una grilla de miles de celdas por lado — no es un problema inminente, pero es el techo de fondo si el mapa crece indefinidamente en vez de reciclar chunks.
- El plano de colisión único (`Floor.js`) no cuenta como límite: es una sola geometría de 4 vértices sin importar `MAP_SIZE`.

### Dónde engancha esto en la arquitectura actual
Un `ChunkManager` (o nombre equivalente) viviría junto a `World`, escuchando `time.tick` igual que el resto, comparando la celda actual de `player.position` contra la anterior y disparando carga/descarga solo en el cambio de celda — no todos los frames. `Resources` deja de ser "cargar todo al boot" y pasa a ser un servicio invocable bajo demanda, con cola de prioridad y conteo de referencias.

### Orden de implementación sugerido
No construir todo el sistema de una vez. Camino incremental: (1) grilla fija de celdas con carga síncrona simple (3×3 celdas alrededor del jugador, sin transición), (2) pasar esa carga a asíncrona con cola, (3) separar capa lógica (spawn de NPCs) de la visual, (4) recién ahí sumar instancing y LOD cuando el contenido por chunk sea denso. Cada paso es útil por sí solo y no exige rehacer el anterior.

## Cuándo romper una regla

Estas reglas son defaults, no dogma. Si una feature nueva justifica romper una (por ejemplo, una segunda luz con sombra para un efecto puntual), documentar el motivo en un comentario corto junto al código, igual que ya se hace en `Environment.js` y `Sizes.js` — la razón importa más que la regla.
