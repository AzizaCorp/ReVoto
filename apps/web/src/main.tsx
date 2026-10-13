// Composition root: the only file that knows every layer.
// Infrastructure adapters are chosen here and injected into the presentation.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonTurnoutRepository } from '@/infrastructure';
import { App } from '@/presentation/App';
import { DependenciesProvider } from '@/presentation/providers/Dependencies';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import '@fontsource/sora/latin-800.css';
import '@/presentation/styles/tokens.css';
import '@/presentation/styles/global.css';

const dependencies = { turnout: new JsonTurnoutRepository() };

const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root container');

createRoot(root).render(
  <StrictMode>
    <DependenciesProvider value={dependencies}>
      <App />
    </DependenciesProvider>
  </StrictMode>,
);
