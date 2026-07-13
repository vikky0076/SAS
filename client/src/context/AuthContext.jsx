import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceApproved, setDeviceApproved] = useState(true);
  const [deviceMismatched, setDeviceMismatched] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);

          // If the user is a student, we can verify their current device status with backend
          if (parsedUser.role === 'student') {
            // For now, load from student state or fetch profile
            // We'll trust the stored state until a request fails, or check it on dashboard load.
            setDeviceApproved(parsedUser.deviceApproved);
          }
        } catch (error) {
          console.error('Error parsing saved user', error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const localDeviceToken = localStorage.getItem('trustedDeviceToken') || '';
      const res = await api.post('/auth/login', {
        email,
        password,
        role,
        deviceId: localDeviceToken
      });

      const { token, user: userData, deviceMismatched: mismatched, trustedDeviceToken } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      if (trustedDeviceToken) {
        localStorage.setItem('trustedDeviceToken', trustedDeviceToken);
      }

      setUser(userData);
      setDeviceMismatched(mismatched);
      setDeviceApproved(userData.deviceApproved);

      setLoading(false);
      return { success: true, user: userData, deviceMismatched: mismatched };
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const registerStudent = async (studentData) => {
    try {
      await api.post('/auth/register-student', studentData);
      return { success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const registerTeacher = async (teacherData) => {
    try {
      await api.post('/auth/register-teacher', teacherData);
      return { success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const requestDeviceChange = async (newToken) => {
    try {
      const res = await api.post('/auth/request-device-change', { newToken });
      
      // Update local user state
      const savedUser = JSON.parse(localStorage.getItem('user'));
      if (savedUser) {
        savedUser.deviceApproved = false;
        localStorage.setItem('user', JSON.stringify(savedUser));
        setUser(savedUser);
      }
      setDeviceApproved(false);
      setDeviceMismatched(true);
      return res.data;
    } catch (error) {
      throw error.response?.data?.message || 'Device request failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Note: Do not remove trustedDeviceToken since it represents the hardware profile
    setUser(null);
    setDeviceMismatched(false);
    setDeviceApproved(true);
  };

  const value = {
    user,
    loading,
    deviceApproved,
    deviceMismatched,
    login,
    registerStudent,
    registerTeacher,
    requestDeviceChange,
    logout,
    setUser,
    setDeviceApproved,
    setDeviceMismatched
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
