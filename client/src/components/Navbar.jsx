import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiUser, FiSmartphone } from 'react-icons/fi';
import DarkModeToggle from './DarkModeToggle';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="glass-nav sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">
          S
        </div>
        <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-350 tracking-tight">
          SmartAttend
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3 pr-2 border-r border-slate-200 dark:border-slate-800">
            {user.role === 'student' && (
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400">
                <FiSmartphone className="w-3.5 h-3.5" />
                <span>{user.deviceApproved ? 'Device Linked' : 'Device Unapproved'}</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
              <p className="text-xs font-medium text-slate-500 capitalize">{user.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <FiUser className="w-5 h-5" />
            </div>
          </div>
        )}

        <DarkModeToggle />

        {user && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-lg shadow-red-500/15 transition-all"
          >
            <FiLogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
