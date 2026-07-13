import express from 'express';
import {
  getAnalytics,
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  resetStudentDeviceToken,
  getTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  getSubjects,
  addSubject,
  updateSubject,
  deleteSubject
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply admin protection to all routes
router.use(protect, authorize('admin'));

router.get('/analytics', getAnalytics);

// Students CRUD
router.get('/students', getStudents);
router.post('/students', addStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.post('/students/:id/reset-device', resetStudentDeviceToken);

// Teachers CRUD
router.get('/teachers', getTeachers);
router.post('/teachers', addTeacher);
router.put('/teachers/:id', updateTeacher);
router.delete('/teachers/:id', deleteTeacher);

// Subjects CRUD
router.get('/subjects', getSubjects);
router.post('/subjects', addSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

export default router;
