import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import NotificationPanel from './NotificationPanel';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, Receipt, Wallet, 
  Map, BarChart, LogOut, Bell, Menu, Settings, X, User, Search
} from 'lucide-react';

const getNavItems = (role) => {
  const items = [
    { name: 'डैशबोर्ड', path: '/dashboard', icon: LayoutDashboard },
    { name: 'दानदाता', path: '/donors', icon: Users },
    { name: 'खोजें', path: '/receipts/search', icon: Search },
    { name: 'चंदा', path: '/donations', icon: Receipt },
  ];
  if (role === 'admin') {
    items.push({ name: 'खर्चे', path: '/expenditures', icon: Wallet });
  }
  items.push({ name: 'दौरे', path: '/visits', icon: Map });
  items.push({ name: 'रिपोर्ट', path: '/reports', icon: BarChart });
  if (role === 'admin') {
    items.push({ name: 'सेटिंग्स', path: '/settings', icon: Settings });
  }
  items.push({ name: 'प्रोफ़ाइल', path: '/profile', icon: User });
  return items;
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = getNavItems(user?.role);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: freezeStatus } = useQuery({
    queryKey: ['freezeStatus'],
    queryFn: async () => {
      const res = await api.get('/admin/freeze-status');
      return res.data;
    },
    refetchInterval: 60000 // Poll every 60s
  });

  const { data: unreadCountObj } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data;
    },
    refetchInterval: 60000 // Poll every 60s
  });

  // Close menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    return () => { document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.width = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Bottom nav: show first 4 items + "और" menu
  const bottomItems = navItems.slice(0, 4);
  const overflowItems = navItems.slice(4);

  const pageNames = {
    dashboard: 'डैशबोर्ड', donors: 'दानदाता', donations: 'चंदा',
    expenditures: 'खर्चे', visits: 'दौरे', reports: 'रिपोर्ट', settings: 'सेटिंग्स'
  };

  return (
    <div className="flex h-screen bg-dargah-cream font-body">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img src="/assets/dargah.jpg" alt="दरगाह" className="w-11 h-11 rounded-full object-cover border-2 border-dargah-gold shadow" />
            <div>
              <h1 className="text-base font-arabic font-bold text-dargah-green leading-tight">हज़रत सुल्तान</h1>
              <h2 className="text-xs font-semibold text-dargah-gold">शाह पीर</h2>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-dargah-green/10 to-dargah-teal/10 text-dargah-green border-l-4 border-dargah-gold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-dargah-green text-white flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role === 'admin' ? 'प्रशासक' : 'सदस्य'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            लॉगआउट
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Global Freeze Banner */}
        {freezeStatus?.isFrozen && user?.role === 'member' && (
          <div className="bg-red-50 border-b border-red-200 text-red-800 text-sm px-4 py-2 text-center shadow-sm w-full z-20 font-medium">
            <span className="mr-2">⚠</span>
            दान ऑपरेशन वर्तमान में प्रशासक द्वारा रोक (Freeze) दिए गए हैं · {freezeStatus.reason || 'सिस्टम ऑडिट'} 
            {freezeStatus.frozenAt && ` · ${new Date(freezeStatus.frozenAt).toLocaleDateString('hi-IN')}`}
          </div>
        )}

        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-10 shadow-md px-4 py-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B6B3A 72%, #C9900C 100%)' }}>
          <div className="flex items-center gap-3">
            <img src="/assets/dargah.jpg" alt="दरगाह" className="w-10 h-10 rounded-full object-cover border-2 border-dargah-gold shadow" />
            <div>
              <span className="text-base font-arabic font-bold text-white leading-none block">हज़रत सुल्तान</span>
              <span className="text-xs font-semibold text-dargah-gold-light">शाह पीर</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="text-white/70 hover:text-white relative p-1 mt-1">
                <Bell className="w-6 h-6" />
                {unreadCountObj?.count > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-dargah-green flex items-center justify-center text-[8px] font-bold text-white">
                    {unreadCountObj.count > 9 ? '9+' : unreadCountObj.count}
                  </span>
                )}
              </button>
              {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
            </div>
            <NavLink to="/profile" className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm border border-white/30 cursor-pointer hover:bg-white/30 transition-colors">
              {user?.name?.charAt(0)}
            </NavLink>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-6 py-3"
          style={{ background: 'linear-gradient(135deg, #0F4C2A 0%, #1B6B3A 72%, #C9900C 100%)' }}>
          <h2 className="text-lg font-semibold text-white capitalize">
            {pageNames[location.pathname.split('/')[1]] || 'डैशबोर्ड'}
          </h2>
          <div className="flex items-center gap-4">
            {user?.role === 'member' && user?.assignedAreas?.length > 0 && (
              <div className="flex gap-1">
                {user.assignedAreas.map(a => (
                  <span key={a} className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full font-medium">{a}</span>
                ))}
              </div>
            )}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="text-white/70 hover:text-white relative mt-1">
                <Bell className="w-5 h-5" />
                {unreadCountObj?.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border border-dargah-green flex items-center justify-center text-[9px] font-bold text-white">
                    {unreadCountObj.count > 9 ? '9+' : unreadCountObj.count}
                  </span>
                )}
              </button>
              {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 print:p-0 print:overflow-visible">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 px-2 py-1 flex justify-around items-center z-10 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] no-print">
        {bottomItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-xl min-w-[50px] transition-all duration-200 ${
                isActive 
                  ? 'text-dargah-green scale-105' 
                  : 'text-slate-400 hover:text-slate-700'
              }`
            }
          >
            <item.icon className="w-6 h-6 mb-0.5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}
        {/* More menu button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center p-2 rounded-xl min-w-[50px] transition-all duration-200 ${
            mobileMenuOpen ? 'text-dargah-green' : 'text-slate-400'
          }`}
        >
          <Menu className="w-6 h-6 mb-0.5" />
          <span className="text-[10px] font-medium">और</span>
        </button>
      </nav>

      {/* Mobile More Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onMouseDown={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl pb-safe max-h-[70vh] overflow-y-auto animate-slide-up"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Drawer handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-slate-300 rounded-full"></div>
            </div>

            {/* User Info */}
            <div className="px-6 pb-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-dargah-green text-white flex items-center justify-center font-bold text-lg">
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role === 'admin' ? 'प्रशासक' : 'सदस्य'}</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Overflow Nav Items */}
            <div className="p-4 space-y-1">
              {overflowItems.map(item => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive ? 'bg-dargah-cream text-dargah-green' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <item.icon className="w-6 h-6" />
                  {item.name}
                </NavLink>
              ))}
            </div>

            {/* Logout */}
            <div className="px-4 pb-6 pt-2 border-t border-slate-100 mt-2">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-6 h-6" />
                लॉगआउट
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
