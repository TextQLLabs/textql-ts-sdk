import { Navigate, Route, Routes } from 'react-router-dom';

import { RegisterPage } from './components/RegisterPage';
import { RegistrationsPage } from './components/RegistrationsPage';
import { Shell } from './components/Shell';

export function App() {
	return (
		<Shell>
			<Routes>
				<Route path="/" element={<RegisterPage />} />
				<Route path="/registrations" element={<RegistrationsPage />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</Shell>
	);
}
