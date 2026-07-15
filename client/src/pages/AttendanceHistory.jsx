import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiFilter, FiCheckCircle, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { TableSkeleton } from '../components/LoadingSkeleton';

const AttendanceHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (user?._id) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      let records = [];

      if (user.role === 'student') {
        const q = query(
          collection(db, 'attendance'),
          where('student._id', '==', user._id)
        );
        const snap = await getDocs(q);
        records = snap.docs.map(doc => ({
          _id: doc.id,
          ...doc.data()
        }));
      } else if (user.role === 'teacher') {
        // 1. Fetch teacher subjects
        const subjectsQuery = query(
          collection(db, 'subjects'),
          where('teacher._id', '==', user._id)
        );
        const subjectsSnap = await getDocs(subjectsQuery);
        const subjectIds = subjectsSnap.docs.map(doc => doc.id);

        // 2. Fetch attendance if teacher has subjects
        if (subjectIds.length > 0) {
          const q = query(
            collection(db, 'attendance'),
            where('subject._id', 'in', subjectIds)
          );
          const snap = await getDocs(q);
          records = snap.docs.map(doc => ({
            _id: doc.id,
            ...doc.data()
          }));
        }
      } else if (user.role === 'admin') {
        const q = query(collection(db, 'attendance'));
        const snap = await getDocs(q);
        records = snap.docs.map(doc => ({
          _id: doc.id,
          ...doc.data()
        }));
      }

      // Sort by date desc
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(records);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredHistory = history.filter((item) => {
    const subjectName = item.subject?.name || '';
    const subjectCode = item.subject?.code || '';
    const studentName = item.student?.name || '';
    const studentReg = item.student?.registerNumber || '';
    
    const matchesSearch = 
      subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentReg.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
            <FiCalendar className="text-primary-500" />
            <span>Attendance Logs</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {user.role === 'student' ? 'View your full attendance logs' : 'Track and audit students checkins'}
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="flex items-center space-x-1 px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shadow-sm transition-all"
        >
          <FiRefreshCw />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters Area */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder={user.role === 'student' ? "Search by subject name or code..." : "Search by student name, reg no, or subject..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-10 text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input w-full pl-10 text-sm appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
      </div>

      {/* Data Content */}
      {loading ? (
        <TableSkeleton rows={6} cols={user.role === 'student' ? 4 : 6} />
      ) : filteredHistory.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No logs found matching your filters.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  {user.role !== 'student' && (
                    <>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Student</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Reg No</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Subject</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Time</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {filteredHistory.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    {user.role !== 'student' && (
                      <>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{row.student?.name}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{row.student?.registerNumber}</td>
                      </>
                    )}
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                      <div>
                        <span>{row.subject?.name}</span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 block">{row.subject?.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-650 dark:text-slate-400">
                      {new Date(row.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-550 dark:text-slate-450">{row.time}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        row.status === 'Present'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                      }`}>
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        <span>{row.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {filteredHistory.map((row) => (
              <div key={row._id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-850 dark:text-slate-200">{row.subject?.name}</h4>
                    <p className="text-[10px] font-semibold text-slate-500">{row.subject?.code}</p>
                    {user.role !== 'student' && (
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                        {row.student?.name} ({row.student?.registerNumber})
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    row.status === 'Present'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 dark:bg-red-500/20'
                  }`}>
                    {row.status}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-450 dark:text-slate-500">
                  <span>{new Date(row.date).toLocaleDateString()}</span>
                  <span>{row.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
