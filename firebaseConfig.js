const admin = require('firebase-admin');
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore'); // Import the getFirestore function
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");

const firebaseConfig = require('./firebase-config.json'); // Your service account credentials

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const db = getFirestore(app); // Get the Firestore instance using getFirestore()

// Function to handle user registration
async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Trim the user ID to 20 characters
    const trimmedUid = user.uid.substring(0, 20);

    // Create a new document in the users collection with the trimmed UID as the document ID
    const userDocRef = doc(db, 'users', trimmedUid);
    await setDoc(userDocRef, {
      email: email,
      uid: user.uid
    });
    console.log("Document written with ID: ", trimmedUid);

    // Create subcollections within the user document
    const interestsCollection = collection(userDocRef, 'interests');
    const skillsCollection = collection(userDocRef, 'skills');

    return userCredential;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

// Function to sign in a user with email and password
async function signInUser(email, password) {
  // Sign in with email and password
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("Error signing in user:", error);
    throw error;
  }
}

module.exports = { registerUser, signInUser, db };
