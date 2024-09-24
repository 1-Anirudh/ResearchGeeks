const { db } = require('./firebaseConfig');
const admin = require('firebase-admin');
const { collection, addDoc, serverTimestamp } = require("firebase/firestore"); // Import necessary functions

async function submitFeedback(feedback) {
    try {
        const feedbackCollectionRef = collection(db, 'feedbacks'); // Get a reference to the 'feedbacks' collection
        const docRef = await addDoc(feedbackCollectionRef, {
            feedback: feedback,
            timestamp: serverTimestamp() // Use serverTimestamp() to get the current server time
        });
        console.log("Feedback written with ID: ", docRef.id);
    } catch (error) {
        console.error("Error adding Feedback: ", error);
        throw error;
    }
}

module.exports = { submitFeedback };