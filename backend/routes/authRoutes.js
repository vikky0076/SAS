import express from 'express';
import {
  registerStudent,
  registerTeacher,
  login,
  requestDeviceChange,
  forgotPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register-student', registerStudent);
router.post('/register-teacher', registerTeacher);
router.post('/login', login);
router.post('/request-device-change', protect, requestDeviceChange);
router.post('/forgot-password', forgotPassword);

export default router;
