import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiUsers, FiEdit2, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { TableSkeleton } from '../components/LoadingSkeleton';

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Editing state
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editRole, setEditRole] = useState('teacher');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const teachersQuery = query(collection(db, 'teachers'));
      const adminsQuery = query(collection(db, 'admins'));

      const [teachersSnap, adminsSnap] = await Promise.all([
        getDocs(teachersQuery),
        getDocs(adminsQuery)
      ]);

      const teachersList = teachersSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
      const adminsList = adminsSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

      const combined = [...teachersList, ...adminsList];
      combined.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      setTeachers(combined);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (t) => {
    setEditId(t._id);
    setEditName(t.name);
    setEditEmail(t.email);
    setEditDept(t.department);
    setEditRole(t.role);
  };

  const handleCancelEdit = () => {
    setEditId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editName || !editEmail || !editDept) {
      return toast.error('All fields are required');
    }

    setActionLoading(true);
    try {
      const original = teachers.find(t => t._id === editId);
      const roleChanged = original.role !== editRole;

      if (roleChanged) {
        // Delete from the old collection
        await deleteDoc(doc(db, original.role === 'admin' ? 'admins' : 'teachers', editId));
        // Save to the new collection
        await setDoc(doc(db, editRole === 'admin' ? 'admins' : 'teachers', editId), {
          name: editName,
          email: editEmail,
          department: editDept,
          role: editRole,
          createdAt: original.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Update in the current collection
        const ref = doc(db, editRole === 'admin' ? 'admins' : 'teachers', editId);
        await updateDoc(ref, {
          name: editName,
          email: editEmail,
          department: editDept,
          updatedAt: new Date().toISOString()
        });
      }

      toast.success('Teacher updated successfully!');
      setEditId(null);
      fetchTeachers();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const original = teachers.find(t => t._id === id);
    if (!original) return;

    if (original.role === 'admin') {
      const adminsQuery = query(collection(db, 'admins'));
      const adminsSnap = await getDocs(adminsQuery);
      if (adminsSnap.size <= 1) {
        return toast.error('Cannot delete the last remaining Admin');
      }
    }

    if (!window.confirm('Are you sure you want to delete this teacher? All subjects assigned to them will need a new instructor assigned.')) return;

    try {
      // 1. Delete from collection
      await deleteDoc(doc(db, original.role === 'admin' ? 'admins' : 'teachers', id));

      // 2. Dissociate teacher from subjects
      const subjectsQuery = query(collection(db, 'subjects'), where('teacher._id', '==', id));
      const subjectsSnap = await getDocs(subjectsQuery);
      for (const docSnapshot of subjectsSnap.docs) {
        await updateDoc(doc(db, 'subjects', docSnapshot.id), {
          teacher: null
        });
      }

      toast.success('Teacher deleted successfully');
      setTeachers(teachers.filter(t => t._id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <FiUsers className="text-primary-500" />
          <span>Faculty Directory</span>
        </h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">View and manage college teachers and administrators</p>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : teachers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-450">No teachers found in the database.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-850">
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Email</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Department</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">System Role</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-550 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                {teachers.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-55/20 dark:hover:bg-slate-900/10">
                    {editId === t._id ? (
                      // EDITING ROW MODE
                      <>
                        <td className="px-6 py-3 text-sm">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="glass-input w-full text-sm py-1 px-2"
                            required
                          />
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="glass-input w-full text-sm py-1 px-2"
                            required
                          />
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <input
                            type="text"
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            className="glass-input w-full text-sm py-1 px-2"
                            required
                          />
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="glass-input w-full text-sm py-1 px-2"
                          >
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-3 text-sm text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={handleSave}
                            disabled={actionLoading}
                            className="p-1.5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all"
                          >
                            <FiSave className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 rounded bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 transition-all"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      // VIEW ROW MODE
                      <>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{t.name}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{t.email}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-650 dark:text-slate-400">{t.department}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            t.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20'
                          }`}>
                            {t.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEditClick(t)}
                            className="text-primary-500 hover:text-primary-650 p-1.5 rounded bg-primary-500/10 hover:bg-primary-500/20 transition-all"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t._id)}
                            className="text-red-500 hover:text-red-650 p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 transition-all"
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

export default ManageTeachers;
