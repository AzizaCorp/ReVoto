// Punto de composición: el único archivo que conoce todas las capas.
// Aquí se eligen los adaptadores de infraestructura y se inyectan en la presentación.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonParticipacionRepository } from '@/infrastructure';
import { App } from '@/presentation/App';
import { ProveedorDependencias } from '@/presentation/providers/Dependencias';
import '@/presentation/styles/tokens.css';
import '@/presentation/styles/global.css';

const dependencias = { participacion: new JsonParticipacionRepository() };

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('No existe el contenedor #raiz en index.html');

createRoot(raiz).render(
  <StrictMode>
    <ProveedorDependencias valor={dependencias}>
      <App />
    </ProveedorDependencias>
  </StrictMode>,
);
