import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiUsers, FiEdit2, FiTrash2, FiSave, FiX, FiRefreshCw, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { TableSkeleton } from '../components/LoadingSkeleton';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editReg, setEditReg] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editYear, setEditYear] = useState(1);
  const [editApproved, setEditApproved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'students'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      // Sort by creation time descending (or name)
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
      setStudents(list);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (s) => {
    setEditId(s._id);
    setEditName(s.name);
    setEditEmail(s.email);
    setEditReg(s.registerNumber);
    setEditDept(s.department);
    setEditYear(s.year);
    setEditApproved(s.deviceApproved);
  };

  const handleCancelEdit = () => {
    setEditId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editName || !editEmail || !editReg || !editDept) {
      return toast.error('All fields are required');
    }

    setActionLoading(true);
    try {
      const studentRef = doc(db, 'students', editId);
      await updateDoc(studentRef, {
        name: editName,
        email: editEmail,
        registerNumber: editReg,
        department: editDept,
        year: parseInt(editYear),
        deviceApproved: editApproved,
        updatedAt: new Date().toISOString()
      });

      toast.success('Student updated successfully!');
      setEditId(null);
      fetchStudents();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDevice = async (id) => {
    if (!window.confirm("Are you sure you want to reset this student's device link? This will clear their registered device token. They will register a new device upon their next login.")) return;
    
    setActionLoading(true);
    try {
      const studentRef = doc(db, 'students', id);
      await updateDoc(studentRef, {
        trustedDeviceToken: null,
        deviceApproved: false,
        updatedAt: new Date().toISOString()
      });

      toast.success('Device reset successfully! The student can now link a new device.');
      fetchStudents();
    } catch (error) {
      console.error('Reset failed:', error);
      toast.error('Reset failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? All related attendance logs and device requests will be deleted permanently.')) return;

    try {
      // 1. Delete student profile doc
      await deleteDoc(doc(db, 'students', id));
      
      // 2. Cascade delete attendance logs for this student
      const attendanceQuery = query(collection(db, 'attendance'), where('student._id', '==', id));
      const attendanceSnap = await getDocs(attendanceQuery);
      for (const d of attendanceSnap.docs) {
        await deleteDoc(doc(db, 'attendance', d.id));
      }

      // 3. Cascade delete device requests for this student
      const requestsQuery = query(collection(db, 'deviceRequests'), where('student._id', '==', id));
      const requestsSnap = await getDocs(requestsQuery);
      for (const d of requestsSnap.docs) {
        await deleteDoc(doc(db, 'deviceRequests', d.id));
      }

      toast.success('Student and related records deleted successfully');
      setStudents(students.filter(s => s._id !== id));
    } catch (error) {
      console.error('Delete student failed:', error);
      toast.error('Failed to delete student');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <FiUsers className="text-primary-500" />
          <span>Student Directory</span>
        </h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Manage enrolled student profiles, attendance scores, and device approvals</p>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : students.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-450">No student records found in the database.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-850">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Name / Reg No</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Email</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Dept / Year</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-550 text-center">Attendance</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Device Status</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-550 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-55/20 dark:hover:bg-slate-900/10">
                    {editId === s._id ? (
                      // EDITING ROW MODE
                      <>
                        <td className="px-5 py-3.5 text-sm space-y-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="glass-input w-full text-sm py-1 px-2"
                            required
                          />
                          <input
                            type="text"
                            value={editReg}
                            onChange={(e) => setEditReg(e.target.value)}
                            className="glass-input w-full text-xs py-1 px-2"
                            required
                          />
                        </td>
                        <td className="px-5 py-3.5 text-sm">
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="glass-input w-full text-sm py-1 px-2"
                            required
                          />
                        </td>
                        <td className="px-5 py-3.5 text-sm space-y-1">
                          <input
                            type="text"
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            className="glass-input w-full text-xs py-1 px-2"
                            required
                          />
                          <select
                            value={editYear}
                            onChange={(e) => setEditYear(e.target.value)}
                            className="glass-input w-full text-xs py-1 px-2"
                          >
                            <option value={1}>Year 1</option>
                            <option value={2}>Year 2</option>
                            <option value={3}>Year 3</option>
                            <option value={4}>Year 4</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-center font-bold">
                          {s.attendancePercentage}%
                        </td>
                        <td className="px-5 py-3.5 text-sm">
                          <label className="flex items-center space-x-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editApproved}
                              onChange={(e) => setEditApproved(e.target.checked)}
                              className="w-4 h-4 text-primary-500 rounded border-slate-350 dark:border-slate-800"
                            />
                            <span className="text-xs font-semibold text-slate-500">Approved</span>
                          </label>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={handleSave}
                            disabled={actionLoading}
                            className="p-1.5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all"
                            title="Save changes"
                          >
                            <FiSave className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 rounded bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 transition-all"
                            title="Cancel edit"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      // VIEW ROW MODE
                      <>
                        <td className="px-5 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                          <div>
                            <span>{s.name}</span>
                            <span className="text-[10px] font-semibold text-slate-450 block">{s.registerNumber}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{s.email}</td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-650 dark:text-slate-400">
                          {s.department} • Yr {s.year}
                        </td>
                        <td className="px-5 py-4 text-sm text-center">
                          <span className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                            s.attendancePercentage >= 75
                              ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-600 dark:bg-red-500/20'
                          }`}>
                            {s.attendancePercentage}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {s.trustedDeviceToken ? (
                            <div className="flex items-center space-x-1">
                              {s.deviceApproved ? (
                                <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                  <FiCheckCircle />
                                  <span>Linked</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                                  <FiAlertTriangle />
                                  <span>Mismatch</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400 italic">No Device Linked</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-right space-x-1.5 whitespace-nowrap">
                          {s.trustedDeviceToken && (
                            <button
                              onClick={() => handleResetDevice(s._id)}
                              disabled={actionLoading}
                              className="text-amber-500 hover:text-amber-650 p-1.5 rounded bg-amber-550/10 hover:bg-amber-500/25 transition-all"
                              title="Reset Linked Device Token"
                            >
                              <FiRefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(s)}
                            className="text-primary-500 hover:text-primary-650 p-1.5 rounded bg-primary-500/10 hover:bg-primary-500/20 transition-all"
                            title="Edit details"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="text-red-500 hover:text-red-650 p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 transition-all"
                            title="Delete Student"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </>
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

export default ManageStudents;
