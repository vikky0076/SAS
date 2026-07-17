import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiTrendingUp, FiUsers, FiUserCheck, FiUserX, FiPercent, 
  FiSearch, FiFilter, FiAlertTriangle, FiDownload, FiX, 
  FiCalendar, FiBookOpen, FiClock, FiFileText, FiChevronRight 
} from 'react-icons/fi';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  AreaChart, Area 
} from 'recharts';
import { toast } from 'react-hot-toast';
import { StatsSkeleton, TableSkeleton } from '../components/LoadingSkeleton';

const MentorDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [todayRequests, setTodayRequests] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filters & Modal States
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentLogs, setSelectedStudentLogs] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchMentorData();
    }
  }, [user]);

  const fetchMentorData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch assigned students
      let studentsQuery;
      if (user.role === 'admin') {
        studentsQuery = query(collection(db, 'students'));
      } else {
        studentsQuery = query(collection(db, 'students'), where('mentorId', '==', user._id));
      }
      const studentsSnap = await getDocs(studentsQuery);
      const studentsList = studentsSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
      setStudents(studentsList);
      
      const studentIds = studentsList.map(s => s._id);

      // 2. Fetch all subjects
      const subjectsSnap = await getDocs(collection(db, 'subjects'));
      const subjectsList = subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubjects(subjectsList);

      // 3. Fetch attendance sessions
      const sessionsSnap = await getDocs(collection(db, 'attendanceSessions'));
      const sessionsList = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(sessionsList);

      if (studentIds.length > 0) {
        // 4. Fetch all attendance logs for assigned students
        const attendanceSnap = await getDocs(collection(db, 'attendance'));
        const attendanceList = attendanceSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(log => studentIds.includes(log.student?._id));
        setAllAttendance(attendanceList);

        // 5. Fetch today's attendance requests and logs
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const todayReqQuery = query(
          collection(db, 'attendanceRequests'),
          where('createdAt', '>=', startOfToday.toISOString())
        );
        const todayReqSnap = await getDocs(todayReqQuery);
        const reqList = todayReqSnap.docs
          .map(doc => ({ _id: doc.id, ...doc.data() }))
          .filter(r => studentIds.includes(r.student?._id));
        setTodayRequests(reqList);

        const todayAttQuery = query(
          collection(db, 'attendance'),
          where('createdAt', '>=', startOfToday.toISOString())
        );
        const todayAttSnap = await getDocs(todayAttQuery);
        const attList = todayAttSnap.docs
          .map(doc => ({ _id: doc.id, ...doc.data() }))
          .filter(a => studentIds.includes(a.student?._id));
        setTodayAttendance(attList);
      } else {
        setAllAttendance([]);
        setTodayRequests([]);
        setTodayAttendance([]);
      }
    } catch (error) {
      console.error('Error fetching mentor data:', error);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  // --- STATS CALCULATIONS ---
  const totalStudentsCount = students.length;

  const lowAttendanceStudents = students.filter(s => (s.attendancePercentage || 0) < 75);

  const averageAttendance = totalStudentsCount > 0 
    ? parseFloat((students.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / totalStudentsCount).toFixed(1))
    : 0;

  const sortedByAttendance = [...students].sort((a, b) => (a.attendancePercentage || 0) - (b.attendancePercentage || 0));
  const lowestAttendance = sortedByAttendance[0]?.attendancePercentage ?? 0;
  const highestAttendance = sortedByAttendance[sortedByAttendance.length - 1]?.attendancePercentage ?? 0;

  // Calculate Present vs Absent Today
  const todayStr = new Date().toDateString();
  const todayLogs = allAttendance.filter(log => new Date(log.date).toDateString() === todayStr);
  const presentTodayCount = todayLogs.filter(log => log.status === 'Present').length;
  const absentTodayCount = todayLogs.filter(log => log.status === 'Absent').length;

  // --- CHART DATA COMPILATION ---
  // 1. Today's Summary (Pie Chart)
  const todayPieData = [
    { name: 'Present Today', value: presentTodayCount, color: '#FF6B00' },
    { name: 'Absent Today', value: absentTodayCount, color: '#FF3B3B' }
  ];

  // 2. Department-wise Attendance (Bar Chart)
  const depts = [...new Set(students.map(s => s.department))];
  const deptBarData = depts.map(dept => {
    const deptStudents = students.filter(s => s.department === dept);
    const avg = deptStudents.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / deptStudents.length;
    return {
      department: dept || 'N/A',
      'Average Attendance %': parseFloat(avg.toFixed(1))
    };
  });

  // 3. Monthly Trend (Area Chart)
  const monthlyTrendData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const groups = {};
    allAttendance.forEach(log => {
      if (!log.date) return;
      const date = new Date(log.date);
      const mIdx = date.getMonth();
      const year = date.getFullYear();
      const key = `${months[mIdx]} ${year}`;
      if (!groups[key]) {
        groups[key] = { name: key, present: 0, total: 0 };
      }
      groups[key].total += 1;
      if (log.status === 'Present') groups[key].present += 1;
    });

    return Object.keys(groups).map(key => ({
      month: key,
      'Attendance Rate %': parseFloat(((groups[key].present / groups[key].total) * 100).toFixed(1))
    })).sort((a, b) => new Date(a.month) - new Date(b.month)).slice(-6); // Last 6 months
  })();

  // --- FILTERS & SEARCH ---
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.registerNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = deptFilter ? student.department === deptFilter : true;
    const matchesYear = yearFilter ? student.year === parseInt(yearFilter) : true;
    
    let matchesStatus = true;
    if (statusFilter === 'good') {
      matchesStatus = (student.attendancePercentage || 0) >= 75;
    } else if (statusFilter === 'warning') {
      matchesStatus = (student.attendancePercentage || 0) >= 60 && (student.attendancePercentage || 0) < 75;
    } else if (statusFilter === 'critical') {
      matchesStatus = (student.attendancePercentage || 0) < 60;
    }

    return matchesSearch && matchesDept && matchesYear && matchesStatus;
  });

  // --- DETAILED PROFILE MODAL ---
  const handleOpenProfile = (student) => {
    setSelectedStudent(student);
    const logs = allAttendance
      .filter(log => log.student?._id === student._id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    setSelectedStudentLogs(logs);
  };

  // --- PDF & EXCEL REPORTS EXPORT ---

  // Export Low Attendance warning list
  const exportWarningReport = (type) => {
    if (lowAttendanceStudents.length === 0) return toast.error('No students with low attendance');
    setExportLoading(true);

    if (type === 'excel') {
      const rows = lowAttendanceStudents.map(s => ({
        'Register Number': s.registerNumber,
        'Name': s.name,
        'Department': s.department,
        'Year': s.year,
        'Attendance Percentage': `${s.attendancePercentage}%`,
        'Total Working Days': s.totalWorkingDays || 0,
        'Present Days': s.presentDays || 0,
        'Absent Days': s.absentDays || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Low Attendance Warning');
      XLSX.writeFile(workbook, `Low_Attendance_Warning_${Date.now()}.xlsx`);
      toast.success('Excel warning report downloaded!');
    } else {
      const docPDF = new jsPDF();
      docPDF.setFillColor(220, 38, 38);
      docPDF.rect(10, 10, 190, 20, 'F');

      docPDF.setTextColor(255, 255, 255);
      docPDF.setFont('helvetica', 'bold');
      docPDF.setFontSize(14);
      docPDF.text(`Low Attendance Warning Alert Report`, 15, 18);
      docPDF.setFontSize(9);
      docPDF.setFont('helvetica', 'normal');
      docPDF.text(`Assigned Students with Attendance under 75% • Generated: ${new Date().toLocaleDateString()}`, 15, 25);

      const headers = [['Reg No', 'Student Name', 'Dept', 'Year', 'Attendance %', 'Present / Total Days']];
      const tableRows = lowAttendanceStudents.map(s => [
        s.registerNumber,
        s.name,
        s.department,
        s.year,
        `${s.attendancePercentage}%`,
        `${s.presentDays || 0} / ${s.totalWorkingDays || 0}`
      ]);

      docPDF.autoTable({
        startY: 35,
        head: headers,
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [185, 28, 28] },
        styles: { fontSize: 8 }
      });
      docPDF.save(`Low_Attendance_Warning_${Date.now()}.pdf`);
      toast.success('PDF warning report downloaded!');
    }
    setExportLoading(false);
  };

  // Export Daily Report (Today's attendance logs)
  const exportDailyReport = (type) => {
    setExportLoading(true);
    const logs = allAttendance.filter(log => new Date(log.date).toDateString() === todayStr);

    if (logs.length === 0) {
      toast.error("No attendance logs recorded today.");
      setExportLoading(false);
      return;
    }

    if (type === 'excel') {
      const rows = logs.map(l => ({
        'Register Number': l.student?.registerNumber,
        'Student Name': l.student?.name,
        'Subject Code': l.subject?.code,
        'Subject Name': l.subject?.name,
        'Date': new Date(l.date).toLocaleDateString(),
        'Time': l.time,
        'Status': l.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Attendance');
      XLSX.writeFile(workbook, `Daily_Attendance_Report_${Date.now()}.xlsx`);
      toast.success('Excel report downloaded!');
    } else {
      const docPDF = new jsPDF();
      docPDF.setFillColor(30, 58, 138);
      docPDF.rect(10, 10, 190, 20, 'F');

      docPDF.setTextColor(255, 255, 255);
      docPDF.setFont('helvetica', 'bold');
      docPDF.setFontSize(14);
      docPDF.text(`Daily Attendance Report`, 15, 18);
      docPDF.setFontSize(9);
      docPDF.setFont('helvetica', 'normal');
      docPDF.text(`Date: ${todayStr} • Generated: ${new Date().toLocaleDateString()}`, 15, 25);

      const headers = [['Reg No', 'Student Name', 'Subject Code', 'Subject', 'Time', 'Status']];
      const tableRows = logs.map(l => [
        l.student?.registerNumber,
        l.student?.name,
        l.subject?.code,
        l.subject?.name,
        l.time,
        l.status
      ]);

      docPDF.autoTable({
        startY: 35,
        head: headers,
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
        styles: { fontSize: 8 }
      });
      docPDF.save(`Daily_Attendance_Report_${Date.now()}.pdf`);
      toast.success('PDF report downloaded!');
    }
    setExportLoading(false);
  };

  // Export Monthly Report
  const exportMonthlyReport = (type) => {
    setExportLoading(true);
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const logs = allAttendance.filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    if (logs.length === 0) {
      toast.error("No attendance logs recorded this month.");
      setExportLoading(false);
      return;
    }

    if (type === 'excel') {
      const rows = logs.map(l => ({
        'Register Number': l.student?.registerNumber,
        'Student Name': l.student?.name,
        'Subject Code': l.subject?.code,
        'Subject Name': l.subject?.name,
        'Date': new Date(l.date).toLocaleDateString(),
        'Status': l.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Attendance');
      XLSX.writeFile(workbook, `Monthly_Attendance_Report_${Date.now()}.xlsx`);
      toast.success('Excel report downloaded!');
    } else {
      const docPDF = new jsPDF();
      docPDF.setFillColor(79, 70, 229);
      docPDF.rect(10, 10, 190, 20, 'F');

      docPDF.setTextColor(255, 255, 255);
      docPDF.setFont('helvetica', 'bold');
      docPDF.setFontSize(14);
      docPDF.text(`Monthly Cumulative Attendance Report`, 15, 18);
      docPDF.setFontSize(9);
      docPDF.setFont('helvetica', 'normal');
      docPDF.text(`Month: ${new Date().toLocaleString('default', { month: 'long' })} ${thisYear}`, 15, 25);

      const headers = [['Reg No', 'Student Name', 'Subject Code', 'Subject', 'Date', 'Status']];
      const tableRows = logs.map(l => [
        l.student?.registerNumber,
        l.student?.name,
        l.subject?.code,
        l.subject?.name,
        new Date(l.date).toLocaleDateString(),
        l.status
      ]);

      docPDF.autoTable({
        startY: 35,
        head: headers,
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 }
      });
      docPDF.save(`Monthly_Attendance_Report_${Date.now()}.pdf`);
      toast.success('PDF report downloaded!');
    }
    setExportLoading(false);
  };

  // Export Overall cumulative statistics report for all students
  const exportOverallReport = (type) => {
    setExportLoading(true);

    if (students.length === 0) {
      toast.error("No assigned student records to export.");
      setExportLoading(false);
      return;
    }

    if (type === 'excel') {
      const rows = students.map(s => ({
        'Register Number': s.registerNumber,
        'Student Name': s.name,
        'Department': s.department,
        'Year': s.year,
        'Attendance %': `${s.attendancePercentage}%`,
        'Total Classes': s.totalWorkingDays || 0,
        'Present Count': s.presentDays || 0,
        'Absent Count': s.absentDays || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Overall Report');
      XLSX.writeFile(workbook, `Overall_Attendance_Report_${Date.now()}.xlsx`);
      toast.success('Excel overall report downloaded!');
    } else {
      const docPDF = new jsPDF();
      docPDF.setFillColor(9, 79, 76);
      docPDF.rect(10, 10, 190, 20, 'F');

      docPDF.setTextColor(255, 255, 255);
      docPDF.setFont('helvetica', 'bold');
      docPDF.setFontSize(14);
      docPDF.text(`Mentor Overall Student Attendance Report`, 15, 18);
      docPDF.setFontSize(9);
      docPDF.setFont('helvetica', 'normal');
      docPDF.text(`Mentor: ${user.name} • Assigned Students Count: ${totalStudentsCount}`, 15, 25);

      const headers = [['Reg No', 'Student Name', 'Dept', 'Year', 'Present/Total', 'Attendance %']];
      const tableRows = students.map(s => [
        s.registerNumber,
        s.name,
        s.department,
        s.year,
        `${s.presentDays || 0} / ${s.totalWorkingDays || 0}`,
        `${s.attendancePercentage}%`
      ]);

      docPDF.autoTable({
        startY: 35,
        head: headers,
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [9, 79, 76] },
        styles: { fontSize: 8 }
      });
      docPDF.save(`Overall_Attendance_Report_${Date.now()}.pdf`);
      toast.success('PDF overall report downloaded!');
    }
    setExportLoading(false);
  };

  // Export student-wise log report
  const exportStudentReport = (student, type) => {
    const studentLogs = allAttendance.filter(l => l.student?._id === student._id);
    if (studentLogs.length === 0) return toast.error('No attendance records for this student');

    if (type === 'excel') {
      const rows = studentLogs.map(l => ({
        'Subject Code': l.subject?.code,
        'Subject Name': l.subject?.name,
        'Date': new Date(l.date).toLocaleDateString(),
        'Time': l.time,
        'Status': l.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${student.name}_Report`);
      XLSX.writeFile(workbook, `Attendance_Report_${student.registerNumber}_${Date.now()}.xlsx`);
      toast.success('Student report downloaded!');
    } else {
      const docPDF = new jsPDF();
      docPDF.setFillColor(30, 58, 138);
      docPDF.rect(10, 10, 190, 20, 'F');

      docPDF.setTextColor(255, 255, 255);
      docPDF.setFont('helvetica', 'bold');
      docPDF.setFontSize(14);
      docPDF.text(`Individual Attendance Report`, 15, 18);
      docPDF.setFontSize(9);
      docPDF.setFont('helvetica', 'normal');
      docPDF.text(`Name: ${student.name} • Reg No: ${student.registerNumber} • Dept: ${student.department}`, 15, 25);

      docPDF.setTextColor(51, 65, 85);
      docPDF.setFontSize(10);
      docPDF.text(`Overall Attendance Rate: ${student.attendancePercentage}%`, 10, 36);
      docPDF.text(`Total working days: ${student.totalWorkingDays || 0}   Present days: ${student.presentDays || 0}   Absent days: ${student.absentDays || 0}`, 10, 42);

      const headers = [['Subject Code', 'Subject Name', 'Date', 'Time Marked', 'Status']];
      const tableRows = studentLogs.map(l => [
        l.subject?.code,
        l.subject?.name,
        new Date(l.date).toLocaleDateString(),
        l.time,
        l.status
      ]);

      docPDF.autoTable({
        startY: 47,
        head: headers,
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
        styles: { fontSize: 8 }
      });
      docPDF.save(`Attendance_Report_${student.registerNumber}_${Date.now()}.pdf`);
      toast.success('Student PDF report downloaded!');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <StatsSkeleton />
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Title Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center space-x-2">
            <FiTrendingUp className="text-primary-500" />
            <span>Mentor Dashboard & Reporting</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {user.role === 'admin' ? 'System Administrator Console' : `Assigned students advisor panel for Prof. ${user.name}`}
          </p>
        </div>
        
        {/* Export Reports Center */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportOverallReport('pdf')}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-rose-650 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center space-x-1.5"
            title="Download Overall PDF"
          >
            <FiDownload />
            <span>Overall PDF</span>
          </button>
          <button
            onClick={() => exportOverallReport('excel')}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center space-x-1.5"
            title="Download Overall Excel"
          >
            <FiDownload />
            <span>Overall Excel</span>
          </button>
          <button
            onClick={() => exportDailyReport('pdf')}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center space-x-1.5"
            title="Download Today's logs PDF"
          >
            <FiDownload />
            <span>Today's logs</span>
          </button>
          <button
            onClick={() => exportMonthlyReport('pdf')}
            disabled={exportLoading}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center space-x-1.5"
            title="Download Month logs PDF"
          >
            <FiDownload />
            <span>Month logs</span>
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-4 flex items-center justify-between border-l-4 border-primary-500">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Assigned Students</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{totalStudentsCount}</h3>
          </div>
          <div className="p-3 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl">
            <FiUsers className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between border-l-4 border-emerald-500">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Attendance</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{averageAttendance}%</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FiPercent className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between border-l-4 border-indigo-500">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Highest / Lowest Rate</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mt-1.5">{highestAttendance}% / {lowestAttendance}%</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <FiTrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between border-l-4 border-rose-500">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Low Attendance Alerts</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{lowAttendanceStudents.length}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-450 rounded-xl">
            <FiAlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Today's Live Attendance Workflow Card */}
      <div className="glass-card p-6 border border-orange-100/50">
        <h3 className="text-lg font-bold text-slate-805 mb-4 flex items-center space-x-2">
          <FiCalendar className="text-[#FF6B00]" />
          <span>Today's Attendance Request & Roll Overview</span>
        </h3>

        {/* Requests Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-yellow-55/10 border border-yellow-100 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-bold">Pending Requests</span>
            <span className="text-2xl font-black text-yellow-650 block mt-1">
              {todayRequests.filter(r => r.status === 'Pending').length}
            </span>
          </div>
          <div className="p-4 bg-emerald-55/10 border border-emerald-100 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-bold">Approved Requests</span>
            <span className="text-2xl font-black text-emerald-605 block mt-1">
              {todayRequests.filter(r => r.status === 'Approved').length}
            </span>
          </div>
          <div className="p-4 bg-rose-55/10 border border-rose-100 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-bold">Rejected Requests</span>
            <span className="text-2xl font-black text-rose-600 block mt-1">
              {todayRequests.filter(r => r.status === 'Rejected').length}
            </span>
          </div>
        </div>

        {/* Present/Absent Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Present list */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5 font-bold">
              <FiUserCheck className="text-emerald-500" />
              <span>Present Today ({todayAttendance.filter(a => a.status === 'Present').length})</span>
            </h4>
            <div className="bg-slate-50/50 rounded-xl border border-slate-200/50 p-3 max-h-60 overflow-y-auto space-y-2">
              {todayAttendance.filter(a => a.status === 'Present').length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center font-semibold">No students present yet today.</p>
              ) : (
                todayAttendance.filter(a => a.status === 'Present').map((log) => (
                  <div key={log._id} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-800">{log.student?.name}</span>
                      <span className="text-[10px] text-slate-400 block font-semibold">{log.student?.registerNumber}</span>
                    </div>
                    <span className="text-[10px] text-slate-450 font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                      Present • {log.time || 'N/A'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Absent list */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center space-x-1.5 font-bold">
              <FiUserX className="text-rose-500" />
              <span>Absent Today ({todayAttendance.filter(a => a.status === 'Absent').length})</span>
            </h4>
            <div className="bg-slate-50/50 rounded-xl border border-slate-200/50 p-3 max-h-60 overflow-y-auto space-y-2">
              {todayAttendance.filter(a => a.status === 'Absent').length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center font-semibold">No students absent today.</p>
              ) : (
                todayAttendance.filter(a => a.status === 'Absent').map((log) => (
                  <div key={log._id} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-800">{log.student?.name}</span>
                      <span className="text-[10px] text-slate-450 block font-semibold">{log.student?.registerNumber}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                      Absent
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart: Today's Summary */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Today's Presence Summary</h3>
          <div className="h-64">
            {presentTodayCount + absentTodayCount === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <FiUserCheck className="w-12 h-12 text-slate-350 dark:text-slate-700 mb-2" />
                <p className="text-xs text-slate-450 font-bold">No sessions active/completed today.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={todayPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {todayPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} students`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart: Dept attendance average */}
        <div className="glass-card p-6 flex flex-col justify-between lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Department-wise Average Attendance</h3>
          <div className="h-64">
            {deptBarData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-xs text-slate-450 font-bold">No students registered in any departments.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptBarData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="department" stroke="#94A3B8" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="Average Attendance %" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="glass-card p-6 flex flex-col justify-between lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Monthly Cumulative Presence Rate</h3>
          <div className="h-64">
            {monthlyTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-xs text-slate-450 font-bold">Insufficient historic attendance logs to compute trend.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Attendance Rate %" stroke="#FF6B00" fillOpacity={1} fill="url(#colorRate)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Attendance Warning Panel */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-rose-600 flex items-center space-x-1.5">
              <FiAlertTriangle />
              <span>Low Attendance Warnings (&lt; 75%)</span>
            </h3>
            <p className="text-[10px] text-slate-450 mt-0.5">Students below the minimum attendance threshold.</p>
          </div>
          
          <div className="my-4 overflow-y-auto max-h-48 space-y-2 pr-1">
            {lowAttendanceStudents.length === 0 ? (
              <div className="text-center py-8">
                <FiUserCheck className="w-8 h-8 text-emerald-500/20 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-450">All students maintain good standing!</p>
              </div>
            ) : (
              lowAttendanceStudents.map((s) => (
                <div key={s._id} className="p-2.5 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">{s.name}</h4>
                    <p className="text-[9px] font-semibold text-slate-500">{s.registerNumber} • Dept: {s.department}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-red-600">{s.attendancePercentage}%</span>
                    <p className="text-[9px] font-semibold text-slate-450">{s.presentDays || 0} / {s.totalWorkingDays || 0} days</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => exportWarningReport('pdf')}
              disabled={lowAttendanceStudents.length === 0}
              className="flex-1 py-1.5 bg-rose-650 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all shadow text-center disabled:opacity-50"
            >
              Export PDF
            </button>
            <button
              onClick={() => exportWarningReport('excel')}
              disabled={lowAttendanceStudents.length === 0}
              className="flex-1 py-1.5 bg-slate-650 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-all shadow text-center disabled:opacity-50"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Student Grid Section */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center space-x-2">
            <FiUsers className="text-primary-500" />
            <span>Assigned Students Directory</span>
          </h3>

          {/* Filters Panel */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-48">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search Student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-full pl-8 py-1.5 text-xs"
              />
            </div>
            {/* Dept */}
            <div className="relative">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="glass-input py-1.5 px-3 text-xs w-full sm:w-32"
              >
                <option value="">All Depts</option>
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {/* Year */}
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="glass-input py-1.5 px-3 text-xs w-full sm:w-28"
              >
                <option value="">All Years</option>
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
            </div>
            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input py-1.5 px-3 text-xs w-full sm:w-32"
              >
                <option value="">All Standing</option>
                <option value="good">Good (&gt;= 75%)</option>
                <option value="warning">Warning (60-74%)</option>
                <option value="critical">Critical (&lt; 60%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Cards Grid */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <FiUsers className="w-12 h-12 text-slate-350 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-455">No students matching the criteria found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((s) => {
              const rate = s.attendancePercentage || 0;
              let borderClass = 'border-emerald-500';
              let bgClass = 'bg-emerald-500/5 text-emerald-600 dark:bg-emerald-500/10';
              if (rate < 60) {
                borderClass = 'border-rose-500';
                bgClass = 'bg-rose-500/5 text-rose-600 dark:bg-rose-500/10';
              } else if (rate < 75) {
                borderClass = 'border-amber-500';
                bgClass = 'bg-amber-500/5 text-amber-600 dark:bg-amber-500/10';
              }

              return (
                <motion.div 
                  key={s._id} 
                  whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(255, 107, 0, 0.08), 0 8px 16px -6px rgba(0, 0, 0, 0.02)" }}
                  className="p-4 bg-orange-50/10 border border-orange-100/50 rounded-2xl flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800">{s.name}</h4>
                      <p className="text-[10px] font-bold text-slate-450">{s.registerNumber}</p>
                    </div>
                    {/* SVG Circular Progress Badge */}
                    <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          className="stroke-orange-50"
                          strokeWidth="3"
                          fill="transparent"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          className={rate >= 75 ? "stroke-[#FF6B00]" : "stroke-[#FF3B3B]"}
                          strokeWidth="3"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 16}
                          strokeDashoffset={2 * Math.PI * 16 * (1 - rate / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute font-black text-[8px] text-slate-700">
                        {rate}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500">
                    <div>
                      <span className="block font-bold text-slate-400">Dept</span>
                      <span className="font-semibold text-slate-700">{s.department}</span>
                    </div>
                    <div>
                      <span className="block font-bold text-slate-400">Year</span>
                      <span className="font-semibold text-slate-700">Yr {s.year}</span>
                    </div>
                    <div>
                      <span className="block font-bold text-slate-400">Days</span>
                      <span className="font-semibold text-slate-700">{s.presentDays || 0} / {s.totalWorkingDays || 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-orange-100/40">
                    <button
                      onClick={() => handleOpenProfile(s)}
                      className="flex-1 py-1.5 rounded-lg bg-[#FF6B00]/10 hover:bg-gradient-to-r hover:from-[#FF6B00] hover:to-[#FF3B3B] text-[#FF6B00] hover:text-white font-bold text-xs flex items-center justify-center space-x-1 transition-all"
                    >
                      <span>View Profile</span>
                      <FiChevronRight />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Profile Drilldown Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-3xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-400">{selectedStudent.registerNumber} • Department of {selectedStudent.department} • Year {selectedStudent.year}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportStudentReport(selectedStudent, 'pdf')}
                    className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center space-x-1"
                    title="Export Student PDF"
                  >
                    <FiDownload />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => exportStudentReport(selectedStudent, 'excel')}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center space-x-1"
                    title="Export Student Excel"
                  >
                    <FiDownload />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Attendance %</p>
                    <h4 className="text-xl font-black text-primary-500 mt-1">{selectedStudent.attendancePercentage}%</h4>
                  </div>
                  <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Total Classes</p>
                    <h4 className="text-xl font-black text-slate-750 dark:text-slate-200 mt-1">{selectedStudent.totalWorkingDays || 0}</h4>
                  </div>
                  <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Present Days</p>
                    <h4 className="text-xl font-black text-emerald-650 mt-1">{selectedStudent.presentDays || 0}</h4>
                  </div>
                  <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Absent Days</p>
                    <h4 className="text-xl font-black text-rose-600 mt-1">{selectedStudent.absentDays || 0}</h4>
                  </div>
                </div>

                {/* History Log Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-455 flex items-center space-x-1">
                    <FiCalendar />
                    <span>Attendance Log Timeline</span>
                  </h4>
                  
                  {selectedStudentLogs.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                      <p className="text-xs text-slate-455 font-bold">No attendance logs available for this student.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200/50 dark:border-slate-850/50 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-60">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-850">
                              <th className="px-4 py-2 text-slate-550">Date</th>
                              <th className="px-4 py-2 text-slate-550">Subject</th>
                              <th className="px-4 py-2 text-slate-550">Time Marked</th>
                              <th className="px-4 py-2 text-slate-550">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-250/20 dark:divide-slate-800/20">
                            {selectedStudentLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-55/20">
                                <td className="px-4 py-2.5 text-slate-500 font-semibold">{new Date(log.date).toLocaleDateString()}</td>
                                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-bold">{log.subject?.name} ({log.subject?.code})</td>
                                <td className="px-4 py-2.5 text-slate-500">{log.time}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                    log.status === 'Present'
                                      ? 'bg-emerald-500/10 text-emerald-600'
                                      : 'bg-red-500/10 text-red-650'
                                  }`}>
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorDashboard;
