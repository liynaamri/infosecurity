const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { createSubject } = require('./subject.js');
const { recordAttendance } = require('./attendance.js');
const { createLecturer } = require('./lecturer.js');

const uri = "mongodb+srv://maisarahliyana:mai1234@berr3123.3mg6v.mongodb.net/?retryWrites=true&w=majority&appName=berr3123";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(express.json());

const JWT_SECRET = 'your-secret-key'; // Replace with a secure key

// In-memory store for failed login attempts (use Redis for production)
const sessionAttempts = {};

// Maximum password attempts and cooldown duration (in milliseconds)
const MAX_PASSWORD_ATTEMPTS = 3;
const COOL_DOWN_PERIOD = 10 * 60 * 1000; // 10 minutes

// Connect to MongoDB
async function run() {
  try {
    await client.connect();
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}
run();

// Middleware to verify token
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).send('Unauthorized request');
  }

  const token = header.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send('Invalid token');
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).send('Internal server error');
  }
}

// Function to check password strength
function isPasswordStrong(password) {
  // Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}

// User Registration (for testing, optional)
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!isPasswordStrong(password)) {
      return res.status(400).send(
        'Password is not strong enough. It must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character.'
      );
    }

    const db = client.db('BERR3123');
    const usersCollection = db.collection('user');

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ email, password: hashedPassword });

    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(500).send('Error registering user: ' + error.message);
  }
});

// Login API with rate-limiting logic
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const now = Date.now();
  if (sessionAttempts[email]) {
    const { attempts, lastAttemptTime } = sessionAttempts[email];

    // If cooldown period is active
    if (attempts >= MAX_PASSWORD_ATTEMPTS && now - lastAttemptTime < COOL_DOWN_PERIOD) {
      const timeRemaining = Math.ceil((COOL_DOWN_PERIOD - (now - lastAttemptTime)) / 1000);
      return res.status(429).send(`Too many login attempts. Try again in ${timeRemaining} seconds.`);
    }

    // Reset attempts if cooldown period has passed
    if (now - lastAttemptTime >= COOL_DOWN_PERIOD) {
      sessionAttempts[email] = { attempts: 0, lastAttemptTime: now };
    }
  }

  try {
    const db = client.db('BERR3123');
    const usersCollection = db.collection('user');

    const user = await usersCollection.findOne({ email });
    if (!user) {
      // Track failed attempts
      sessionAttempts[email] = sessionAttempts[email] || { attempts: 0, lastAttemptTime: now };
      sessionAttempts[email].attempts++;
      sessionAttempts[email].lastAttemptTime = now;

      return res.status(401).send('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Track failed attempts
      sessionAttempts[email] = sessionAttempts[email] || { attempts: 0, lastAttemptTime: now };
      sessionAttempts[email].attempts++;
      sessionAttempts[email].lastAttemptTime = now;

      return res.status(401).send('Invalid email or password');
    }

    // Reset attempts on successful login
    sessionAttempts[email] = { attempts: 0, lastAttemptTime: now };

    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).send('Error during login: ' + error.message);
  }
});

// Logout API (optional; token expiration handles it)
app.post('/logout', (req, res) => {
  res.status(200).send('Logout successful');
});

// Subject API (No Token Required)
app.post('/subject', async (req, res) => {
  const { code, name, creditHour, section, lecturer }= req.body;
  try {
    const result = await createSubject(subject, client);
    res.status(201).send('Subject created successfully');
  } catch (error) {
    res.status(500).send('Error creating subject: ' + error.message);
  }
});

// Attendance API (No Token Required)
app.post('/attendance', async (req, res) => {
  const { matrix, date, subject, code, section } = req.body;
  try {
    await recordAttendance(matrix, date, subject, code, section, client);
    res.status(201).send('Attendance submitted');
  } catch (error) {
    res.status(500).send('Error submitting attendance: ' + error.message);
  }
});

// Lecturer API (Protected)
app.post('/lecturer', verifyToken, async (req, res) => {
  const { name, email, department } = req.body;
  try {
    const lecturer = { name, email, department };
    const result = await createLecturer(lecturer, client);
    res.status(201).send('Lecturer created successfully');
  } catch (error) {
    res.status(500).send('Error creating lecturer: ' + error.message);
  }
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
