import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';

export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecretkey123');

      if (decoded.role === 'student') {
        const student = await Student.findById(decoded.id).select('-password');
        if (!student) {
          return res.status(401).json({ success: false, message: 'Not authorized, student not found' });
        }
        req.user = student;
        req.user.role = 'student';
      } else if (decoded.role === 'teacher') {
        const teacher = await Teacher.findById(decoded.id).select('-password');
        if (!teacher) {
          return res.status(401).json({ success: false, message: 'Not authorized, teacher not found' });
        }
        req.user = teacher;
        req.user.role = 'teacher';
      } else if (decoded.role === 'admin') {
        // Simple admin payload
        if (decoded.email === (process.env.ADMIN_EMAIL || 'admin@college.edu')) {
          req.user = {
            _id: 'admin_root_id',
            name: 'System Admin',
            email: decoded.email,
            role: 'admin'
          };
        } else {
          return res.status(401).json({ success: false, message: 'Not authorized, admin not valid' });
        }
      } else {
        return res.status(401).json({ success: false, message: 'Not authorized, invalid role' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route`
      });
    }
    next();
  };
};
