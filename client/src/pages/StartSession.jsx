import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';
import { FiPlay, FiBook, FiClock, FiUsers, FiRefreshCw, FiStopCircle, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const StartSession = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Setup fields
  const [subjectId, setSubjectId] = useState('');
  const [duration, setDuration] = useState(10); // Minutes
  const [starting, setStarting] = useState(false);

  // Active Session State
  const [activeSession, setActiveSession] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [liveCheckins, setLiveCheckins] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0); // seconds

  // Timers and references
  const rotationIntervalRef = useRef(null);
  const checkinsUnsubscribeRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      fetchSubjects();
    }
    return () => {
      clearAllTimers();
    };
  }, [user]);

  const fetchSubjects = async () => {
    try {
      const q = query(collection(db, 'subjects'), where('teacher._id', '==', user._id));
      const res = await getDocs(q);
      const list = res.docs.map(doc => ({
        _id: doc.id,
        ...doc.data()
      }));
      setSubjects(list);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load subjects list');
    } finally {
      setLoading(false);
    }
  };

  const clearAllTimers = () => {
    if (rotationIntervalRef.current) clearInterval(rotationIntervalRef.current);
    if (checkinsUnsubscribeRef.current) {
      checkinsUnsubscribeRef.current();
      checkinsUnsubscribeRef.current = null;
    }
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!subjectId || !duration) {
      return toast.error('Please select subject and duration');
    }

    setStarting(true);
    try {
      // 1. Close any other active sessions for this subject
      const activeQuery = query(
        collection(db, 'attendanceSessions'),
        where('subject._id', '==', subjectId),
        where('active', '==', true)
      );
      const activeSnap = await getDocs(activeQuery);
      for (const d of activeSnap.docs) {
        await updateDoc(doc(db, 'attendanceSessions', d.id), { active: false });
      }

      // 2. Fetch subject details
      const subjectRef = doc(db, 'subjects', subjectId);
      const subjectSnap = await getDoc(subjectRef);
      if (!subjectSnap.exists()) {
        throw new Error('Subject not found');
      }
      const subjectData = subjectSnap.data();

      // 3. Create session parameters
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + parseInt(duration) * 60 * 1000);
      const initialToken = crypto.randomUUID();

      const docRef = await addDoc(collection(db, 'attendanceSessions'), {
        subject: {
          _id: subjectId,
          name: subjectData.name,
          code: subjectData.code,
          department: subjectData.department || 'ALL',
          year: subjectData.year || 0
        },
        qrToken: initialToken,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        active: true
      });

      const session = {
        _id: docRef.id,
        subject: {
          _id: subjectId,
          name: subjectData.name,
          code: subjectData.code,
          department: subjectData.department || 'ALL',
          year: subjectData.year || 0
        },
        qrToken: initialToken,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        active: true
      };

      toast.success('Attendance session started successfully!');
      setActiveSession(session);
      
      const secondsRemaining = Math.max(0, Math.floor((endTime - new Date()) / 1000));
      setTimeLeft(secondsRemaining);

      // Generate QR code for first token
      generateQRCode(session._id, session.qrToken);

      // Setup timers
      setupSessionTimers(session);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  const generateQRCode = async (sessionId, qrToken) => {
    try {
      const qrData = JSON.stringify({ sessionId, qrToken });
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a', // slate-900
          light: '#ffffff'
        }
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Error generating QR', err);
    }
  };

  const setupSessionTimers = (session) => {
    clearAllTimers();

    // 1. Rotation Timer (Every 30 seconds)
    rotationIntervalRef.current = setInterval(async () => {
      try {
        const sessionRef = doc(db, 'attendanceSessions', session._id);
        const sessionSnap = await getDoc(sessionRef);
        if (!sessionSnap.exists()) throw new Error('Session not found');

        const sessionData = sessionSnap.data();
        const now = new Date();
        if (!sessionData.active || now > new Date(sessionData.endTime)) {
          await updateDoc(sessionRef, { active: false });
          throw new Error('Session has expired or is inactive');
        }

        const newQrToken = crypto.randomUUID();
        await updateDoc(sessionRef, { qrToken: newQrToken });
        generateQRCode(session._id, newQrToken);
      } catch (error) {
        console.error('Failed to rotate QR Token', error);
        handleEndSession(true);
      }
    }, 30000);

    // 2. Real-time Check-ins subscription (replaces polling interval)
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('session', '==', session._id)
    );
    checkinsUnsubscribeRef.current = onSnapshot(attendanceQuery, (snap) => {
      const records = snap.docs.map(d => ({
        _id: d.id,
        ...d.data()
      }));
      // Sort in descending order of time on the client side
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      setLiveCheckins(records);
    }, (err) => {
      console.error('Check-ins subscription error:', err);
    });

    // 3. Countdown Timer (Every second)
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleEndSession(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const updateStudentsAttendanceStats = async (department, year) => {
    try {
      const studentsQuery = query(
        collection(db, 'students'),
        where('department', '==', department),
        where('year', '==', parseInt(year))
      );
      const studentsSnap = await getDocs(studentsQuery);
      const batch = writeBatch(db);
      
      for (const studentDoc of studentsSnap.docs) {
        const studentId = studentDoc.id;
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('student._id', '==', studentId)
        );
        const attendanceSnap = await getDocs(attendanceQuery);
        
        const records = attendanceSnap.docs.map(doc => doc.data());
        const presentDays = records.filter(r => r.status === 'Present').length;
        const absentDays = records.filter(r => r.status === 'Absent').length;
        const totalWorkingDays = presentDays + absentDays;
        const attendancePercentage = totalWorkingDays > 0 ? parseFloat(((presentDays / totalWorkingDays) * 100).toFixed(2)) : 100;
        
        const studentRef = doc(db, 'students', studentId);
        batch.update(studentRef, {
          presentDays,
          absentDays,
          totalWorkingDays,
          attendancePercentage,
          updatedAt: new Date().toISOString()
        });
      }
      
      await batch.commit();
    } catch (e) {
      console.error('Error recalculating attendance stats:', e);
    }
  };

  const handleExportSessionReport = (type) => {
    if (!sessionSummary) return;

    if (type === 'excel') {
      const rows = [
        ...sessionSummary.presentStudents.map(s => ({
          'Register Number': s.registerNumber,
          'Student Name': s.name,
          'Department': s.department,
          'Year': s.year,
          'Status': 'Present',
          'Time Marked': s.time
        })),
        ...sessionSummary.absentStudents.map(s => ({
          'Register Number': s.registerNumber,
          'Student Name': s.name,
          'Department': s.department,
          'Year': s.year,
          'Status': 'Absent',
          'Time Marked': 'N/A'
        }))
      ];

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const maxLenArr = [];
      rows.forEach(row => {
        Object.keys(row).forEach((key, index) => {
          const val = row[key] ? row[key].toString() : '';
          maxLenArr[index] = Math.max(maxLenArr[index] || 10, val.length, key.length);
        });
      });
      worksheet['!cols'] = maxLenArr.map(w => ({ wch: w + 3 }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Session Report');
      XLSX.writeFile(workbook, `Session_Report_${sessionSummary.subjectCode}_${Date.now()}.xlsx`);
      toast.success('Excel report downloaded successfully!');
    } else if (type === 'pdf') {
      const docPDF = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      docPDF.setFillColor(30, 58, 138);
      docPDF.rect(10, 10, 190, 20, 'F');
      
      docPDF.setTextColor(255, 255, 255);
      docPDF.setFont('helvetica', 'bold');
      docPDF.setFontSize(14);
      docPDF.text(`Class Attendance Session Report`, 15, 18);
      docPDF.setFontSize(9);
      docPDF.setFont('helvetica', 'normal');
      docPDF.text(`${sessionSummary.subjectName} (${sessionSummary.subjectCode}) • ${sessionSummary.date}`, 15, 25);

      docPDF.setTextColor(51, 65, 85);
      docPDF.setFontSize(9);
      docPDF.text(`Start Time: ${sessionSummary.startTime}`, 10, 36);
      docPDF.text(`End Time: ${sessionSummary.endTime}`, 60, 36);
      docPDF.text(`Total Students: ${sessionSummary.totalStudents}`, 10, 42);
      docPDF.text(`Present: ${sessionSummary.presentCount}`, 50, 42);
      docPDF.text(`Absent: ${sessionSummary.absentCount}`, 90, 42);

      const headers = [['Register Number', 'Student Name', 'Department', 'Year', 'Status', 'Time Marked']];
      const tableRows = [
        ...sessionSummary.presentStudents.map(s => [s.registerNumber, s.name, s.department, s.year, 'Present', s.time]),
        ...sessionSummary.absentStudents.map(s => [s.registerNumber, s.name, s.department, s.year, 'Absent', 'N/A'])
      ];

      docPDF.autoTable({
        startY: 47,
        head: headers,
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, font: 'helvetica' },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 4) {
            const val = data.cell.raw;
            if (val === 'Present') {
              data.cell.styles.textColor = [22, 163, 74];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      docPDF.save(`Session_Report_${sessionSummary.subjectCode}_${Date.now()}.pdf`);
      toast.success('PDF report downloaded successfully!');
    }
  };

  const handleEndSession = async (isAutomatic = false) => {
    if (!activeSession) return;
    
    if (!isAutomatic) {
      if (!window.confirm('Are you sure you want to end this attendance marking session?')) return;
    }

    try {
      const sessionRef = doc(db, 'attendanceSessions', activeSession._id);
      await updateDoc(sessionRef, { active: false });

      const dept = activeSession.subject.department;
      const year = activeSession.subject.year;
      
      let allEligibleStudents = [];
      if (dept && dept !== 'ALL') {
        const studentsQuery = query(
          collection(db, 'students'),
          where('department', '==', dept),
          where('year', '==', parseInt(year))
        );
        const studentsSnap = await getDocs(studentsQuery);
        allEligibleStudents = studentsSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
      } else {
        const studentsQuery = query(collection(db, 'students'));
        const studentsSnap = await getDocs(studentsQuery);
        allEligibleStudents = studentsSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
      }
      
      const presentQuery = query(
        collection(db, 'attendance'),
        where('session', '==', activeSession._id)
      );
      const presentSnap = await getDocs(presentQuery);
      const presentRecords = presentSnap.docs.map(d => d.data());
      const presentStudentIds = presentRecords.map(r => r.student._id);
      
      const absentStudents = allEligibleStudents.filter(s => !presentStudentIds.includes(s._id));
      const absentStudentIds = absentStudents.map(s => s._id);
      
      const batch = writeBatch(db);
      const startTimeISO = activeSession.startTime;
      const sessionDate = new Date(startTimeISO).toISOString();
      
      absentStudents.forEach(student => {
        const newRef = doc(collection(db, 'attendance'));
        batch.set(newRef, {
          session: activeSession._id,
          subject: {
            _id: activeSession.subject._id,
            name: activeSession.subject.name,
            code: activeSession.subject.code
          },
          student: {
            _id: student._id,
            name: student.name,
            registerNumber: student.registerNumber,
            department: student.department,
            year: student.year
          },
          date: sessionDate,
          time: 'Absent',
          status: 'Absent',
          createdAt: new Date().toISOString()
        });
      });
      
      await batch.commit();

      if (dept && dept !== 'ALL') {
        await updateStudentsAttendanceStats(dept, year);
      } else {
        for (const student of allEligibleStudents) {
          const studentId = student._id;
          const attendanceQuery = query(
            collection(db, 'attendance'),
            where('student._id', '==', studentId)
          );
          const attendanceSnap = await getDocs(attendanceQuery);
          
          const records = attendanceSnap.docs.map(doc => doc.data());
          const presentDays = records.filter(r => r.status === 'Present').length;
          const absentDays = records.filter(r => r.status === 'Absent').length;
          const totalWorkingDays = presentDays + absentDays;
          const attendancePercentage = totalWorkingDays > 0 ? parseFloat(((presentDays / totalWorkingDays) * 100).toFixed(2)) : 100;
          
          const studentRef = doc(db, 'students', studentId);
          await updateDoc(studentRef, {
            presentDays,
            absentDays,
            totalWorkingDays,
            attendancePercentage,
            updatedAt: new Date().toISOString()
          });
        }
      }

      const totalCount = allEligibleStudents.length;
      const presentCount = presentStudentIds.length;
      const absentCount = absentStudentIds.length;
      
      await updateDoc(sessionRef, {
        presentStudentIds,
        absentStudentIds,
        attendanceSummary: {
          totalStudents: totalCount,
          presentCount,
          absentCount
        },
        endedAt: new Date().toISOString()
      });

      const presentList = presentRecords.map(r => ({
        registerNumber: r.student?.registerNumber || '',
        name: r.student?.name || '',
        department: r.student?.department || '',
        year: r.student?.year || 1,
        time: r.time || ''
      }));
      
      const absentList = absentStudents.map(s => ({
        registerNumber: s.registerNumber || '',
        name: s.name || '',
        department: s.department || '',
        year: s.year || 1
      }));
      
      setSessionSummary({
        subjectName: activeSession.subject.name,
        subjectCode: activeSession.subject.code,
        date: new Date(activeSession.startTime).toLocaleDateString(),
        startTime: new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalStudents: totalCount,
        presentCount,
        absentCount,
        presentStudents: presentList,
        absentStudents: absentList
      });

      toast.success(isAutomatic ? 'Session completed automatically!' : 'Session ended manually!');
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to close session properly');
    } finally {
      clearAllTimers();
      setActiveSession(null);
      setQrCodeUrl('');
      setLiveCheckins([]);
      setTimeLeft(0);
    }
  };

  // Helper to format seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="max-w-md mx-auto">
          <div className="glass-card p-6 animate-pulse space-y-4">
            <div className="h-6 bg-slate-350 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="h-10 bg-slate-350 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-10 bg-slate-350 dark:bg-slate-700 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionSummary) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
              <FiCheckCircle className="text-emerald-500" />
              <span>Session Attendance Summary</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class has closed. Review and export session statistics.</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExportSessionReport('excel')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              Export Excel
            </button>
            <button
              onClick={() => handleExportSessionReport('pdf')}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              Export PDF
            </button>
            <button
              onClick={() => setSessionSummary(null)}
              className="px-3.5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              Close
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</p>
            <p className="font-bold text-sm text-slate-800 dark:text-white">{sessionSummary.subjectName} ({sessionSummary.subjectCode})</p>
          </div>
          <div className="glass-card p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date & Time</p>
            <p className="font-bold text-sm text-slate-800 dark:text-white">{sessionSummary.date} • {sessionSummary.startTime} - {sessionSummary.endTime}</p>
          </div>
          <div className="glass-card p-4 space-y-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present Rate</p>
            <p className="font-black text-lg text-emerald-600">
              {sessionSummary.totalStudents > 0 ? ((sessionSummary.presentCount / sessionSummary.totalStudents) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-[9px] font-semibold text-slate-400">{sessionSummary.presentCount} / {sessionSummary.totalStudents} students</p>
          </div>
          <div className="glass-card p-4 space-y-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Absent Rate</p>
            <p className="font-black text-lg text-rose-600">
              {sessionSummary.totalStudents > 0 ? ((sessionSummary.absentCount / sessionSummary.totalStudents) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-[9px] font-semibold text-slate-400">{sessionSummary.absentCount} / {sessionSummary.totalStudents} students</p>
          </div>
        </div>

        {/* Two Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Present Table */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-bold text-emerald-600 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Present Students ({sessionSummary.presentCount})</span>
            </h3>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-850">
                    <th className="px-3 py-2 font-bold text-slate-550">Reg No</th>
                    <th className="px-3 py-2 font-bold text-slate-550">Name</th>
                    <th className="px-3 py-2 font-bold text-slate-550">Dept</th>
                    <th className="px-3 py-2 font-bold text-slate-550">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-250/20 dark:divide-slate-800/20">
                  {sessionSummary.presentStudents.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="px-3 py-2 font-semibold text-slate-550">{s.registerNumber}</td>
                      <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{s.name}</td>
                      <td className="px-3 py-2 text-slate-500">{s.department} • Yr {s.year}</td>
                      <td className="px-3 py-2 text-emerald-600 font-bold">{s.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Absent Table */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-bold text-rose-600 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Absent Students ({sessionSummary.absentCount})</span>
            </h3>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-850">
                    <th className="px-3 py-2 font-bold text-slate-550">Reg No</th>
                    <th className="px-3 py-2 font-bold text-slate-550">Name</th>
                    <th className="px-3 py-2 font-bold text-slate-550">Dept</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-250/20 dark:divide-slate-800/20">
                  {sessionSummary.absentStudents.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-55/20 dark:hover:bg-slate-900/50">
                      <td className="px-3 py-2 font-semibold text-slate-550">{s.registerNumber}</td>
                      <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{s.name}</td>
                      <td className="px-3 py-2 text-slate-500">{s.department} • Yr {s.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <AnimatePresence mode="wait">
        {!activeSession ? (
          // STEP 1: Launch Form
          <motion.div
            key="start-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-md mx-auto space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                <FiPlay className="text-primary-500" />
                <span>Start Live Session</span>
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Generate rotating QR code for secure attendance</p>
            </div>

            <div className="glass-card p-6">
              <form onSubmit={handleStartSession} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 flex items-center space-x-1">
                    <FiBook />
                    <span>Select Subject</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="glass-input w-full text-sm appearance-none"
                    required
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-550 dark:text-slate-450 flex items-center space-x-1">
                    <FiClock />
                    <span>Session Duration (Minutes)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="e.g. 10"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="glass-input w-full text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={starting}
                  className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-650 text-white font-bold text-sm shadow-lg shadow-primary-500/10 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-4"
                >
                  <FiPlay />
                  <span>{starting ? 'Starting Session...' : 'Launch Attendance Session'}</span>
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          // STEP 2: Live Rotation Page
          <motion.div
            key="live-session"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left QR Column */}
            <div className="lg:col-span-1 space-y-6 flex flex-col items-center">
              <div className="w-full">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  <span>Live Attendance Board</span>
                </h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class is active and accepting check-ins</p>
              </div>

              <div className="glass-card p-6 flex flex-col items-center justify-center w-full space-y-6">
                <div className="w-full text-center space-y-1.5">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{liveCheckins[0]?.subject?.name || 'Class Subject'}</h3>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-600 dark:text-red-400 text-xs font-bold">
                    <FiClock className="animate-spin" />
                    <span>Time Left: {formatTime(timeLeft)}</span>
                  </div>
                </div>

                {qrCodeUrl ? (
                  <motion.div
                    animate={{ rotate: [0, 360], transition: { duration: 0.5, ease: 'easeOut' } }}
                    key={qrCodeUrl}
                    className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-64 h-64 flex items-center justify-center"
                  >
                    <img src={qrCodeUrl} alt="Active QR Code" className="w-full h-full" />
                  </motion.div>
                ) : (
                  <div className="w-64 h-64 rounded-2xl bg-slate-200 dark:bg-slate-900 animate-pulse flex items-center justify-center text-slate-400">
                    Generating code...
                  </div>
                )}

                <div className="w-full space-y-2">
                  <p className="text-[10px] text-center font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">QR Code Token Rotates in:</p>
                  {/* Visual Progress ring/bar for rotation */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      key={qrCodeUrl}
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 30, ease: 'linear' }}
                      className="bg-primary-500 h-full"
                    ></motion.div>
                  </div>
                </div>

                <button
                  onClick={() => handleEndSession(false)}
                  className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/15 flex items-center justify-center space-x-2 transition-all"
                >
                  <FiStopCircle />
                  <span>End Session Manually</span>
                </button>
              </div>
            </div>

            {/* Right Live Feed Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center space-x-2">
                    <FiUsers className="text-primary-550" />
                    <span>Real-time Check-ins ({liveCheckins.length})</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">Live feed polling</span>
                  </div>
                </div>

                {liveCheckins.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-450">
                    <FiUsers className="w-12 h-12 text-slate-350 dark:text-slate-700 animate-bounce mb-2" />
                    <p className="text-sm font-semibold">Waiting for students to check in</p>
                    <p className="text-xs text-slate-400 mt-0.5">Students must scan the QR code displayed on this screen.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-[480px]">
                    <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                      {liveCheckins.map((rec) => (
                        <div key={rec._id} className="py-3 flex items-center justify-between hover:bg-slate-55/20 dark:hover:bg-slate-900/10 px-2 rounded-lg transition-colors">
                          <div>
                            <h4 className="font-bold text-sm text-slate-850 dark:text-slate-250">{rec.student?.name}</h4>
                            <p className="text-[10px] font-semibold text-slate-500">{rec.student?.registerNumber} • Dept: {rec.student?.department} • Year: {rec.student?.year}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                              <FiCheckCircle />
                              <span>{rec.time}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartSession;
