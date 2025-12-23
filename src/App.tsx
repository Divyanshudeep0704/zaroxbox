import { VaultDashboard } from './components/VaultDashboard';
import { Auth } from './components/Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return user ? <VaultDashboard /> : <Auth />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
