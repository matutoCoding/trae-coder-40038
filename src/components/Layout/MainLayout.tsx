import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  Beaker,
  Droplets,
  Waves,
  Scissors,
  Sparkles,
  Warehouse,
  Bell,
  Settings,
  User,
  Clock,
  Menu,
  X,
  GitBranch,
} from 'lucide-react';
import { useProductionStore } from '@/store/useProductionStore';

const navItems = [
  { path: '/', label: '总览仪表盘', icon: LayoutDashboard },
  { path: '/tracing', label: '浇次跟踪', icon: GitBranch },
  { path: '/ladle', label: '钢包接收', icon: Flame },
  { path: '/tundish', label: '中间包浇铸', icon: Beaker },
  { path: '/mold', label: '结晶器', icon: Droplets },
  { path: '/secondary-cooling', label: '二冷拉矫', icon: Waves },
  { path: '/cutting', label: '定尺切割', icon: Scissors },
  { path: '/cleaning', label: '表面清理', icon: Sparkles },
  { path: '/warehouse', label: '板坯入库', icon: Warehouse },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTime, alerts } = useProductionStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const unresolvedAlerts = alerts.filter((a) => !a.resolved).length;

  return (
    <div className="min-h-screen bg-steel-950 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-60' : 'w-16'
        } bg-steel-900 border-r border-steel-700/50 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-steel-700/50">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-industrial-400 to-industrial-600 rounded flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-sm">连铸车间</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-steel-400 hover:text-white transition-colors p-1"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                title={item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </div>
            );
          })}
        </nav>

        {/* User Section */}
        {sidebarOpen && (
          <div className="p-4 border-t border-steel-700/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-industrial-700 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">张工程师</p>
                <p className="text-xs text-steel-400 truncate">工艺工程师</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-steel-900/80 border-b border-steel-700/50 flex items-center justify-between px-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">
              {navItems.find((item) => item.path === location.pathname)?.label || '连铸车间管理系统'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Time */}
            <div className="flex items-center gap-2 text-steel-300">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{currentTime}</span>
            </div>

            {/* Alerts */}
            <button className="relative p-2 text-steel-300 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {unresolvedAlerts > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                  {unresolvedAlerts}
                </span>
              )}
            </button>

            {/* Settings */}
            <button className="p-2 text-steel-300 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
