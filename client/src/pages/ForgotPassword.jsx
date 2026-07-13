import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.error('Please enter your email');
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setIsLoading(false);
      toast.success(res.data.message || 'Reset link sent successfully!');
      navigate('/login');
    } catch (err) {
      setIsLoading(false);
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0b0f19] px-4 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.07)_0,transparent_60%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl"
      >
        <Link to="/login" className="inline-flex items-center text-xs text-gray-400 hover:text-white mb-6">
          <ArrowLeft size={14} className="mr-1" /> Back to Login
        </Link>

        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight">Reset Password</h2>
          <p className="text-sm text-gray-400 mt-1">
            Enter your registered email and we'll send reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 focus:outline-none disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reset Link'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
