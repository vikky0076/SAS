import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';


const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Register = () => {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');

  // Student specific
  const [registerNumber, setRegisterNumber] = useState('');
  const [year, setYear] = useState(1);
  const [mentorId, setMentorId] = useState('');
  
  // Teacher specific
  const [adminSecret, setAdminSecret] = useState('');

  const [loading, setLoading] = useState(false);
  const { registerStudent, registerTeacher, loginWithGoogle, registerGoogleUser, mentors } = useAuth();
  const navigate = useNavigate();

  // Complete Profile States (for first-time Google logins)
  const [googleUser, setGoogleUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [googleRole, setGoogleRole] = useState('student');
  const [googleRegNo, setGoogleRegNo] = useState('');
  const [googleDept, setGoogleDept] = useState('');
  const [googleYear, setGoogleYear] = useState(1);
  const [googleAdminSecret, setGoogleAdminSecret] = useState('');
  const [googleMentorId, setGoogleMentorId] = useState('');
  const [completeLoading, setCompleteLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !department) {
      return toast.error('Please fill in all general fields');
    }

    setLoading(true);
    let result;

    if (role === 'student') {
      if (!registerNumber || !year) {
        setLoading(false);
        return toast.error('Please fill in student register number and year');
      }
      result = await registerStudent({
        name,
        email,
        registerNumber,
        password,
        department,
        year: parseInt(year),
        mentorId: null
      });
    } else {
      result = await registerTeacher({
        name,
        email,
        password,
        department,
        adminSecret // Optional
      });
    }

    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      navigate('/login');
    } else {
      toast.error(result.message);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);

    if (result.success) {
      if (result.isNewUser) {
        setGoogleUser(result.firebaseUser);
        setShowProfileModal(true);
      } else {
        toast.success(`Welcome back, ${result.user.name}!`);
        navigate('/dashboard');
      }
    } else {
      toast.error(result.message);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!googleDept) {
      return toast.error('Department is required');
    }
    if (googleRole === 'student' && !googleRegNo) {
      return toast.error('Register Number is required');
    }

    setCompleteLoading(true);
    const details = {
      name: googleUser.displayName || 'Google User',
      department: googleDept,
      registerNumber: googleRegNo,
      year: parseInt(googleYear),
      adminSecret: googleAdminSecret,
      mentorId: null
    };

    const res = await registerGoogleUser(googleUser, googleRole, details);
    setCompleteLoading(false);

    if (res.success) {
      toast.success(res.message || 'Profile setup complete!');
      setShowProfileModal(false);
      if (res.isPendingApproval) {
        navigate('/login');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-cover bg-center py-12" 
      style={{ backgroundImage: "url('/classroom_bg.png')" }}
    >
      {/* Dark transparent overlay */}
      <div className="absolute inset-0 bg-slate-950/45 z-0 backdrop-blur-xs"></div>

      {/* Floating particles decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              left: `${Math.random() * 100}%`,
              bottom: `-${Math.random() * 20 + 10}px`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${Math.random() * 15 + 15}s`
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg z-10"
      >
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-[#FF3B3B] items-center justify-center text-white font-black text-3xl shadow-lg shadow-orange-500/30 mb-4 glow-orange"
          >
            S
          </motion.div>
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Create an Account</h2>
          <p className="text-xs font-bold text-orange-200 mt-1 tracking-wider uppercase drop-shadow-sm">Smart Attendance System Registration</p>
        </div>

        <div className="glass-card p-8 space-y-6 glow-orange-border">
          {/* Role Toggle Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                role === 'student'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] text-white shadow'
                  : 'text-slate-500'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                role === 'teacher'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] text-white shadow'
                  : 'text-slate-500'
              }`}
            >
              Teacher / Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input w-full text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="john@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-input w-full text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Department</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. CSE, ECE"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="glass-input w-full text-sm uppercase"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Role Fields */}
            <AnimatePresence mode="wait">
              {role === 'student' ? (
                <motion.div
                  key="student-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Register Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 21102345"
                        value={registerNumber}
                        onChange={(e) => setRegisterNumber(e.target.value)}
                        className="glass-input w-full text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Year of Study</label>
                    <div className="relative">
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="glass-input w-full text-sm appearance-none py-2"
                        required
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="teacher-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1 pt-1"
                >
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Admin Passcode (Optional)</label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Only if registering as Admin"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="glass-input w-full text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(255, 107, 0, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-4"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-slate-200/50"></div>
            <span className="px-3 text-xs font-bold text-slate-400 uppercase">or</span>
            <div className="flex-grow border-t border-slate-200/50"></div>
          </div>

          {/* Google Register */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm transition-all disabled:opacity-50"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </motion.button>

          <div className="mt-6 pt-6 border-t border-slate-200/50 text-center">
            <span className="text-sm font-medium text-slate-500">Already have an account? </span>
            <Link to="/login" className="text-sm font-bold text-[#FF6B00] hover:underline">Sign in here</Link>
          </div>
        </div>
      </motion.div>

      {/* Complete Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="glass-card max-w-md w-full p-8 space-y-6 shadow-2xl relative border border-orange-500/20"
            >
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-800">Complete Your Profile</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">Please enter your academic portal details below</p>
              </div>

              <form onSubmit={handleCompleteProfile} className="space-y-4">
                {/* Role Switcher */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550">I am a</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGoogleRole('student')}
                      className={`py-2 rounded-lg font-bold text-xs border transition-all ${
                        googleRole === 'student'
                          ? 'bg-[#FF6B00]/10 border-[#FF6B00] text-[#FF6B00]'
                          : 'bg-transparent border-slate-200 text-slate-500 hover:bg-slate-100/50'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoogleRole('teacher')}
                      className={`py-2 rounded-lg font-bold text-xs border transition-all ${
                        googleRole === 'teacher'
                          ? 'bg-[#FF6B00]/10 border-[#FF6B00] text-[#FF6B00]'
                          : 'bg-transparent border-slate-200 text-slate-500 hover:bg-slate-100/50'
                      }`}
                    >
                      Faculty Member
                    </button>
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-550">Department</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={googleDept}
                      onChange={(e) => setGoogleDept(e.target.value)}
                      className="glass-input w-full text-xs py-2"
                      required
                    />
                  </div>
                </div>

                {googleRole === 'student' ? (
                  <>
                    {/* Register Number */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-555">Register Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. 3122215001"
                          value={googleRegNo}
                          onChange={(e) => setGoogleRegNo(e.target.value)}
                          className="glass-input w-full text-xs py-2"
                          required
                        />
                      </div>
                    </div>

                    {/* Academic Year */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-555">Current Year</label>
                      <select
                        value={googleYear}
                        onChange={(e) => setGoogleYear(e.target.value)}
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
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-555">Passcode Secret (Admins only)</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Leave blank for regular Teacher role"
                        value={googleAdminSecret}
                        onChange={(e) => setGoogleAdminSecret(e.target.value)}
                        className="glass-input w-full text-xs py-2"
                      />
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 10px rgba(255, 107, 0, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={completeLoading}
                  className="w-full mt-4 py-2.5 rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#FF3B3B] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
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

export default Register;
