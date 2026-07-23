import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiBookOpen, FiPlus, FiTrash } from 'react-icons/fi';
import { CardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';

const ManageSubjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState(1);
  const [teacherId, setTeacherId] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchSubjects();
      if (user.role === 'admin') {
        fetchTeachers();
      }
    }
  }, [user]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      let q;
      if (user.role === 'teacher') {
        q = query(collection(db, 'subjects'), where('teacher._id', '==', user._id));
      } else {
        q = query(collection(db, 'subjects'));
      }
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      setSubjects(list);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const q = query(collection(db, 'teachers'), where('role', '==', 'teacher'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      setTeachers(list);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load teacher records');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !code || !department || !year) {
      return toast.error('All fields are required');
    }
    if (user.role === 'admin' && !teacherId) {
      return toast.error('Please assign this subject to a teacher');
    }

    setFormLoading(true);
    try {
      // Check if subject code already exists
      const codeCheckQuery = query(collection(db, 'subjects'), where('code', '==', code.toUpperCase()));
      const codeCheckSnap = await getDocs(codeCheckQuery);
      if (!codeCheckSnap.empty) {
        toast.error('Subject with this code already exists');
        setFormLoading(false);
        return;
      }

      let teacherData = null;
      if (user.role === 'admin') {
        const teacherDoc = await getDoc(doc(db, 'teachers', teacherId));
        if (teacherDoc.exists()) {
          const tData = teacherDoc.data();
          teacherData = {
            _id: teacherId,
            name: tData.name,
            email: tData.email,
            department: tData.department
          };
        } else {
          toast.error('Assigned teacher not found');
          setFormLoading(false);
          return;
        }
      } else {
        teacherData = {
          _id: user._id,
          name: user.name,
          email: user.email,
          department: user.department
        };
      }

      await addDoc(collection(db, 'subjects'), {
        name,
        code: code.toUpperCase(),
        department: department.toUpperCase(),
        year: parseInt(year),
        teacher: teacherData,
        createdAt: new Date().toISOString()
      });

      toast.success('Subject created successfully!');
      setName('');
      setCode('');
      setDepartment('');
      setYear(1);
      setTeacherId('');
      fetchSubjects();
    } catch (error) {
      console.error('Failed to create subject:', error);
      toast.error('Failed to create subject');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject? All related attendance sessions and records will remain, but the subject record will be deleted.')) return;
    
    try {
      await deleteDoc(doc(db, 'subjects', id));
      toast.success('Subject deleted successfully');
      setSubjects(subjects.filter(s => s._id !== id));
    } catch (error) {
      console.error('Failed to delete subject:', error);
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <FiBookOpen className="text-primary-500" />
          <span>Subjects Directory</span>
        </h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Create and allocate courses in the academic portal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Form (Teacher/Admin only) */}
        {(user.role === 'teacher' || user.role === 'admin') && (
          <div>
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                <FiPlus className="text-primary-500" />
                <span>Create Subject</span>
              </h3>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Operating Systems"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS6401"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="glass-input w-full text-sm uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. CSE"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="glass-input w-full text-sm uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450">Target Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="glass-input w-full text-sm py-2"
                      required
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                      <option value={4}>Year 4</option>
                    </select>
                  </div>
                </div>

                {user.role === 'admin' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450">Assign Teacher</label>
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="glass-input w-full text-sm"
                      required
                    >
                      <option value="">-- Choose Instructor --</option>
                      {teachers.map((t) => (
                        <option key={t._id} value={t._id}>{t.name} ({t.department})</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/10 transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Creating...' : 'Add Subject'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Subjects List */}
        <div className="lg:col-span-2">
          {loading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : subjects.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-450">No subjects created yet.</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-850">
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Subject Name</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Subject Code</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Dept / Year</th>
                    {user.role === 'admin' && (
                      <>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-550">Assigned Teacher</th>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-550 text-right">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                  {subjects.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-55/20 dark:hover:bg-slate-900/10">
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200">{sub.name}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-500 dark:text-slate-400">{sub.code}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-500 dark:text-slate-400">{sub.department || 'N/A'} • Yr {sub.year || 'N/A'}</td>
                      {user.role === 'admin' && (
                        <>
                          <td className="px-5 py-3.5 text-sm font-medium text-slate-650 dark:text-slate-400">{sub.teacher?.name || 'Unassigned'}</td>
                          <td className="px-5 py-3.5 text-sm text-right">
                            <button
                              onClick={() => handleDelete(sub._id)}
                              className="text-red-500 hover:text-red-650 p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 transition-all"
                            >
                              <FiTrash className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageSubjects;
