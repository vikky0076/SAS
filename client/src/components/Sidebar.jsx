import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid,
  FiCamera,
  FiCalendar,
  FiBookOpen,
  FiSmartphone,
  FiUsers,
  FiFileText,
  FiPlay
} from 'react-icons/fi';

const Sidebar = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Define links based on user role
  const getLinks = () => {
    switch (user.role) {
      case 'student':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
          { to: '/scan', label: 'Scan QR Code', icon: FiCamera },
          { to: '/history', label: 'Attendance History', icon: FiCalendar },
          { to: '/device-status', label: 'Device Status', icon: FiSmartphone }
        ];
      case 'teacher':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
          { to: '/subjects', label: 'Manage Subjects', icon: FiBookOpen },
          { to: '/start-session', label: 'Start Session', icon: FiPlay },
          { to: '/device-requests', label: 'Device Requests', icon: FiSmartphone },
          { to: '/reports', label: 'Export Reports', icon: FiFileText }
        ];
      case 'admin':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
          { to: '/manage-teachers', label: 'Manage Teachers', icon: FiUsers },
          { to: '/manage-students', label: 'Manage Students', icon: FiUsers },
          { to: '/manage-subjects', label: 'Manage Subjects', icon: FiBookOpen },
          { to: '/device-requests', label: 'Device Requests', icon: FiSmartphone }
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-full md:w-64 bg-white/40 dark:bg-slate-950/40 border-r border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
      <nav className="p-4 space-y-1.5 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                    : 'text-slate-650 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
