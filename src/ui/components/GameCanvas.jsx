import { useEffect, useRef } from 'react';
import Experience from '../../Experience/Experience.js';
import styles from './ThreeCanvas.module.css';

/* Monta la Experience del juego (mundo isométrico, chunks, NPCs, diálogo)
   dentro del área de contenido del shell. El canvas ya no es la pantalla
   entera: Sizes mide el contenedor y el raycasting de Input usa el rect del
   canvas, por eso se le pasa `container`.

   `onReady` recibe la instancia para que la pantalla pueda tocar la cámara
   (los botones de zoom del mapa mueven el mismo camera.zoomTarget que la rueda). */
export default function GameCanvas({ onReady }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const experience = new Experience(canvasRef.current, containerRef.current);
    onReadyRef.current?.(experience);

    // Al salir de la pantalla se destruye: corta el rAF, dispone la memoria
    // de GPU y suelta el singleton (regla 11).
    return () => {
      onReadyRef.current?.(null);
      experience.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
