import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Toaster } from '@ui/primitives';

import { Workspace } from './components/Workspace';
import './app.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<BrowserRouter>
			<Toaster />
			<Routes>
				<Route path="/" element={<Workspace />} />
				<Route path="/run/:id" element={<Workspace />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	</StrictMode>
);
