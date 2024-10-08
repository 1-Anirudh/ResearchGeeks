const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { registerUser, signInUser } = require('./firebaseConfig');
const { saveUserDetails } = require('./save-details');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');
const { submitFeedback } = require('./feedback');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Handle registration form submission
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCredential = await registerUser(email, password);
        req.session.loginSuccess = true;
        req.session.uid = userCredential.user.uid; // Store the user's UID in the session
        res.redirect('/add-details');
    } catch (error) {
        res.send(`Registration failed: ${error.message}`);
    }
});

// Serve the login form
app.get('/login', (req, res) => {
    res.redirect('/');
});

// Handle login form submission
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("email", email);
    console.log("password", password);
    try {
        const userCredential = await signInUser(email, password);
        req.session.loginSuccess = true;
        req.session.uid = userCredential.user.uid; // Store the user's UID in the session
        res.redirect('/');
    } catch (error) {
        res.send(`<p>Login failed: ${error.message}</p>
            <script>
            setTimeout(function() {
                window.location.href = '/';
            }, 1000);`);
    }
});

// Serve the home page
app.get('/', (req, res) => {
    if (req.session.loginSuccess) {
        res.render('home', { 
            logoName: 'EurekaTribe', 
            profileName: req.session.name || 'User', 
            jobTitle: 'Student'
        });
    } else {
        res.render('index');
    }
});

app.get('/search', (req, res) => {
    res.render('search');
});

// Serve the feedback form
app.get('/feedback', (req, res) => {
    res.render('feedback');
});

// Handle feedback form submission
app.post('/feedback', async (req, res) => {
    const { score, feedback } = req.body;
    console.log("score", score);
    console.log("feedback", feedback);
    try {
        await submitFeedback(score, feedback);
        res.send(`
            <p>Thankyou for the feedback !!</p>
            <script>
                setTimeout(function() {
                    window.location.href = '/';
                }, 1000);
            </script>
        `);
    } catch (error) {
        res.send(`<p>Error submitting feedback: ${error.message} try later </p>
            <script>
            setTimeout(function() {
                window.location.href = '/';
            }, 1000);`);
    }
});

// Serve the add-details form
app.get('/add-details', (req, res) => {
    if (req.session.loginSuccess) {
        res.render('add-details');
    } else {
        res.redirect('/');
    }
});

// Handle saving details
app.post('/save-details', async (req, res) => {
    const { name, interests, skills } = req.body;
    req.session.name = name;
    console.log(req.body);
    const uid = req.session.uid; // Get the user's UID from the session
    if (!uid) {
        return res.send('Error: User not logged in.');
    }
    try {
        await saveUserDetails(uid, name, interests, skills);
        res.send(`
            <p>Details saved successfully!</p>
            <script>
                setTimeout(function() {
                    window.location.href = '/';
                }, 1000);
            </script>
        `);
    } catch (error) {
        res.send(`<p>Error saving details: ${error.message}, you later add as well</p>
            <script>
            setTimeout(function() {
                window.location.href = '/';
            }, 1000);`);
    }
});

// Serve the profile page
app.get('/profile', (req, res) => {
    if (!req.session.uid) {
        return res.redirect('/login');
    }
    res.render('profile');
});



// Fetch interests
app.get('/fetch-interests', async (req, res) => {
    if (!req.session.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const db = getFirestore();
        const userDocRef = doc(db, 'users', req.session.uid);
        const interestsCollection = collection(userDocRef, 'interests');
        const interestsSnapshot = await getDocs(interestsCollection);
        const interests = interestsSnapshot.docs.map(doc => doc.data().name);
        res.json(interests);
    } catch (error) {
        console.error('Error fetching interests:', error);
        res.status(500).json({ error: 'Failed to fetch interests' });
    }
});

// Fetch skills
app.get('/fetch-skills', async (req, res) => {
    if (!req.session.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const db = getFirestore();
        const userDocRef = doc(db, 'users', req.session.uid);
        const skillsCollection = collection(userDocRef, 'skills');
        const skillsSnapshot = await getDocs(skillsCollection);
        const skills = skillsSnapshot.docs.map(doc => doc.data().name);
        res.json(skills);
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.redirect('/');
        }
        res.redirect('/'); // Redirect to login or home page after logout
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} see http://localhost:${PORT}`);
});