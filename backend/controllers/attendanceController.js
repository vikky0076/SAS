import crypto from 'crypto';
import AttendanceSession from '../models/AttendanceSession.js';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';

// Helper to recalculate and update attendance percentage for a student
const updateAttendancePercentage = async (studentId) => {
  try {
    const totalSessions = await AttendanceSession.countDocuments({});
    if (totalSessions === 0) return;

    const presentCount = await Attendance.countDocuments({
      student: studentId,
      status: 'Present'
    });

    const percentage = Math.round((presentCount / totalSessions) * 100);
    await Student.findByIdAndUpdate(studentId, { attendancePercentage: percentage });
  } catch (error) {
    console.error('Error updating attendance percentage:', error);
  }
};

// @desc    Start attendance session
// @route   POST /api/attendance/start-session
// @access  Private (Teacher)
export const startSession = async (req, res) => {
  try {
    const { subjectId, duration } = req.body; // duration in minutes

    if (!subjectId || !duration) {
      return res.status(400).json({ success: false, message: 'Subject ID and duration are required' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Generate secure random QR token
    const qrToken = crypto.randomBytes(32).toString('hex');
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    // Deactivate previous active sessions for this subject
    await AttendanceSession.updateMany({ subject: subjectId, active: true }, { active: false });

    const session = await AttendanceSession.create({
      subject: subjectId,
      qrToken,
      startTime,
      endTime,
      active: true
    });

    res.status(201).json({
      success: true,
      message: 'Attendance session started successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Rotate/Regenerate QR token for an active session
// @route   POST /api/attendance/rotate-qr/:sessionId
// @access  Private (Teacher)
export const rotateQR = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await AttendanceSession.findById(sessionId);

    if (!session || !session.active) {
      return res.status(404).json({ success: false, message: 'Active session not found' });
    }

    if (new Date() > session.endTime) {
      session.active = false;
      await session.save();
      return res.status(400).json({ success: false, message: 'Session has already expired' });
    }

    // Generate new QR token
    const newQrToken = crypto.randomBytes(32).toString('hex');
    session.qrToken = newQrToken;
    await session.save();

    res.json({
      success: true,
      qrToken: newQrToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark attendance as present
// @route   POST /api/attendance/mark
// @access  Private (Student)
export const markAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { qrToken, deviceId } = req.body;

    if (!qrToken) {
      return res.status(400).json({ success: false, message: 'QR token is required' });
    }

    // 1. Trusted Device system check
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!student.deviceApproved) {
      return res.status(403).json({
        success: false,
        message: 'Attendance blocked: Your device is pending approval. Please request device change approval.'
      });
    }

    if (!deviceId || deviceId !== student.trustedDeviceToken) {
      return res.status(403).json({
        success: false,
        message: 'Attendance blocked: Unrecognized device token. Please login from your trusted device or request a device change.'
      });
    }

    // 2. Find and validate session
    const session = await AttendanceSession.findOne({ qrToken, active: true }).populate('subject');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Invalid or expired QR code' });
    }

    const now = new Date();
    if (now < session.startTime || now > session.endTime) {
      // Deactivate session if time expired
      session.active = false;
      await session.save();
      return res.status(400).json({ success: false, message: 'Attendance session has expired' });
    }

    // 3. Double-check duplicate attendance
    const alreadyMarked = await Attendance.findOne({ student: studentId, session: session._id });
    if (alreadyMarked) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this class' });
    }

    // Format current time as HH:MM
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const attendance = await Attendance.create({
      student: studentId,
      subject: session.subject._id,
      session: session._id,
      time: timeString,
      status: 'Present'
    });

    // Recalculate percentage
    await updateAttendancePercentage(studentId);

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this class' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get live attendance count and student list for an active session
// @route   GET /api/attendance/live/:sessionId
// @access  Private (Teacher)
export const getLiveAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await AttendanceSession.findById(sessionId).populate('subject');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const records = await Attendance.find({ session: sessionId })
      .populate('student', 'name registerNumber email department year')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      session,
      count: records.length,
      records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance history for student
// @route   GET /api/attendance/student-history
// @access  Private (Student)
export const getStudentHistory = async (req, res) => {
  try {
    const studentId = req.user._id;
    const history = await Attendance.find({ student: studentId })
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher sessions (active & inactive)
// @route   GET /api/attendance/teacher-sessions
// @access  Private (Teacher)
export const getTeacherSessions = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Find subjects taught by this teacher
    const subjects = await Subject.find({ teacher: teacherId });
    const subjectIds = subjects.map(s => s._id);

    const sessions = await AttendanceSession.find({ subject: { $in: subjectIds } })
      .populate('subject', 'name code')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export attendance report as CSV/JSON data
// @route   GET /api/attendance/report/:subjectId
// @access  Private (Teacher)
export const getReportData = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const records = await Attendance.find({ subject: subjectId })
      .populate('student', 'name registerNumber email department year')
      .populate('session', 'startTime')
      .sort({ createdAt: -1 });

    // Format data for CSV/frontend consumption
    const report = records.map(r => ({
      studentName: r.student.name,
      registerNumber: r.student.registerNumber,
      email: r.student.email,
      department: r.student.department,
      year: r.student.year,
      date: new Date(r.date).toLocaleDateString(),
      time: r.time,
      status: r.status
    }));

    res.json({
      success: true,
      subject,
      report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
