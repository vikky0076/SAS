import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiSmartphone, FiCheck, FiX, FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { TableSkeleton } from '../components/LoadingSkeleton';

const DeviceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'deviceRequests'),
        where('status', '==', statusFilter)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      data.sort((a, b) => new Date(b.requestedTime) - new Date(a.requestedTime));
      setRequests(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load device requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this request as ${status.toLowerCase()}?`)) return;

    setActionLoading(true);
    try {
      const requestRef = doc(db, 'deviceRequests', id);
      const requestSnap = await getDoc(requestRef);
      if (requestSnap.exists()) {
        const requestData = requestSnap.data();
        await updateDoc(requestRef, { status });

        if (status === 'Approved') {
          const studentRef = doc(db, 'students', requestData.student._id);
          await updateDoc(studentRef, {
            trustedDeviceToken: requestData.newToken,
            deviceApproved: true
          });
        }

        toast.success(`Request ${status.toLowerCase()} successfully!`);
        setRequests(requests.filter(r => r._id !== id));
      }
    } catch (error) {
      console.error('Device request update error:', error);
      toast.error('Failed to update request');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const name = req.student?.name || '';
    const regNum = req.student?.registerNumber || '';
    const dept = req.student?.department || '';
    
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      regNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
            <FiSmartphone className="text-primary-500" />
            <span>Device Verification Requests</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Review and authorize student hardware linked tokens</p>
        </div>

        <button
          onClick={fetchRequests}
          className="flex items-center space-x-1 px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shadow-sm transition-all"
        >
          <FiRefreshCw />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters Area */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by student name, register number, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-10 text-sm"
          />
        </div>

        <div className="relative">
          <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input w-full pl-10 text-sm appearance-none"
          >
            <option value="Pending">Pending Approval</option>
            <option value="Approved">Approved Log</option>
            <option value="Rejected">Rejected Log</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : filteredRequests.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-450">No device requests found.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-850">
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Student</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Reg No / Dept / Year</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Requested Time</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">New UUID Token</th>
                  {statusFilter === 'Pending' && (
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-550 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-55/20 dark:hover:bg-slate-900/10">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                      <div>
                        <span>{req.student?.name}</span>
                        <span className="text-[10px] font-semibold text-slate-450 block">{req.student?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      <div>
                        <span>{req.student?.registerNumber}</span>
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 block">{req.student?.department} • Year {req.student?.year}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-550 dark:text-slate-450">
                      {new Date(req.requestedTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-800 dark:text-slate-350">
                      {req.newToken}
                    </td>
                    {statusFilter === 'Pending' && (
                      <td className="px-6 py-4 text-sm text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleAction(req._id, 'Approved')}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-650 text-white font-bold text-xs inline-flex items-center space-x-1 shadow-sm transition-all disabled:opacity-50"
                        >
                          <FiCheck />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleAction(req._id, 'Rejected')}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 rounded bg-red-500 hover:bg-red-650 text-white font-bold text-xs inline-flex items-center space-x-1 shadow-sm transition-all disabled:opacity-50"
                        >
                          <FiX />
                          <span>Reject</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceRequests;
