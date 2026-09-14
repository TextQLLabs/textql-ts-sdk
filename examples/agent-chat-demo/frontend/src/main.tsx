import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from 'python-react-demo-frontend';
import './app.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App agentMode />
	</StrictMode>
);
