import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import DeviceRequest from '../models/DeviceRequest.js';

// Generate JWT token helper
const generateToken = (id, role, email = '') => {
  return jwt.sign(
    { id, role, email },
    process.env.JWT_SECRET || 'jwtsecretkey123',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new student
// @route   POST /api/auth/register-student
// @access  Public
export const registerStudent = async (req, res) => {
  try {
    const { name, registerNumber, email, password, department, year } = req.body;

    // Check if student exists
    const studentExists = await Student.findOne({ $or: [{ email }, { registerNumber }] });
    if (studentExists) {
      return res.status(400).json({ success: false, message: 'Student with this email or register number already exists' });
    }

    const student = await Student.create({
      name,
      registerNumber,
      email,
      password,
      department,
      year
    });

    if (student) {
      res.status(201).json({
        success: true,
        message: 'Student registered successfully'
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid student data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new teacher
// @route   POST /api/auth/register-teacher
// @access  Public
export const registerTeacher = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    const teacherExists = await Teacher.findOne({ email });
    if (teacherExists) {
      return res.status(400).json({ success: false, message: 'Teacher with this email already exists' });
    }

    const teacher = await Teacher.create({
      name,
      email,
      password,
      department
    });

    if (teacher) {
      res.status(201).json({
        success: true,
        message: 'Teacher registered successfully'
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid teacher data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unified Login (Student, Teacher, Admin)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password, role, deviceId } = req.body;

    // 1. Admin Login
    if (role === 'admin') {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@college.edu';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (email === adminEmail && password === adminPassword) {
        return res.json({
          success: true,
          token: generateToken('admin_root_id', 'admin', adminEmail),
          user: {
            _id: 'admin_root_id',
            name: 'System Admin',
            email: adminEmail,
            role: 'admin'
          }
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
      }
    }

    // 2. Teacher Login
    if (role === 'teacher') {
      const teacher = await Teacher.findOne({ email });
      if (teacher && (await teacher.comparePassword(password))) {
        return res.json({
          success: true,
          token: generateToken(teacher._id, 'teacher'),
          user: {
            _id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            department: teacher.department,
            role: 'teacher'
          }
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    }

    // 3. Student Login
    if (role === 'student') {
      const student = await Student.findOne({ email });
      if (!student || !(await student.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      let deviceTokenToReturn = deviceId;
      let deviceMismatched = false;

      // First time login logic
      if (!student.trustedDeviceToken) {
        const generatedToken = crypto.randomUUID();
        student.trustedDeviceToken = generatedToken;
        student.deviceApproved = true;
        await student.save();
        deviceTokenToReturn = generatedToken;
      } else {
        // Subsequent logins
        if (!deviceId || deviceId !== student.trustedDeviceToken) {
          // New device detected
          deviceMismatched = true;
        }
      }

      return res.json({
        success: true,
        token: generateToken(student._id, 'student'),
        user: {
          _id: student._id,
          name: student.name,
          email: student.email,
          registerNumber: student.registerNumber,
          department: student.department,
          year: student.year,
          role: 'student',
          deviceApproved: student.deviceApproved && !deviceMismatched,
          trustedDeviceToken: student.trustedDeviceToken
        },
        deviceMismatched,
        trustedDeviceToken: deviceTokenToReturn
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid role' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Request for Device Change
// @route   POST /api/auth/request-device-change
// @access  Private (Student)
export const requestDeviceChange = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { newToken } = req.body;

    if (!newToken) {
      return res.status(400).json({ success: false, message: 'New device token is required' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if there is already a pending request
    const existingRequest = await DeviceRequest.findOne({
      student: studentId,
      status: 'Pending'
    });

    if (existingRequest) {
      // Update the pending request with the new token
      existingRequest.newToken = newToken;
      existingRequest.oldToken = student.trustedDeviceToken || '';
      existingRequest.requestedTime = Date.now();
      await existingRequest.save();
    } else {
      await DeviceRequest.create({
        student: studentId,
        oldToken: student.trustedDeviceToken || '',
        newToken,
        status: 'Pending'
      });
    }

    // Set deviceApproved to false until teacher approves
    student.deviceApproved = false;
    await student.save();

    res.json({
      success: true,
      message: 'Device change request submitted successfully. Waiting for teacher approval.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mock password reset functionality
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // Realistically, would send reset link. Here we stub success.
    res.json({
      success: true,
      message: `Password reset instructions sent to ${email} (simulated)`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
