import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import MobileMenu from './MobileMenu';
import FeatureGuard from '../ui/FeatureGuard';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  activeItem: string;
  onNavigate: (item: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, activeItem, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="hidden lg:block">
        <Sidebar activeItem={activeItem} onItemClick={onNavigate} />
      </div>

      <FeatureGuard feature="multi_user">
        <div className="fixed top-4 right-4">
          {/* Multi-user controls */}
        </div>
      </FeatureGuard>

      {mobileMenuOpen && (
        <MobileMenu 
          activeItem={activeItem} 
          onItemClick={(item) => {
            onNavigate(item);
            setMobileMenuOpen(false);
          }}
          onClose={toggleMobileMenu}
        />
      )}

      <Header 
        title={title} 
        onMenuClick={toggleMobileMenu} 
        onNavigate={onNavigate}
      />

      <main className="lg:ml-64 pt-16 pb-20 lg:pb-8 min-h-screen">
        <div className="p-6">{children}</div>
      </main>

      <MobileNav 
        activeItem={activeItem} 
        onItemClick={onNavigate} 
        onMenuClick={toggleMobileMenu} 
      />
    </div>
  );
};

export default Layout;