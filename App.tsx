import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RestaurantProvider } from './context/RestaurantContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerRoute from './components/CustomerRoute';
import { Role } from './types';

// Views
import LoginView from './views/LoginView';
import HomePage from './views/HomePage';
import TableView from './views/TableView';
import CustomerView from './views/CustomerView';
import KitchenView from './views/KitchenView';
import StaffView from './views/StaffView';
import CashierView from './views/CashierView';
import AdminView from './views/AdminView';

const App = () => {
  return (
    <RestaurantProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginView />} />

            {/* Protected Routes - Require Authentication */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={[Role.ADMIN]}>
                  <AdminView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kitchen"
              element={
                <ProtectedRoute requiredRoles={[Role.KITCHEN]}>
                  <KitchenView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cashier"
              element={
                <ProtectedRoute requiredRoles={[Role.CASHIER]}>
                  <CashierView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <ProtectedRoute requiredRoles={[Role.STAFF]}>
                  <StaffView />
                </ProtectedRoute>
              }
            />

            {/* Customer Routes - No Authentication Required */}
            <Route
              path="/ban/:tableId"
              element={
                <CustomerRoute>
                  <TableView />
                </CustomerRoute>
              }
            />

            <Route
              path="/table/:tableId"
              element={
                <CustomerRoute>
                  <TableView />
                </CustomerRoute>
              }
            />

            {/* Fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-4">Trang không tồn tại</p>
                    <a
                      href="/"
                      className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Về trang chủ
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </RestaurantProvider>
  );
};

export default App;