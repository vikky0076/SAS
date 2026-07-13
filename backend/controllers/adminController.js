import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import DeviceRequest from '../models/DeviceRequest.js';

// @desc    Get Admin Dashboard Analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
export const getAnalytics = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({});
    const totalTeachers = await Teacher.countDocuments({});
    const totalSubjects = await Subject.countDocuments({});
    const totalAttendance = await Attendance.countDocuments({});
    const totalSessions = await AttendanceSession.countDocuments({});
    const pendingDeviceRequests = await DeviceRequest.countDocuments({ status: 'Pending' });

    res.json({
      success: true,
      analytics: {
        totalStudents,
        totalTeachers,
        totalSubjects,
        totalAttendance,
        totalSessions,
        pendingDeviceRequests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- STUDENT MANAGEMENT ---

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addStudent = async (req, res) => {
  try {
    const { name, registerNumber, email, password, department, year } = req.body;
    const exists = await Student.findOne({ $or: [{ email }, { registerNumber }] });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Student email or register number already exists' });
    }

    const student = await Student.create({
      name,
      registerNumber,
      email,
      password,
      department,
      year
    });
    res.status(201).json({ success: true, message: 'Student created successfully', student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, registerNumber, email, department, year, deviceApproved } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.name = name || student.name;
    student.registerNumber = registerNumber || student.registerNumber;
    student.email = email || student.email;
    student.department = department || student.department;
    student.year = year || student.year;
    if (deviceApproved !== undefined) student.deviceApproved = deviceApproved;

    await student.save();
    res.json({ success: true, message: 'Student updated successfully', student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    await Student.findByIdAndDelete(id);
    // Remove related attendance
    await Attendance.deleteMany({ student: id });
    await DeviceRequest.deleteMany({ student: id });

    res.json({ success: true, message: 'Student and related records deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetStudentDeviceToken = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.trustedDeviceToken = null;
    student.deviceApproved = false;
    await student.save();

    // Remove any pending device requests
    await DeviceRequest.deleteMany({ student: id });

    res.json({ success: true, message: 'Device token reset successfully. Student can register a new device upon next login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- TEACHER MANAGEMENT ---

export const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addTeacher = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    const exists = await Teacher.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Teacher email already exists' });
    }

    const teacher = await Teacher.create({ name, email, password, department });
    res.status(201).json({ success: true, message: 'Teacher created successfully', teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department } = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    teacher.name = name || teacher.name;
    teacher.email = email || teacher.email;
    teacher.department = department || teacher.department;

    await teacher.save();
    res.json({ success: true, message: 'Teacher updated successfully', teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    await Teacher.findByIdAndDelete(id);
    // Set teacher to null or update subjects taught by this teacher
    await Subject.deleteMany({ teacher: id });

    res.json({ success: true, message: 'Teacher and their subjects deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SUBJECT MANAGEMENT ---

export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({}).populate('teacher', 'name email department').sort({ createdAt: -1 });
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addSubject = async (req, res) => {
  try {
    const { name, code, teacherId } = req.body;
    const exists = await Subject.findOne({ code });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Subject code already exists' });
    }

    const subject = await Subject.create({ name, code, teacher: teacherId });
    res.status(201).json({ success: true, message: 'Subject created successfully', subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, teacherId } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    subject.name = name || subject.name;
    subject.code = code || subject.code;
    if (teacherId) subject.teacher = teacherId;

    await subject.save();
    res.json({ success: true, message: 'Subject updated successfully', subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await Subject.findByIdAndDelete(id);
    // Remove related sessions and attendance
    await AttendanceSession.deleteMany({ subject: id });
    await Attendance.deleteMany({ subject: id });

    res.json({ success: true, message: 'Subject and related records deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
