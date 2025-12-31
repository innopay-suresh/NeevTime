/**
 * Lazy Route Loading
 * Code-splitting for better performance
 * Loads components only when needed
 */
import { lazy } from 'react';

// Lazy load page components
export const LazyDashboard = lazy(() => import('../pages/Dashboard'));
export const LazyEmployees = lazy(() => import('../pages/Employees'));
export const LazyDevices = lazy(() => import('../pages/Devices'));
export const LazyLogs = lazy(() => import('../pages/Logs'));
export const LazyDepartments = lazy(() => import('../pages/Departments'));
export const LazyPositions = lazy(() => import('../pages/Positions'));
export const LazyReportsLegacy = lazy(() => import('../pages/ReportsLegacy'));
export const LazyAdvancedReports = lazy(() => import('../pages/AdvancedReports'));
export const LazyIntegrations = lazy(() => import('../pages/Integrations'));
export const LazySettings = lazy(() => import('../pages/Settings'));
export const LazyUsersPage = lazy(() => import('../pages/Users'));
export const LazyAttendanceRegister = lazy(() => import('../pages/AttendanceRegister'));
export const LazyExportCenter = lazy(() => import('../pages/ExportCenter'));

// Loading component for Suspense fallback
export const RouteLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
        </div>
    </div>
);

