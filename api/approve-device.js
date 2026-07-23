// api/approve-device.js
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
      // In production/Google environments, initializeApp() works without args via default credentials.
      // But locally, it will fail with metadata server error, so we only run it if we are in production.
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        admin.initializeApp();
      } else {
        console.warn("Firebase Admin SDK environment variables are missing! Local admin operations will fail.");
      }
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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  const { requestId, status } = req.body;

  if (!requestId || !status) {
    return res.status(400).json({ success: false, message: 'requestId and status are required' });
  }

  // Ensure Admin SDK is active
  if (!admin.apps.length) {
    return res.status(500).json({
      success: false,
      message: 'Firebase Admin SDK is not configured locally. Please copy .env.example to .env in the project root and fill in your service account credentials.'
    });
  }

  try {
    // 1. Verify user identity and role
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requesterUid = decodedToken.uid;

    const db = admin.firestore();
    
    // Check if requester is a teacher or admin
    const teacherSnap = await db.collection('teachers').doc(requesterUid).get();
    const adminSnap = await db.collection('admins').doc(requesterUid).get();

    if (!teacherSnap.exists && !adminSnap.exists) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Only teachers and admins are authorized to approve device requests.' 
      });
    }

    // 2. Fetch the device request document
    const requestRef = db.collection('deviceRequests').doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      return res.status(404).json({ success: false, message: 'Device request not found' });
    }

    const requestData = requestSnap.data();

    // 3. Update the device request status
    await requestRef.update({ status });

    // 4. If status is Approved, update the corresponding student document
    if (status === 'Approved' && requestData.student?._id) {
      const studentRef = db.collection('students').doc(requestData.student._id);
      await studentRef.update({
        trustedDeviceToken: requestData.newToken,
        deviceApproved: true,
        updatedAt: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Device request ${status.toLowerCase()} successfully!`
    });

  } catch (error) {
    console.error("Device approval API error:", error);
    return res.status(500).json({
      success: false,
      message: 'Device approval failed: ' + error.message
    });
  }
}
