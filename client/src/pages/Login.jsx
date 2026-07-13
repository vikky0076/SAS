import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Shield, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login, requestDeviceChange } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);

  // Device mismatch states
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [submittingDeviceRequest, setSubmittingDeviceRequest] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter all fields');
    }

    setIsLoading(true);
    try {
      const data = await login(email, password, role);
      setIsLoading(false);

      if (data.deviceMismatched) {
        setShowDeviceModal(true);
      } else {
        toast.success(`Logged in as ${role}`);
        redirectUser(role);
      }
    } catch (err) {
      setIsLoading(false);
      toast.error(err || 'Invalid credentials');
    }
  };

  const handleDeviceChangeRequest = async () => {
    setSubmittingDeviceRequest(true);
    try {
      const generatedToken = crypto.randomUUID();
      await requestDeviceChange(generatedToken);
      // Wait, we need to save the new token temporarily in local storage so that once approved it matches
      localStorage.setItem('trustedDeviceToken', generatedToken);
      
      toast.success('Device request submitted! Please notify your teacher.');
      setShowDeviceModal(false);
      // Even if mismatched, we redirect them to dashboard (which will show blocked state)
      redirectUser('student');
    } catch (err) {
      toast.error(err || 'Failed to submit device change request');
    } finally {
      setSubmittingDeviceRequest(false);
    }
  };

  const redirectUser = (userRole) => {
    if (userRole === 'student') navigate('/student/dashboard');
    else if (userRole === 'teacher') navigate('/teacher/dashboard');
    else if (userRole === 'admin') navigate('/admin/dashboard');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0b0f19] px-4 py-12 text-white">
      {/* Dynamic Network Glow Background element */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.07)_0,transparent_60%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20 text-primary-400 mb-3 border border-primary-500/30">
            <Shield size={26} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Smart Attendance Portal</h2>
          <p className="text-sm text-gray-400 mt-1">Sign in to manage your attendance</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Login Role</label>
            <div className="grid grid-cols-3 gap-2 bg-black/30 p-1 rounded-lg border border-white/5">
              {['student', 'teacher', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 text-xs font-medium rounded-md capitalize transition-all ${
                    role === r 
                      ? 'bg-primary-600 text-white shadow-md' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-500 focus:border-primary-500 focus:bg-white/10"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary-400 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-500 focus:border-primary-500 focus:bg-white/10"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 focus:outline-none disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        {role !== 'admin' && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:underline">Register here</Link>
          </p>
        )}
      </motion.div>

      {/* Device Verification Request Modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
            <div className="flex items-center text-amber-500 mb-4">
              <AlertCircle className="mr-2" size={24} />
              <h3 className="text-lg font-bold">New Device Detected</h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              You are logging in from a browser/device that has not been approved. 
              To prevent proxy attendance, we limit marking attendance to your trusted device.
              Please submit a device change request. Once your teacher approves, you can mark attendance.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeviceModal(false);
                  redirectUser('student');
                }}
                className="rounded-lg bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-all hover:bg-white/10"
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={handleDeviceChangeRequest}
                disabled={submittingDeviceRequest}
                className="flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-50"
              >
                {submittingDeviceRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Request Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
