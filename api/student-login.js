// api/student-login.js
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
      });
    } else {
      console.warn("Firebase Admin SDK environment variables are missing! Custom Auth will fail.");
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(455).json({ success: false, message: 'Method Not Allowed' });
  }

  const { email, registerNumberOrName } = req.body;

  if (!email || !registerNumberOrName) {
    return res.status(400).json({ success: false, message: 'Email and Name/Register Number are required' });
  }

  // Ensure Admin SDK is active
  if (!admin.apps.length) {
    return res.status(500).json({
      success: false,
      message: 'Firebase Admin SDK not initialized. Please set service account credentials.'
    });
  }

  try {
    const db = admin.firestore();
    
    // Find active student record
    const studentsRef = db.collection('students');
    const querySnapshot = await studentsRef.where('email', '==', email.toLowerCase().trim()).get();

    if (querySnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'Your account has not been created by your mentor.'
      });
    }

    let studentDoc = null;
    querySnapshot.forEach(doc => {
      studentDoc = { id: doc.id, ...doc.data() };
    });

    // Check account status
    const isActive = (studentDoc.status === 'Active' || studentDoc.accountStatus === 'Active');
    if (!isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive.'
      });
    }

    // Verify Name or Register Number matches
    const nameMatches = studentDoc.name && studentDoc.name.toLowerCase().trim() === registerNumberOrName.toLowerCase().trim();
    const regMatches = studentDoc.registerNumber && studentDoc.registerNumber.toString().toLowerCase().trim() === registerNumberOrName.toLowerCase().trim();

    if (!nameMatches && !regMatches) {
      return res.status(400).json({
        success: false,
        message: 'Invalid name or register number for the given email.'
      });
    }

    // Generate Custom Auth Token
    const customToken = await admin.auth().createCustomToken(studentDoc.id);

    return res.status(200).json({
      success: true,
      token: customToken
    });

  } catch (error) {
    console.error("Login verification error:", error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed: ' + error.message
    });
  }
}
