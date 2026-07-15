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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#FF3B3B] flex items-center justify-center text-white font-bold text-xl shadow-md shadow-orange-500/20 glow-orange">
          S
        </div>
        <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] tracking-tight">
          SmartAttend
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3 pr-2 border-r border-orange-100">
            {user.role === 'student' && (
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                <FiSmartphone className="w-3.5 h-3.5" />
                <span>{user.deviceApproved ? 'Device Linked' : 'Device Unapproved'}</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{user.name}</p>
              <p className="text-xs font-semibold text-slate-500 capitalize">{user.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00]">
              <FiUser className="w-5 h-5" />
            </div>
          </div>
        )}

        <DarkModeToggle />

        {user && (
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 12px rgba(255, 59, 59, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF3B3B] to-[#E12D2D] hover:from-[#FF4D4D] hover:to-[#EF3E3E] text-white font-semibold text-sm shadow-md transition-all"
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
