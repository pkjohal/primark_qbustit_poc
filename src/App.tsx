import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BasketProvider } from '@/context/BasketContext';
import { ToastProvider } from '@/context/ToastContext';
import NavBar from '@/components/layout/NavBar';
import BottomNav from '@/components/layout/BottomNav';
import ToastContainer from '@/components/ui/Toast';
import LoginScreen from '@/screens/LoginScreen';
import ScanScreen from '@/screens/ScanScreen';
import BasketsScreen from '@/screens/BasketsScreen';
import BasketDetailScreen from '@/screens/BasketDetailScreen';
import ReportsScreen from '@/screens/ReportsScreen';
import AdminScreen from '@/screens/AdminScreen';
import { useToast } from '@/hooks/useToast';

// ── Auth-required guard ──────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

// ── Role guards ──────────────────────────────────────────────────────────────

function RequireReports({ children }: { children: React.ReactNode }) {
  const { canViewReports } = useAuth();
  const { showToast } = useToast();
  if (!canViewReports) {
    showToast("You don't have permission to view that page.", 'error');
    return <Navigate to="/scan" replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  if (!isAdmin) {
    showToast("You don't have permission to view that page.", 'error');
    return <Navigate to="/scan" replace />;
  }
  return <>{children}</>;
}

// ── Authenticated layout (NavBar + content + BottomNav) ──────────────────────

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-light-grey">
      <NavBar />
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}

// ── Router ───────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />

      <Route
        path="/scan"
        element={
          <RequireAuth>
            <AppLayout>
              <ScanScreen />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/baskets"
        element={
          <RequireAuth>
            <AppLayout>
              <BasketsScreen />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/baskets/:id"
        element={
          <RequireAuth>
            <AppLayout>
              <BasketDetailScreen />
            </AppLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/reports"
        element={
          <RequireAuth>
            <RequireReports>
              <AppLayout>
                <ReportsScreen />
              </AppLayout>
            </RequireReports>
          </RequireAuth>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AppLayout>
                <AdminScreen />
              </AppLayout>
            </RequireAdmin>
          </RequireAuth>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// ── Root component ───────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <BasketProvider>
            <AppRoutes />
            <ToastContainer />
          </BasketProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
