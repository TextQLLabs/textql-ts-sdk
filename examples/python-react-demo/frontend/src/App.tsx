import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ChatPage } from './components/ChatPage';
import { Toaster } from './primitives';

// Pulls in React Flow; most sessions never open a citation's lineage.
const CitationLineageModal = lazy(() =>
	import('./components/CitationLineageModal').then((m) => ({ default: m.CitationLineageModal }))
);

/**
 * `ChatPage` is the whole shell — sidebar, conversation, composer — and the
 * route only says what the main pane shows, so every path renders the same
 * component rather than remounting it on every navigation. `/threads` swaps
 * that pane for the thread list; the sidebar is unaffected.
 */
export function App({ agentMode = false }: { agentMode?: boolean }) {
	return (
		<BrowserRouter>
			<Toaster />
			<Suspense fallback={null}>
				<CitationLineageModal />
			</Suspense>
			<Routes>
				<Route path="/" element={<ChatPage agentMode={agentMode} />} />
				<Route path="/chat/:id" element={<ChatPage agentMode={agentMode} />} />
				<Route path="/threads" element={<ChatPage agentMode={agentMode} />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
