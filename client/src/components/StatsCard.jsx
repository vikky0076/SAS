import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon: Icon, description, trend, colorClass = "from-primary-500 to-indigo-600" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-6 flex items-center justify-between relative overflow-hidden group"
    >
      <div className="space-y-2 z-10">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">{title}</span>
        <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{value}</h3>
        {description && (
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{description}</p>
        )}
      </div>

      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${colorClass} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Decorative gradient glow in background */}
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-primary-500/5 blur-2xl group-hover:bg-primary-500/10 transition-all duration-500"></div>
    </motion.div>
  );
};

export default StatsCard;
