import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Base API configuration (kept for compatibility/logging, but not used for REST API requests)
  const API_URL = 'http://localhost:5000/api';

  // Helper: Generate a unique device token
  const getOrGenerateDeviceToken = () => {
    let token = localStorage.getItem('trusted_device_token');
    if (!token) {
      token = crypto.randomUUID ? crypto.randomUUID() : 'dev-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('trusted_device_token', token);
    }
    return token;
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const uid = firebaseUser.uid;
          let userData = null;

          // 1. Try reading from students collection
          const studentRef = doc(db, 'students', uid);
          const studentSnap = await getDoc(studentRef);
          if (studentSnap.exists()) {
            userData = { _id: uid, ...studentSnap.data() };
            
            // Handle student trusted device validation on login state recovery
            const localToken = getOrGenerateDeviceToken();
            if (!userData.trustedDeviceToken) {
              // First login: Register this device token
              await updateDoc(studentRef, {
                trustedDeviceToken: localToken,
                deviceApproved: true
              });
              userData.trustedDeviceToken = localToken;
              userData.deviceApproved = true;
              userData.deviceMismatch = false;
            } else {
              // Compare tokens
              if (localToken !== userData.trustedDeviceToken) {
                userData.deviceMismatch = true;
                userData.deviceApproved = false; // Block client-side approval
              } else {
                userData.deviceMismatch = false;
              }
            }
          }

          // 2. Try teachers collection if not student
          if (!userData) {
            const teacherRef = doc(db, 'teachers', uid);
            const teacherSnap = await getDoc(teacherRef);
            if (teacherSnap.exists()) {
              userData = { _id: uid, ...teacherSnap.data() };
            }
          }

          // 3. Try admins collection if not teacher/student
          if (!userData) {
            const adminRef = doc(db, 'admins', uid);
            const adminSnap = await getDoc(adminRef);
            if (adminSnap.exists()) {
              userData = { _id: uid, ...adminSnap.data() };
            }
          }

          setUser(userData);
        } catch (error) {
          console.error('Error fetching user profile from Firestore:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync dark mode class with DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Fetch profile details manually if needed
  const fetchUserProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const uid = auth.currentUser.uid;
      let userData = null;

      const studentRef = doc(db, 'students', uid);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        userData = { _id: uid, ...studentSnap.data() };
        const localToken = localStorage.getItem('trusted_device_token');
        userData.deviceApproved = userData.deviceApproved && (localToken === userData.trustedDeviceToken);
        userData.deviceMismatch = localToken !== userData.trustedDeviceToken;
      }

      if (!userData) {
        const teacherRef = doc(db, 'teachers', uid);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          userData = { _id: uid, ...teacherSnap.data() };
        }
      }

      if (!userData) {
        const adminRef = doc(db, 'admins', uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          userData = { _id: uid, ...adminSnap.data() };
        }
      }

      setUser(userData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Login handler
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      let loggedUser = null;
      let isStudentRole = false;
      let deviceMismatch = false;
      let deviceApproved = false;

      // Check students collection
      const studentRef = doc(db, 'students', uid);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        isStudentRole = true;
        const studentData = studentSnap.data();
        loggedUser = { _id: uid, ...studentData };

        const localDeviceToken = getOrGenerateDeviceToken();
        if (!studentData.trustedDeviceToken) {
          // First login: Register this device token
          await updateDoc(studentRef, {
            trustedDeviceToken: localDeviceToken,
            deviceApproved: true
          });
          loggedUser.trustedDeviceToken = localDeviceToken;
          loggedUser.deviceApproved = true;
          deviceApproved = true;
        } else {
          // Compare tokens
          if (localDeviceToken !== studentData.trustedDeviceToken) {
            deviceMismatch = true;
            deviceApproved = false;
            
            // Auto-create a pending device change request if one doesn't exist
            const requestsQuery = query(
              collection(db, 'deviceRequests'),
              where('student._id', '==', uid),
              where('status', '==', 'Pending')
            );
            const requestsSnap = await getDocs(requestsQuery);
            if (requestsSnap.empty) {
              await addDoc(collection(db, 'deviceRequests'), {
                student: {
                  _id: uid,
                  name: studentData.name,
                  email: studentData.email,
                  registerNumber: studentData.registerNumber,
                  department: studentData.department,
                  year: studentData.year
                },
                oldToken: studentData.trustedDeviceToken,
                newToken: localDeviceToken,
                status: 'Pending',
                requestedTime: new Date().toISOString()
              });
            }
          } else {
            deviceApproved = studentData.deviceApproved;
          }
        }
        
        loggedUser.deviceApproved = deviceApproved;
        loggedUser.deviceMismatch = deviceMismatch;
      }

      // Check teachers
      if (!loggedUser) {
        const teacherRef = doc(db, 'teachers', uid);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          loggedUser = { _id: uid, ...teacherSnap.data() };
        }
      }

      // Check admins
      if (!loggedUser) {
        const adminRef = doc(db, 'admins', uid);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          loggedUser = { _id: uid, ...adminSnap.data() };
        }
      }

      if (!loggedUser) {
        throw new Error('User document not found in database');
      }

      setUser(loggedUser);
      return { success: true, user: loggedUser };
    } catch (error) {
      console.error('Login error:', error);
      let message = 'Login failed. Please try again.';
      if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'User not found.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      } else if (error.code === 'auth/configuration-not-found') {
        message = 'Email/Password sign-in is not enabled in the Firebase Console. Please enable it under Build > Authentication > Sign-in method.';
      } else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    }
  };

  // Student register handler
  const registerStudent = async (studentData) => {
    try {
      const { email, password, name, registerNumber, department, year } = studentData;
      
      // First, create the user inside Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Save student profile document in Firestore
      await setDoc(doc(db, 'students', uid), {
        name,
        registerNumber,
        email,
        department,
        year: parseInt(year),
        role: 'student',
        trustedDeviceToken: null,
        deviceApproved: false,
        attendancePercentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Firebase automatically signs in the user. Log them out to preserve UI manual login flow.
      await signOut(auth);

      return { success: true, message: 'Student registered successfully!' };
    } catch (error) {
      console.error('Student registration error:', error);
      let message = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email already in use.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak.';
      } else if (error.code === 'auth/configuration-not-found') {
        message = 'Email/Password registration is not enabled in the Firebase Console. Please enable it under Build > Authentication > Sign-in method.';
      } else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    }
  };

  // Teacher register handler
  const registerTeacher = async (teacherData) => {
    try {
      const { email, password, name, department, adminSecret } = teacherData;

      // Create user inside Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      let role = 'teacher';
      if (adminSecret && adminSecret === 'AdminSuperSecret123') {
        role = 'admin';
      }

      const collectionName = role === 'admin' ? 'admins' : 'teachers';

      // Save user profile inside Firestore
      await setDoc(doc(db, collectionName, uid), {
        name,
        email,
        department,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Sign out to preserve redirect login flow
      await signOut(auth);

      return { success: true, message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully!` };
    } catch (error) {
      console.error('Teacher registration error:', error);
      let message = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email already in use.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak.';
      } else if (error.code === 'auth/configuration-not-found') {
        message = 'Email/Password registration is not enabled in the Firebase Console. Please enable it under Build > Authentication > Sign-in method.';
      } else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Request new device change (Student only)
  const requestDeviceChange = async (newToken) => {
    if (!user) return { success: false, message: 'Not authenticated' };
    try {
      const uid = auth.currentUser.uid;
      
      // Query if there's already a pending request
      const requestsQuery = query(
        collection(db, 'deviceRequests'),
        where('student._id', '==', uid),
        where('status', '==', 'Pending')
      );
      const requestsSnap = await getDocs(requestsQuery);
      
      if (!requestsSnap.empty) {
        const docId = requestsSnap.docs[0].id;
        await updateDoc(doc(db, 'deviceRequests', docId), {
          newToken,
          oldToken: user.trustedDeviceToken,
          requestedTime: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'deviceRequests'), {
          student: {
            _id: uid,
            name: user.name,
            email: user.email,
            registerNumber: user.registerNumber,
            department: user.department,
            year: user.year
          },
          oldToken: user.trustedDeviceToken,
          newToken,
          status: 'Pending',
          requestedTime: new Date().toISOString()
        });
      }

      return { success: true, message: 'Device change request submitted. Please ask your teacher to approve it.' };
    } catch (error) {
      console.error('Device request submission error:', error);
      return { success: false, message: error.message || 'Request failed' };
    }
  };

  // Send Password Reset Email
  const sendResetEmail = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (error) {
      console.error('Password reset email error:', error);
      return { success: false, message: error.message || 'Failed to send reset email.' };
    }
  };

  // Confirm Password Reset with OOB Code
  const resetPasswordWithCode = async (oobCode, newPassword) => {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      return { success: true, message: 'Password has been reset successfully.' };
    } catch (error) {
      console.error('Confirm reset password error:', error);
      return { success: false, message: error.message || 'Failed to reset password.' };
    }
  };

  // Google Login/Sign-in
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const uid = firebaseUser.uid;

      // Check if student exists
      const studentRef = doc(db, 'students', uid);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        const localDeviceToken = getOrGenerateDeviceToken();
        let loggedUser = { _id: uid, ...studentData };

        if (!studentData.trustedDeviceToken) {
          await updateDoc(studentRef, {
            trustedDeviceToken: localDeviceToken,
            deviceApproved: true,
            updatedAt: new Date().toISOString()
          });
          loggedUser.trustedDeviceToken = localDeviceToken;
          loggedUser.deviceApproved = true;
        } else {
          loggedUser.deviceApproved = studentData.deviceApproved && (localDeviceToken === studentData.trustedDeviceToken);
          loggedUser.deviceMismatch = localDeviceToken !== studentData.trustedDeviceToken;
        }

        setUser(loggedUser);
        return { success: true, user: loggedUser, isNewUser: false };
      }

      // Check if teacher exists
      const teacherRef = doc(db, 'teachers', uid);
      const teacherSnap = await getDoc(teacherRef);
      if (teacherSnap.exists()) {
        const loggedUser = { _id: uid, ...teacherSnap.data() };
        setUser(loggedUser);
        return { success: true, user: loggedUser, isNewUser: false };
      }

      // Check if admin exists
      const adminRef = doc(db, 'admins', uid);
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) {
        const loggedUser = { _id: uid, ...adminSnap.data() };
        setUser(loggedUser);
        return { success: true, user: loggedUser, isNewUser: false };
      }

      // If they don't exist anywhere, they are a new user via Google
      return { success: true, firebaseUser, isNewUser: true };
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      let message = 'Google Sign-In failed.';
      if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
        message = 'Google Sign-In provider is not enabled in the Firebase Console. Please enable Google under Build > Authentication > Sign-in method and select a project support email.';
      } else if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
        message = 'Network connection lost. Please check your internet connection and try again.';
      } else if (error.message) {
        message = error.message;
      }
      return { success: false, message };
    }
  };

  // Google Register User (complete profile setup)
  const registerGoogleUser = async (firebaseUser, role, additionalData) => {
    try {
      const uid = firebaseUser.uid;
      const email = firebaseUser.email;
      const name = additionalData.name || firebaseUser.displayName || 'Google User';
      const department = additionalData.department;

      if (role === 'student') {
        const { registerNumber, year } = additionalData;
        const localDeviceToken = getOrGenerateDeviceToken();

        await setDoc(doc(db, 'students', uid), {
          name,
          registerNumber,
          email,
          department,
          year: parseInt(year),
          role: 'student',
          trustedDeviceToken: localDeviceToken,
          deviceApproved: true,
          attendancePercentage: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        const { adminSecret } = additionalData;
        let finalRole = 'teacher';
        if (adminSecret && adminSecret === 'AdminSuperSecret123') {
          finalRole = 'admin';
        }
        const collectionName = finalRole === 'admin' ? 'admins' : 'teachers';

        await setDoc(doc(db, collectionName, uid), {
          name,
          email,
          department,
          role: finalRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      await fetchUserProfile();
      return { success: true };
    } catch (error) {
      console.error('Complete Google registration error:', error);
      return { success: false, message: error.message || 'Failed to complete profile registration.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        darkMode,
        toggleDarkMode,
        login,
        registerStudent,
        registerTeacher,
        loginWithGoogle,
        registerGoogleUser,
        logout,
        fetchUserProfile,
        requestDeviceChange,
        sendResetEmail,
        resetPasswordWithCode,
        API_URL
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
