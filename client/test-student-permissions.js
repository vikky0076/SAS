import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  deleteUser
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  collection, 
  query,
  where,
  deleteDoc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApDxkTe7g2-9tdP9rstD2XhVC5UQNtb8s",
  authDomain: "smart-attendance-system-83712.firebaseapp.com",
  projectId: "smart-attendance-system-83712",
  storageBucket: "smart-attendance-system-83712.firebasestorage.app",
  messagingSenderId: "331080688001",
  appId: "1:331080688001:web:88b98f1d63c98d91aac880"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = "temp.student." + Math.random().toString(36).substring(7) + "@example.com";
const password = "TempStudent123!";

async function run() {
  console.log("1. Creating temporary student auth user...");
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("FAILED to create student auth user:", error.message);
    process.exit(1);
  }

  const user = userCredential.user;
  const uid = user.uid;
  console.log(`Student user created. UID: ${uid}. Email: ${email}`);

  try {
    console.log("\n2. Creating student document in Firestore 'students' collection...");
    await setDoc(doc(db, "students", uid), {
      name: "Temporary Test Student",
      registerNumber: "99999999",
      email: email,
      department: "CSE",
      year: 1,
      role: "student",
      trustedDeviceToken: "test-token",
      deviceApproved: true,
      attendancePercentage: 0,
      presentDays: 0,
      absentDays: 0,
      totalWorkingDays: 0,
      passwordPrivacy: true,
      mentorId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log("Success.");

    console.log("\n3. Testing getDoc of own student document...");
    try {
      const snap = await getDoc(doc(db, "students", uid));
      console.log(`Success. Document exists: ${snap.exists()}. Data:`, JSON.stringify(snap.data()));
    } catch (err) {
      console.error("FAILED to getDoc own student document:", err.message);
    }

    console.log("\n4. Testing read of 'attendance' collection for own student...");
    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('student._id', '==', uid)
      );
      const attSnap = await getDocs(attendanceQuery);
      console.log(`Success, retrieved ${attSnap.size} attendance records.`);
    } catch (err) {
      console.error("FAILED to query 'attendance' collection:", err.message);
    }

    console.log("\n5. Testing read of 'attendanceRequests' collection for own student...");
    try {
      const attReqQuery = query(
        collection(db, 'attendanceRequests'),
        where('student._id', '==', uid)
      );
      const reqSnap = await getDocs(attReqQuery);
      console.log(`Success, retrieved ${reqSnap.size} attendance requests.`);
    } catch (err) {
      console.error("FAILED to query 'attendanceRequests' collection:", err.message);
    }

    console.log("\n6. Testing read of 'notifications' collection for own student...");
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('studentId', '==', uid)
      );
      const notifSnap = await getDocs(notificationsQuery);
      console.log(`Success, retrieved ${notifSnap.size} notifications.`);
    } catch (err) {
      console.error("FAILED to query 'notifications' collection:", err.message);
    }

    console.log("\n7. Testing read of 'attendanceSessions' collection...");
    try {
      const sessionsQuery = query(
        collection(db, 'attendanceSessions'),
        where('active', '==', true)
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      console.log(`Success, retrieved ${sessionsSnap.size} active sessions.`);
    } catch (err) {
      console.error("FAILED to query 'attendanceSessions' collection:", err.message);
    }

    console.log("\n8. Testing read of 'mentors' collection...");
    try {
      const mentorsSnap = await getDocs(collection(db, 'mentors'));
      console.log(`Success, retrieved ${mentorsSnap.size} mentors.`);
    } catch (err) {
      console.error("FAILED to query 'mentors' collection:", err.message);
    }

  } catch (error) {
    console.error("An unexpected error occurred during test:", error);
  } finally {
    console.log("\nCleaning up Firestore student document via admin bypass...");
    // Let's use temporary admin bypass to delete the student document
    const adminEmail = "temp.admin." + Math.random().toString(36).substring(7) + "@example.com";
    const adminPassword = "TempAdmin123!" + Math.random().toString(36).substring(7);
    
    try {
      const adminCred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const adminUid = adminCred.user.uid;
      await setDoc(doc(db, "admins", adminUid), {
        name: "Temp Delete Admin",
        email: adminEmail,
        role: "admin",
        createdAt: new Date().toISOString()
      });
      
      // Delete the student document
      await deleteDoc(doc(db, "students", uid));
      console.log("Firestore student document deleted via admin bypass.");
      
      // Delete admin doc
      await deleteDoc(doc(db, "admins", adminUid));
      // Delete admin user
      await deleteUser(adminCred.user);
    } catch (err) {
      console.error("Failed during admin bypass cleanup:", err.message);
    }

    console.log("Deleting temporary authentication student...");
    try {
      await deleteUser(user);
      console.log("Authentication user deleted.");
    } catch (err) {
      console.error("FAILED to delete authentication user:", err.message);
    }
    
    console.log("Done.");
    process.exit(0);
  }
}

run();
