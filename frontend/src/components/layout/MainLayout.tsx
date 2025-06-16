import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-0">
      <header className="flex-shrink-0 w-full">
        <Navbar />
      </header>
      <main className="flex-1 pt-6 sm:pt-8 lg:pt-10 px-0">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
