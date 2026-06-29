import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ScheduleLinkPage from './pages/ScheduleLinkPage';
import './index.css';

const queryClient = new QueryClient();

function AppRoutes() {
  const auth = useAuthProvider();

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500
                        border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={
          auth.user ? <Navigate to="/" /> : <LoginPage />
        } />
        <Route path="/register" element={
          auth.user ? <Navigate to="/" /> : <RegisterPage />
        } />
        <Route path="/s/:token" element={<ScheduleLinkPage />} />

        {/* Rutas protegidas */}
        <Route path="/" element={
          auth.user ? <DashboardPage /> : <Navigate to="/login" />
        } />
        <Route path="/admin" element={
          auth.user ? <AdminPage /> : <Navigate to="/login" />
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);