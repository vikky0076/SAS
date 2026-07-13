import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Lock, BookOpen, GraduationCap, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const { registerStudent, registerTeacher } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [year, setYear] = useState('1st Year');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !department) {
      return toast.error('Please fill in all required fields');
    }

    if (role === 'student' && !registerNumber) {
      return toast.error('Please fill in your register number');
    }

    setIsLoading(true);
    try {
      if (role === 'student') {
        await registerStudent({
          name,
          email,
          password,
          department,
          registerNumber,
          year
        });
      } else {
        await registerTeacher({
          name,
          email,
          password,
          department
        });
      }
      setIsLoading(false);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setIsLoading(false);
      toast.error(err || 'Registration failed');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0b0f19] px-4 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.07)_0,transparent_60%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl"
      >
        <Link to="/login" className="inline-flex items-center text-xs text-gray-400 hover:text-white mb-6">
          <ArrowLeft size={14} className="mr-1" /> Back to portal
        </Link>

        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
          <p className="text-sm text-gray-400 mt-1">Select your role and enter credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Registration Role</label>
            <div className="grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-lg border border-white/5">
              {['student', 'teacher'].map((r) => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-500 focus:border-primary-500 focus:bg-white/10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  placeholder="john@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-500 focus:border-primary-500 focus:bg-white/10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-500 focus:border-primary-500 focus:bg-white/10"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Department</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="CSE / ECE / EEE"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-500 focus:border-primary-500 focus:bg-white/10"
                />
              </div>
            </div>
          </div>

          {role === 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4 mt-2">
              {/* Register Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Register Number</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="9123456789"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-500 focus:border-primary-500 focus:bg-white/10"
                  />
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Year of Study</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm outline-none text-gray-300 transition-all focus:border-primary-500 focus:bg-white/10"
                >
                  <option className="bg-[#0f172a]" value="1st Year">1st Year</option>
                  <option className="bg-[#0f172a]" value="2nd Year">2nd Year</option>
                  <option className="bg-[#0f172a]" value="3rd Year">3rd Year</option>
                  <option className="bg-[#0f172a]" value="4th Year">4th Year</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 focus:outline-none disabled:opacity-50 mt-6"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Register Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:underline">Sign in here</Link>
        </p>
      </motion.div>
    </div>
  );
}
