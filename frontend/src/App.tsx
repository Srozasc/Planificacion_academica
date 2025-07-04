import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './features/auth/LoginPage';
import LoginPageFixed from './features/auth/LoginPageFixed';
import DashboardPage from './pages/DashboardPage';
import ErrorPage from './pages/ErrorPage';
import DataUploadPage from './features/dataUpload/DataUploadPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import { useAuthStore } from './store/auth.store';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="App">        <Routes>
          <Route path="/login" element={<LoginPageFixed />} />
          <Route path="/login-old" element={<LoginPage />} />
          <Route path="/error" element={<ErrorPage />} />          {isAuthenticated ? (
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="usuarios" element={<UsersPage />} />
              <Route path="perfil" element={<ProfilePage />} />
              <Route path="carga-datos" element={<DataUploadPage />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
          
          <Route path="*" element={<Navigate to="/error" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
