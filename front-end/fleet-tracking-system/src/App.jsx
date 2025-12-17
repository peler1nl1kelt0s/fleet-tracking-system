import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';

const LazyFleetView = lazy(() => import('./pages/FleetView'));
const LazyAdminApp = lazy(() => import('./admin/AdminApp'));

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<div>Yükleniyor...</div>}>
          <Routes>
            <Route path="/" element={<LazyFleetView />} />
            <Route path="/admin/*" element={<LazyAdminApp />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
