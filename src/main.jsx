import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// style.css es el CSS del juego vanilla: lo necesita la tarjeta de diálogo
// (DialogUI) que sigue viviendo en DOM plano dentro del canvas. Va primero
// para que los tokens y el base del shell puedan pisar html/body.
import './style.css';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import App from './ui/App.jsx';

// Sin <StrictMode> a propósito: en desarrollo monta, desmonta y vuelve a
// montar cada efecto, lo que acá significa crear/destruir el contexto WebGL y
// recargar el GLB del personaje en cada entrada a las pantallas 3D. El
// cleanup igual está implementado (Experience.destroy) y se ejercita al
// navegar entre pantallas.
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
