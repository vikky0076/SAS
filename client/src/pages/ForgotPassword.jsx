import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft, FiKey } from 'react-icons/fi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const { sendResetEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.error('Please enter your email');
    }

    setLoading(true);
    try {
      const result = await sendResetEmail(email);
      if (result.success) {
        toast.success('Password reset email sent! Check your inbox for instructions.');
        setResetToken('firebase-email-sent'); // Simulates a token to show the next screen step
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center space-x-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
            <FiArrowLeft />
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Forgot Password</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">Recover your account password</p>
        </div>

        <div className="glass-card p-8">
          {!resetToken ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Sending Request...' : 'Generate Reset Token'}
              </motion.button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <FiKey className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Reset Token Generated</h3>
                <p className="text-sm text-slate-550 dark:text-slate-400 mt-2">
                  In a real production environment, this token is sent to your registered email address. For this self-contained demo, please copy the code below.
                </p>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl select-all font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                {resetToken}
              </div>
              <Link
                to={`/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`}
                className="w-full inline-block py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/20 text-center"
              >
                Proceed to Reset Password
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
