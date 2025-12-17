import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FleetView from './pages/FleetView';
import AdminApp from './admin/AdminApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FleetView />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
