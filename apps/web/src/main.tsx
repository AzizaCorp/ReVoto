// Composition root: the only file that knows every layer.
// Infrastructure adapters are chosen here and injected into the presentation.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  JsonClient,
  JsonOpenDataRepository,
  JsonQualityRepository,
  JsonTurnoutRepository,
} from '@/infrastructure';
import { App } from '@/presentation/App';
import { DependenciesProvider } from '@/presentation/providers/Dependencies';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import '@fontsource/sora/latin-800.css';
import '@/presentation/styles/tokens.css';
import '@/presentation/styles/global.css';

// One client per visit: the manifest is requested once and pins the data version for every port.
const client = new JsonClient();
const dependencies = {
  turnout: new JsonTurnoutRepository(client),
  quality: new JsonQualityRepository(client),
  openData: new JsonOpenDataRepository(client),
};

const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root container');

createRoot(root).render(
  <StrictMode>
    <DependenciesProvider value={dependencies}>
      <App />
    </DependenciesProvider>
  </StrictMode>,
);
