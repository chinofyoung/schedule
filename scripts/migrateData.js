// This script migrates data from the "nurses" collection to the "employees" collection
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  addDoc,
} = require("firebase/firestore");

// Firebase configuration - replace with your actual config or load from .env
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateNursesToEmployees() {
  try {
    console.log("Starting migration of nurses to employees...");

    // Get all nurses from the old collection
    const nursesCollection = collection(db, "nurses");
    const nursesSnapshot = await getDocs(nursesCollection);

    if (nursesSnapshot.empty) {
      console.log("No nurses found to migrate.");
      return;
    }

    // Create a new array to store employee data
    const employeesToMigrate = [];

    // Process each nurse document
    nursesSnapshot.forEach((doc) => {
      const nurseData = doc.data();

      // Map nurse data to employee structure
      const employeeData = {
        firstName: nurseData.firstName,
        lastName: nurseData.lastName,
        position: nurseData.position || "Nurse 1", // Default to Nurse 1 if no position
        mobileNumber: nurseData.mobileNumber || "",
        requestedDaysOff: nurseData.requestedDaysOff || [],
        // Add any additional fields needed for employees
        migratedFromId: doc.id, // Store original ID for reference
        migratedAt: new Date().toISOString(),
      };

      employeesToMigrate.push(employeeData);
      console.log(
        `Prepared migration for ${employeeData.firstName} ${employeeData.lastName}`
      );
    });

    // Insert the migrated employees
    const employeesCollection = collection(db, "employees");
    let successCount = 0;

    // Add each employee to the new collection
    for (const employee of employeesToMigrate) {
      try {
        const docRef = await addDoc(employeesCollection, employee);
        console.log(
          `Successfully migrated ${employee.firstName} ${employee.lastName} with ID: ${docRef.id}`
        );
        successCount++;
      } catch (err) {
        console.error(
          `Error migrating ${employee.firstName} ${employee.lastName}:`,
          err
        );
      }
    }

    console.log(
      `Migration complete. Successfully migrated ${successCount} out of ${employeesToMigrate.length} nurses.`
    );
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

// Run the migration
migrateNursesToEmployees()
  .then(() => console.log("Migration script complete."))
  .catch((err) => console.error("Migration script failed:", err));
