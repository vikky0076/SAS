import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { FiArrowLeft, FiCamera, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const ScanQR = () => {
  const { user, fetchUserProfile } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If student is not approved on this device, block scanning page
    if (user && !user.deviceApproved) {
      toast.error('Access Denied: Unapproved device.');
      navigate('/dashboard');
      return;
    }

    // Initialize scanner
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    });

    scanner.render(
      (decodedText) => {
        handleScanSuccess(decodedText, scanner);
      },
      (error) => {
        // Silent error, scanner keeps polling
      }
    );

    scannerRef.current = scanner;

    // Cleanup
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.error('Error clearing scanner', err));
      }
    };
  }, [user]);

  // Re-compute student attendance percentage
  const recomputeAttendancePercentage = async (studentId) => {
    try {
      // 1. Get all attendance sessions count
      const sessionsSnap = await getDocs(collection(db, 'attendanceSessions'));
      const totalSessions = sessionsSnap.size;

      if (totalSessions === 0) return;

      // 2. Get attended sessions count
      const attendedQuery = query(
        collection(db, 'attendance'),
        where('student._id', '==', studentId),
        where('status', '==', 'Present')
      );
      const attendedSnap = await getDocs(attendedQuery);
      const attendedCount = attendedSnap.size;

      const percentage = Math.round((attendedCount / totalSessions) * 100);

      // 3. Update student record
      await updateDoc(doc(db, 'students', studentId), {
        attendancePercentage: percentage
      });
    } catch (err) {
      console.error('Error updating attendance score:', err);
    }
  };

  const handleScanSuccess = async (decodedText, scanner) => {
    try {
      // Avoid double scans
      if (loading || scanResult) return;
      
      let parsedData;
      try {
        parsedData = JSON.parse(decodedText);
      } catch (e) {
        toast.error('Invalid QR Code format.');
        return;
      }

      const { sessionId, qrToken } = parsedData;
      if (!sessionId || !qrToken) {
        toast.error('Invalid QR Code contents.');
        return;
      }

      // Stop scanner
      scanner.clear().catch((err) => console.error(err));
      setScanResult(parsedData);
      
      // Submit attendance
      setLoading(true);
      const localDeviceToken = localStorage.getItem('trusted_device_token');

      // 1. Double check student device status
      const studentSnap = await getDoc(doc(db, 'students', user._id));
      if (!studentSnap.exists()) {
        throw new Error('Student profile not found in database');
      }
      const studentData = studentSnap.data();

      if (!studentData.trustedDeviceToken) {
        throw new Error('Device not registered. Please log in again.');
      }
      if (studentData.trustedDeviceToken !== localDeviceToken) {
        throw new Error('Attendance blocked: Unrecognized device token.');
      }
      if (!studentData.deviceApproved) {
        throw new Error('Attendance blocked: Device pending approval.');
      }

      // 2. Verify Session details
      const sessionRef = doc(db, 'attendanceSessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      if (!sessionSnap.exists()) {
        throw new Error('Attendance session not found.');
      }
      const sessionData = sessionSnap.data();

      if (!sessionData.active) {
        throw new Error('Attendance marking is closed for this session.');
      }

      const now = new Date();
      const endTime = new Date(sessionData.endTime);
      if (now > endTime) {
        await updateDoc(sessionRef, { active: false });
        throw new Error('Session has expired.');
      }

      // 3. Match QR Token
      if (sessionData.qrToken !== qrToken) {
        throw new Error('Invalid or expired QR Code. Please scan the current live code.');
      }

      // 4. Check for duplicate attendance
      const duplicateQuery = query(
        collection(db, 'attendance'),
        where('student._id', '==', user._id),
        where('session', '==', sessionId)
      );
      const duplicateSnap = await getDocs(duplicateQuery);
      if (!duplicateSnap.empty) {
        throw new Error('Attendance already marked for this class.');
      }

      // Format current time HH:MM
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      // 5. Create attendance entry
      await addDoc(collection(db, 'attendance'), {
        student: {
          _id: user._id,
          name: studentData.name,
          registerNumber: studentData.registerNumber,
          department: studentData.department,
          year: studentData.year
        },
        subject: sessionData.subject,
        session: sessionId,
        date: now.toISOString(),
        time: timeString,
        status: 'Present',
        createdAt: now.toISOString()
      });

      // 6. Update student score
      await recomputeAttendancePercentage(user._id);
      await fetchUserProfile(); // sync state

      toast.success('Attendance marked successfully!');
      
      // Delay navigation
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Scan processing error:', error);
      toast.error(error.message || 'Failed to mark attendance.');
      setScanResult(null);
      setLoading(false);
      
      // Refresh scanner on failure
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link to="/dashboard" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Scan Attendance QR</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Position the QR code inside the box</p>
        </div>
      </div>

      <div className="glass-card p-6 flex flex-col items-center justify-center">
        {!scanResult ? (
          <div className="w-full space-y-4">
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black relative flex items-center justify-center border border-slate-200 dark:border-slate-800">
              <div id="reader" className="w-full h-full"></div>
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs font-bold text-slate-450 dark:text-slate-500">
              <FiCamera className="animate-pulse" />
              <span>Camera active, scanning...</span>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <FiCheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-850 dark:text-white">QR Code Scanned</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                {loading ? 'Submitting secure credentials...' : 'Attendance processed'}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-primary-500/5 dark:bg-primary-500/10 border border-primary-550/15 dark:border-primary-500/20 text-slate-500 dark:text-slate-400 text-xs font-medium space-y-1">
        <p className="font-bold text-primary-650 dark:text-primary-400">Anti-Proxy System Active:</p>
        <p>1. Screenshots of QR code are not valid as the token rotates every 30 seconds.</p>
        <p>2. Attendance must be marked from your registered and approved device.</p>
      </div>
    </div>
  );
};

export default ScanQR;
