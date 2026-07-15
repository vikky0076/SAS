import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiUser, FiHash, FiBookOpen } from 'react-icons/fi';

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, registerGoogleUser } = useAuth();
  const navigate = useNavigate();

  // Complete Profile States (for first-time Google logins)
  const [googleUser, setGoogleUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [role, setRole] = useState('student');
  const [regNo, setRegNo] = useState('');
  const [dept, setDept] = useState('');
  const [year, setYear] = useState(1);
  const [adminSecret, setAdminSecret] = useState('');
  const [completeLoading, setCompleteLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter all fields');
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success(`Welcome back, ${result.user.name}!`);
      if (result.user.role === 'student' && result.user.deviceMismatch) {
        toast.error('New device detected! Attendance is locked until approved.', { duration: 6000 });
      }
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);

    if (result.success) {
      if (result.isNewUser) {
        setGoogleUser(result.firebaseUser);
        setShowProfileModal(true);
      } else {
        toast.success(`Welcome back, ${result.user.name}!`);
        if (result.user.role === 'student' && result.user.deviceMismatch) {
          toast.error('New device detected! Attendance is locked until approved.', { duration: 6000 });
        }
        navigate('/dashboard');
      }
    } else {
      toast.error(result.message);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!dept) {
      return toast.error('Department is required');
    }
    if (role === 'student' && !regNo) {
      return toast.error('Register Number is required');
    }

    setCompleteLoading(true);
    const details = {
      name: googleUser.displayName || 'Google User',
      department: dept,
      registerNumber: regNo,
      year: parseInt(year),
      adminSecret
    };

    const res = await registerGoogleUser(googleUser, role, details);
    setCompleteLoading(false);

    if (res.success) {
      toast.success('Profile registration complete!');
      setShowProfileModal(false);
      navigate('/dashboard');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-height-viewport flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary-500/20 mb-3">
            S
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Smart Attendance System</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">Sign in to access your dashboard</p>
        </div>

        <div className="glass-card p-8 space-y-6">
          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 w-5 h-5" />
                <input
                  type="email"
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-400">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-primary-500 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 w-5 h-5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-11"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && <FiArrowRight className="w-4 h-4" />}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-slate-200/50 dark:border-slate-800/50"></div>
            <span className="px-3 text-xs font-semibold text-slate-400 uppercase">or</span>
            <div className="flex-grow border-t border-slate-200/50 dark:border-slate-800/50"></div>
          </div>

          {/* Google Sign-in */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-sm transition-all disabled:opacity-50"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </motion.button>

          <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-center">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-450">Don't have an account? </span>
            <Link to="/register" className="text-sm font-bold text-primary-500 hover:underline">Register here</Link>
          </div>
        </div>
      </motion.div>

      {/* Complete Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="glass-card max-w-md w-full p-8 space-y-6 shadow-2xl relative"
            >
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-850 dark:text-white">Complete Your Profile</h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Please enter your academic portal details below</p>
              </div>

              <form onSubmit={handleCompleteProfile} className="space-y-4">
                {/* Role Switcher */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">I am a</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`py-2 rounded-lg font-bold text-xs border transition-all ${
                        role === 'student'
                          ? 'bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('teacher')}
                      className={`py-2 rounded-lg font-bold text-xs border transition-all ${
                        role === 'teacher'
                          ? 'bg-primary-500/10 border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      Faculty Member
                    </button>
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">Department</label>
                  <div className="relative">
                    <FiBookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      className="glass-input w-full pl-10 text-xs py-2"
                      required
                    />
                  </div>
                </div>

                {role === 'student' ? (
                  <>
                    {/* Register Number */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450">Register Number</label>
                      <div className="relative">
                        <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="e.g. 3122215001"
                          value={regNo}
                          onChange={(e) => setRegNo(e.target.value)}
                          className="glass-input w-full pl-10 text-xs py-2"
                          required
                        />
                      </div>
                    </div>

                    {/* Academic Year */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450">Current Year</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="glass-input w-full text-xs py-2"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>
                  </>
                ) : (
                  /* Admin passcode secret */
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450">Passcode Secret (Admins only)</label>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 w-4 h-4" />
                      <input
                        type="password"
                        placeholder="Leave blank for regular Teacher role"
                        value={adminSecret}
                        onChange={(e) => setAdminSecret(e.target.value)}
                        className="glass-input w-full pl-10 text-xs py-2"
                      />
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={completeLoading}
                  className="w-full mt-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-500/10 transition-all disabled:opacity-50"
                >
                  {completeLoading ? 'Saving details...' : 'Submit Profile'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
