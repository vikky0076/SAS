import express from 'express';
import {
  startSession,
  rotateQR,
  markAttendance,
  getLiveAttendance,
  getStudentHistory,
  getTeacherSessions,
  getReportData
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Teacher sessions starting and reporting
router.post('/start-session', protect, authorize('teacher'), startSession);
router.post('/rotate-qr/:sessionId', protect, authorize('teacher'), rotateQR);
router.get('/live/:sessionId', protect, authorize('teacher', 'admin'), getLiveAttendance);
router.get('/teacher-sessions', protect, authorize('teacher'), getTeacherSessions);
router.get('/report/:subjectId', protect, authorize('teacher', 'admin'), getReportData);

// Student marking and view history
router.post('/mark', protect, authorize('student'), markAttendance);
router.get('/student-history', protect, authorize('student'), getStudentHistory);

export default router;
