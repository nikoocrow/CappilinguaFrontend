import { useEffect, useRef } from 'react';
import CustomizeExperience from '../../Customize/CustomizeExperience.js';
import styles from './ThreeCanvas.module.css';

/* Vista previa del personaje para la pantalla Avatar. Se monta en modo
   embebido (`withPanel:false`): el panel editorial lo dibuja React y habla
   con `stage` (setSlotOption / setSkinColor / save), que es la misma API que
   usaba el panel DOM de CustomizeUI. */
export default function AvatarCanvas({ onStage }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const onStageRef = useRef(onStage);
  onStageRef.current = onStage;

  useEffect(() => {
    const experience = new CustomizeExperience(canvasRef.current, {
      withPanel: false,
      container: containerRef.current,
    });
    onStageRef.current?.(experience.stage);

    return () => {
      onStageRef.current?.(null);
      experience.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
