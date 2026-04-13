import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, CreditCard, Wrench, FileText, BarChart3, Settings, LogOut, Home } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const ownerNav = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Properties', path: '/properties', icon: Building2 },
  { name: 'Tenants', path: '/tenants', icon: Users },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Maintenance', path: '/tickets', icon: Wrench },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
];

const tenantNav = [
  { name: 'My Portal', path: '/', icon: LayoutDashboard },
  { name: 'My Payments', path: '/payments', icon: CreditCard },
  { name: 'Help & Tickets', path: '/tickets', icon: Wrench }
];

const Sidebar = () => {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  const activeNav = user?.role === 'tenant' ? tenantNav : ownerNav;

  return (
    <div className="w-[240px] fixed inset-y-0 left-0 bg-primary flex flex-col items-stretch z-10 text-slate-300">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <Home className="w-6 h-6 text-white mr-2" />
        <span className="text-xl font-semibold text-white tracking-wide">PropMS {user?.role === 'tenant' ? 'Tenant' : 'Owner'}</span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {activeNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-accent text-white' : 'hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10 space-y-1 shrink-0">
        {user?.role !== 'tenant' && (
          <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent text-white' : 'hover:bg-white/10 hover:text-white'
                }`
              }
            >
            <Settings className="w-5 h-5 flex-shrink-0" />
            Settings
          </NavLink>
        )}
        
        <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Owner'}</p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white text-slate-300 mt-2 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
