import { Navigate, Route, Routes } from 'react-router-dom';
import { AppStateProvider } from './state/AppState.jsx';
import { ImmersiveProvider } from './state/ImmersiveMode.jsx';
import Shell from './components/Shell.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import MapScreen from './screens/MapScreen.jsx';
import MissionsScreen from './screens/MissionsScreen.jsx';
import LessonScreen from './screens/LessonScreen.jsx';
import VocabularyScreen from './screens/VocabularyScreen.jsx';
import AvatarScreen from './screens/AvatarScreen.jsx';
import LiveClassesScreen from './screens/LiveClassesScreen.jsx';
import StoreScreen from './screens/StoreScreen.jsx';
import LoginScreen from './screens/LoginScreen.jsx';

/* Rutas reales en vez del router por estado del prototipo (`screen`).
   Inicio es el mundo 3D jugable (la escena de three.js); Mapa es la vista
   general de Seúl sobre la imagen de la ciudad.

   El login queda fuera del <Shell>: ocupa el lienzo completo, sin barra
   superior ni sidebar (handoff § 1). Todavía no es la pantalla de entrada —
   la app sigue arrancando en Inicio— porque no hay sesión real; se llega a
   ella desde el acceso temporal del botón de Ajustes. */
export default function App() {
  return (
    <AppStateProvider>
      <ImmersiveProvider>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />

          <Route element={<Shell />}>
            <Route path="/" element={<Navigate to="/inicio" replace />} />
            <Route path="/inicio" element={<HomeScreen />} />
            <Route path="/mapa" element={<MapScreen />} />
            <Route path="/misiones" element={<MissionsScreen />} />
            <Route path="/leccion" element={<LessonScreen />} />
            <Route path="/vocabulario" element={<VocabularyScreen />} />
            <Route path="/avatar" element={<AvatarScreen />} />
            <Route path="/clases" element={<LiveClassesScreen />} />
            <Route path="/tienda" element={<StoreScreen />} />
            <Route path="*" element={<Navigate to="/inicio" replace />} />
          </Route>
        </Routes>
      </ImmersiveProvider>
    </AppStateProvider>
  );
}
