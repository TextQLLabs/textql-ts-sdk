import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';

import { ChatPage } from './components/ChatPage';
import { StylePage } from './components/StylePage';
import { Toaster } from './primitives';

/** Legacy feed profile deep link → the agent detail page, query intact. */
function FeedAgentRedirect() {
	const { id } = useParams();
	const { search } = useLocation();
	return <Navigate to={`/agents/${id}${search}`} replace />;
}

/**
 * `ChatPage` is the whole app shell — sidebar plus whichever section the route
 * selects — mirroring the Svelte demo, where every `(chat)/**` route renders
 * the same layout component and the page files are empty placeholders.
 */
export function App() {
	return (
		<>
			<Toaster />
			<Routes>
				<Route path="/" element={<ChatPage />} />
				<Route path="/chat/:id" element={<ChatPage />} />
				<Route path="/threads" element={<ChatPage />} />
				<Route path="/playbooks" element={<ChatPage />} />
				<Route path="/playbooks/:id" element={<ChatPage />} />
				<Route path="/agents" element={<ChatPage />} />
				<Route path="/agents/:id" element={<ChatPage />} />
				<Route path="/agents/:id/run/:runId" element={<ChatPage />} />
				<Route path="/apps" element={<ChatPage />} />
				<Route path="/apps/:id" element={<ChatPage />} />
				<Route path="/ontology" element={<ChatPage />} />
				<Route path="/feed/profile/agent/:id" element={<FeedAgentRedirect />} />
				<Route path="/style" element={<StylePage />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</>
	);
}
