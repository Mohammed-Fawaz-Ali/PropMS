import React from 'react';
import { Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Users, 
  CreditCard, Wrench, Settings, LogOut, Menu, X, Bell 
} from 'lucide-react';
import Sidebar from './Sidebar';

const PageLayout = () => {
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Properties', href: '/properties', icon: Building2 },
    { name: 'Tenants', href: '/tenants', icon: Users },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Maintenance', href: '/tickets', icon: Wrench },
    { name: 'Master Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar navigation={navigation} />
      <div className="flex-1 ml-[240px] flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border flex items-center px-6 lg:px-8 shrink-0">
          <h1 className="text-lg font-semibold text-text-primary">Dashboard</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
