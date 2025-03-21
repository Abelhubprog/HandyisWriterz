import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppRoutes } from './src/routes';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
