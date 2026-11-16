import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { AuthGate } from './components/AuthGate';
import './app.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<AuthGate>{(footer) => <App sidebarFooter={footer} />}</AuthGate>
	</StrictMode>
);
