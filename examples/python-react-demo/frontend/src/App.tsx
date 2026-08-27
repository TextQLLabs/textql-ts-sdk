import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ChatPage } from './components/ChatPage';
import { Toaster } from './primitives';

/**
 * `ChatPage` is the whole shell — sidebar, conversation, composer — and the
 * route only says which chat it is showing, so both paths render the same
 * component rather than remounting it on every navigation.
 */
export function App() {
	return (
		<BrowserRouter>
			<Toaster />
			<Routes>
				<Route path="/" element={<ChatPage />} />
				<Route path="/chat/:id" element={<ChatPage />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
