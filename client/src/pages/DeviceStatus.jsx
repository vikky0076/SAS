import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FiSmartphone, FiCheckCircle, FiAlertTriangle, FiPlusCircle, FiClock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { CardSkeleton } from '../components/LoadingSkeleton';

const DeviceStatus = () => {
  const { user, requestDeviceChange, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pendingRequest, setPendingRequest] = useState(null);
  
  const localToken = localStorage.getItem('trusted_device_token');

  useEffect(() => {
    if (user?._id) {
      fetchPendingRequestStatus();
    }
  }, [user]);

  const fetchPendingRequestStatus = async () => {
    try {
      setPageLoading(true);
      const q = query(
        collection(db, 'deviceRequests'),
        where('student._id', '==', user._id),
        where('status', '==', 'Pending')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setPendingRequest({
          _id: snap.docs[0].id,
          ...snap.docs[0].data()
        });
      } else {
        setPendingRequest(null);
      }
    } catch (error) {
      console.error('Error fetching pending request status:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleRegisterDevice = async () => {
    setLoading(true);
    try {
      // Generate a new secure UUID
      const newToken = crypto.randomUUID();
      
      const result = await requestDeviceChange(newToken);
      
      if (result.success) {
        // Save the new token in local storage immediately, but note that they won't be fully approved in DB until teacher clicks Approve.
        // Wait, on approval the student's browser token must match the DB. If they overwrite local token,
        // it matches the "newToken" they just submitted!
        // Yes! When teacher approves, the DB token is updated to `newToken`. So saving it locally now is perfect!
        localStorage.setItem('trusted_device_token', newToken);
        toast.success(result.message || 'Device registration request submitted successfully!');
        await fetchPendingRequestStatus();
        await fetchUserProfile();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="p-6 space-y-6">
        <CardSkeleton />
      </div>
    );
  }

  // Device states:
  // 1. Fully Linked and Approved
  // 2. Pending Approval
  // 3. Unapproved Device Mismatch
  const isApproved = user?.deviceApproved && (localToken === user?.trustedDeviceToken);
  const hasMismatch = localToken !== user?.trustedDeviceToken;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
          <FiSmartphone className="text-primary-500" />
          <span>Device Registration Status</span>
        </h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Manage your linked trusted device credentials</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        {/* State Banner */}
        {isApproved ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-350 flex items-center space-x-3">
            <FiCheckCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Device Connected & Approved</h4>
              <p className="text-xs font-medium mt-0.5">Your browser holds the correct matching security credentials. You can mark attendance.</p>
            </div>
          </div>
        ) : pendingRequest ? (
          <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-800 dark:text-primary-350 flex items-center space-x-3">
            <FiClock className="w-6 h-6 flex-shrink-0 animate-pulse" />
            <div>
              <h4 className="font-bold text-sm">Reset Request Pending Approval</h4>
              <p className="text-xs font-medium mt-0.5">Submitted on {new Date(pendingRequest.requestedTime).toLocaleDateString()}. Please contact your subject teacher to approve.</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-350 flex items-center space-x-3">
            <FiAlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Device Verification Mismatch</h4>
              <p className="text-xs font-medium mt-0.5">Attendance marking is locked. You must link this device by requesting an approval.</p>
            </div>
          </div>
        )}

        {/* Credentials table */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center py-2.5 border-b border-slate-200/50 dark:border-slate-800/50">
            <span className="text-xs font-bold text-slate-550 dark:text-slate-400">Browser Security Token:</span>
            <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate max-w-xs">{localToken || 'None Found (Unregistered)'}</span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b border-slate-200/50 dark:border-slate-800/50">
            <span className="text-xs font-bold text-slate-550 dark:text-slate-400">Database Linked Token:</span>
            <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate max-w-xs">{user?.trustedDeviceToken || 'None Registered'}</span>
          </div>
        </div>

        {/* Action Button */}
        {(!isApproved && !pendingRequest) && (
          <div className="pt-4">
            <button
              onClick={handleRegisterDevice}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-750 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50"
            >
              <FiPlusCircle />
              <span>{loading ? 'Submitting Request...' : 'Link This Device (Request Change)'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-450">
        <p className="font-bold text-slate-700 dark:text-slate-350">Frequently Asked Questions:</p>
        <p><strong>Why is my device unapproved?</strong> Your trusted device token is created the first time you login. If you change browsers, clear cookies/localstorage, or sign in from a new mobile phone, a mismatch is detected.</p>
        <p><strong>How long does approval take?</strong> Once you click "Link This Device", the request appears instantly on the Teacher's dashboard. Ask them to click Approve during class.</p>
      </div>
    </div>
  );
};

export default DeviceStatus;
