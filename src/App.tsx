import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SkeletonTheme } from "react-loading-skeleton";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Attendance from "./components/Attendance";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import OfflineBanner from "./components/OfflineBanner";
import UpdatePrompt from "./components/UpdatePrompt";

const AdminReport = lazy(() => import("./components/AdminReport"));
const AdminDirectoratePage = lazy(() => import("./components/AdminDirectoratePage"));
const AdminTeamPage = lazy(() => import("./components/AdminTeamPage"));
const DashboardPageByDepartment = lazy(() => import("./components/DashboardPageByDepartment"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--parchment)" }}>
    <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <OfflineBanner />
        <UpdatePrompt />
        <BrowserRouter>
          <SkeletonTheme baseColor="#e5e5e5" highlightColor="#d6d4d4">
            <Routes>
              <Route index element={<Attendance />} />
              <Route
                path="/admin/summary"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<AdminFallback />}>
                      <AdminReport />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/directorate/:slug"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<AdminFallback />}>
                      <AdminDirectoratePage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/team/:slug"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<AdminFallback />}>
                      <AdminTeamPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/department/summary"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<AdminFallback />}>
                      <DashboardPageByDepartment />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </SkeletonTheme>
        </BrowserRouter>
        <ToastContainer
          hideProgressBar
          autoClose={5000}
          theme="colored"
          position="top-center"
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
