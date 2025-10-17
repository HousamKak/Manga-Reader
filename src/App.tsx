import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Library } from '@/pages/Library';
import { Reader } from '@/pages/Reader';
import { initDB } from '@/services/storageService';

function App() {
  useEffect(() => {
    // Initialize IndexedDB on app start
    initDB().catch((error) => {
      console.error('Failed to initialize database:', error);
    });
  }, []);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/read/:mangaId/:chapterId" element={<Reader />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
