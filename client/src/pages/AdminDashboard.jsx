import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Users, BookOpen, Settings, BarChart2, Plus, Trash2, 
  RefreshCw, LogOut, CheckCircle, ShieldAlert, Key, UserCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'teachers', 'students', 'subjects'

  // Stats / Analytics States
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalAttendance: 0,
    totalSessions: 0,
    pendingDeviceRequests: 0
  });

  // Data Lists
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Forms / Modals
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tDept, setTDept] = useState('');

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [sName, setSName] = useState('');
  const [sReg, setSReg] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPassword, setSPassword] = useState('');
  const [sDept, setSDept] = useState('');
  const [sYear, setSYear] = useState('1st Year');

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subTeacherId, setSubTeacherId] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Analytics
      const analRes = await api.get('/admin/analytics');
      setAnalytics(analRes.data.analytics);

      // 2. Teachers
      const teachRes = await api.get('/admin/teachers');
      setTeachers(teachRes.data.teachers);

      // 3. Students
      const studRes = await api.get('/admin/students');
      setStudents(studRes.data.students);

      // 4. Subjects
      const subjRes = await api.get('/admin/subjects');
      setSubjects(subjRes.data.subjects);
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync administrative tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  // CREATE handlers
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!tName || !tEmail || !tPassword || !tDept) return toast.error('Fill in all fields');
    try {
      await api.post('/admin/teachers', { name: tName, email: tEmail, password: tPassword, department: tDept });
      toast.success('Teacher added successfully!');
      setShowTeacherModal(false);
      resetTeacherForm();
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add teacher');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!sName || !sReg || !sEmail || !sPassword || !sDept) return toast.error('Fill in all fields');
    try {
      await api.post('/admin/students', { 
        name: sName, registerNumber: sReg, email: sEmail, password: sPassword, department: sDept, year: sYear 
      });
      toast.success('Student added successfully!');
      setShowStudentModal(false);
      resetStudentForm();
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!subName || !subCode || !subTeacherId) return toast.error('Fill in all fields');
    try {
      await api.post('/admin/subjects', { name: subName, code: subCode, teacherId: subTeacherId });
      toast.success('Subject created successfully!');
      setShowSubjectModal(false);
      resetSubjectForm();
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subject');
    }
  };

  // DELETE handlers
  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Delete this teacher and all subjects they teach?')) return;
    try {
      await api.delete(`/admin/teachers/${id}`);
      toast.success('Teacher deleted');
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to delete teacher');
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Delete this student and all their attendance history?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student deleted');
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject and all attendance records?')) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      toast.success('Subject deleted');
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to delete subject');
    }
  };

  // Device reset
  const handleResetDevice = async (id) => {
    if (!window.confirm('Reset this student\'s device token? They can re-register their next device immediately.')) return;
    try {
      await api.post(`/admin/students/${id}/reset-device`);
      toast.success('Device token successfully cleared');
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to reset device token');
    }
  };

  // Form helpers
  const resetTeacherForm = () => { setTName(''); setTEmail(''); setTPassword(''); setTDept(''); };
  const resetStudentForm = () => { setSName(''); setSReg(''); setSEmail(''); setSPassword(''); setSDept(''); setSYear('1st Year'); };
  const resetSubjectForm = () => { setSubName(''); setSubCode(''); if(teachers.length > 0) setSubTeacherId(teachers[0]._id); };

  useEffect(() => {
    if (teachers.length > 0 && !subTeacherId) {
      setSubTeacherId(teachers[0]._id);
    }
  }, [teachers]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-primary-400" />
              <span className="ml-2 font-bold tracking-wider text-lg">ADMIN CONTROL CENTRE</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full font-bold uppercase">Root Admin</span>
              <button 
                onClick={logout}
                className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Tab Controls */}
        <div className="flex border-b border-white/10 mb-8">
          {['analytics', 'teachers', 'students', 'subjects'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-6 text-sm font-medium capitalize border-b-2 transition-all ${
                activeTab === tab 
                  ? 'border-primary-500 text-primary-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'analytics' ? 'Dashboard Summary' : `Manage ${tab}`}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Card 1: Students */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Total Students</span>
                  <h3 className="text-3xl font-extrabold mt-1">{analytics.totalStudents}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
                  <Users size={22} />
                </div>
              </div>

              {/* Card 2: Teachers */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Total Teachers</span>
                  <h3 className="text-3xl font-extrabold mt-1">{analytics.totalTeachers}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Users size={22} />
                </div>
              </div>

              {/* Card 3: Subjects */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Total Subjects</span>
                  <h3 className="text-3xl font-extrabold mt-1">{analytics.totalSubjects}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <BookOpen size={22} />
                </div>
              </div>

              {/* Card 4: Attendance Records */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Present Logs Saved</span>
                  <h3 className="text-3xl font-extrabold mt-1">{analytics.totalAttendance}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <CheckCircle size={22} />
                </div>
              </div>

              {/* Card 5: Attendance Sessions */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Total Sessions Run</span>
                  <h3 className="text-3xl font-extrabold mt-1">{analytics.totalSessions}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <BarChart2 size={22} />
                </div>
              </div>

              {/* Card 6: Pending Device Requests */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Pending Device Approvals</span>
                  <h3 className="text-3xl font-extrabold mt-1 text-amber-400">{analytics.pendingDeviceRequests}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <ShieldAlert size={22} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'teachers' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Faculty Members</h3>
                <button
                  onClick={() => setShowTeacherModal(true)}
                  className="flex items-center gap-1 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold hover:bg-primary-700"
                >
                  <Plus size={16} /> Add Teacher
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-3 rounded-l-lg">Name</th>
                      <th className="px-6 py-3">Email Address</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3 rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="px-6 py-4 font-semibold">{t.name}</td>
                        <td className="px-6 py-4">{t.email}</td>
                        <td className="px-6 py-4">{t.department}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteTeacher(t._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Registered Students</h3>
                <button
                  onClick={() => setShowStudentModal(true)}
                  className="flex items-center gap-1 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold hover:bg-primary-700"
                >
                  <Plus size={16} /> Add Student
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-3 rounded-l-lg">Name</th>
                      <th className="px-6 py-3">Reg. Number</th>
                      <th className="px-6 py-3">Email Address</th>
                      <th className="px-6 py-3">Dept / Year</th>
                      <th className="px-6 py-3">Device Status</th>
                      <th className="px-6 py-3 rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="px-6 py-4 font-semibold">{s.name}</td>
                        <td className="px-6 py-4">{s.registerNumber}</td>
                        <td className="px-6 py-4 text-xs">{s.email}</td>
                        <td className="px-6 py-4 text-xs">{s.department} • {s.year}</td>
                        <td className="px-6 py-4">
                          {s.trustedDeviceToken ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] font-bold text-gray-400 border border-white/10">
                              Unregistered
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          {/* Force device token reset */}
                          <button
                            onClick={() => handleResetDevice(s._id)}
                            title="Reset Device Token"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                          >
                            <Key size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'subjects' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Curriculum Subjects</h3>
                <button
                  onClick={() => setShowSubjectModal(true)}
                  className="flex items-center gap-1 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold hover:bg-primary-700"
                >
                  <Plus size={16} /> Add Subject
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-3 rounded-l-lg">Subject Name</th>
                      <th className="px-6 py-3">Subject Code</th>
                      <th className="px-6 py-3">Assigned Faculty</th>
                      <th className="px-6 py-3 rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub) => (
                      <tr key={sub._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="px-6 py-4 font-semibold">{sub.name}</td>
                        <td className="px-6 py-4">{sub.code}</td>
                        <td className="px-6 py-4">{sub.teacher?.name || 'Unassigned'}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteSubject(sub._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODALS */}
      {/* 1. Add Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form onSubmit={handleAddTeacher} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Register New Faculty</h3>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
              <input type="text" value={tName} onChange={e => setTName(e.target.value)} placeholder="Dr. Sarah Connor" className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm outline-none" />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address</label>
              <input type="email" value={tEmail} onChange={e => setTEmail(e.target.value)} placeholder="sarah@college.edu" className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm outline-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Password</label>
              <input type="password" value={tPassword} onChange={e => setTPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm outline-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Department</label>
              <input type="text" value={tDept} onChange={e => setTDept(e.target.value)} placeholder="CSE" className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm outline-none" />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button type="button" onClick={() => setShowTeacherModal(false)} className="rounded-lg bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10">Cancel</button>
              <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold hover:bg-primary-700">Save Teacher</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Add Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form onSubmit={handleAddStudent} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Register New Student</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
                <input type="text" value={sName} onChange={e => setSName(e.target.value)} placeholder="Alex Mercer" className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Reg. Number</label>
                <input type="text" value={sReg} onChange={e => setSReg(e.target.value)} placeholder="910022" className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm outline-none" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address</label>
              <input type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} placeholder="alex@college.edu" className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm outline-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Password</label>
              <input type="password" value={sPassword} onChange={e => setSPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Department</label>
                <input type="text" value={sDept} onChange={e => setSDept(e.target.value)} placeholder="ECE" className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Year</label>
                <select value={sYear} onChange={e => setSYear(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#0f172a] py-2 px-3 text-sm outline-none">
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button type="button" onClick={() => setShowStudentModal(false)} className="rounded-lg bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10">Cancel</button>
              <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold hover:bg-primary-700">Save Student</button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Add Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form onSubmit={handleAddSubject} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Create New Subject</h3>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Subject Name</label>
              <input type="text" value={subName} onChange={e => setSubName(e.target.value)} placeholder="Theory of Computation" className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm outline-none" />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Subject Code</label>
              <input type="text" value={subCode} onChange={e => setSubCode(e.target.value)} placeholder="CS6503" className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm outline-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Assign Teacher</label>
              <select
                value={subTeacherId}
                onChange={e => setSubTeacherId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0f172a] py-2.5 px-3 text-sm outline-none"
              >
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.department})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button type="button" onClick={() => setShowSubjectModal(false)} className="rounded-lg bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10">Cancel</button>
              <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold hover:bg-primary-700">Create Subject</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
