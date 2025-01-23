const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { createSubject } = require('./subject');
const { recordAttendance } = require('./attendance');
const { createLecturer } = require('./lecturer');
const jwt = require('jsonwebtoken');
const cors = require('cors');
app.use(cors());
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3001;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(express.json());

async function run() {
  try {
    await client.connect();
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run();

const { registerUser } = require('./user');

// User Registration API
app.post('/user/register', async (req, res) => {
  const user = req.body; // Expecting user details like {name, email, password}
  try {
    const result = await registerUser(user, client);
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(500).send('Error registering user: ' + error.message);
  }
});

// Subject API
app.post('/subject', async (req, res) => {
  const subject = req.body;
  try {
    const result = await createSubject(subject, client);
    res.status(201).send('Subject created successfully');
  } catch (error) {
    res.status(500).send('Error creating subject: ' + error.message);
  }
});

// Attendance API
app.post('/attendance', async (req, res) => {
  const { matrix, date, subject, code, section } = req.body;
  try {
    await recordAttendance(matrix, date, subject, code, section, client);
    res.status(201).send('Attendance submitted');
  } catch (error) {
    res.status(500).send('Error submitting attendance: ' + error.message);
  }
});

// Lecturer API
app.post('/lecturer', async (req, res) => {
  const lecturer = req.body;
  try {
    const result = await createLecturer(lecturer, client);
    res.status(201).send('Lecturer created successfully');
  } catch (error) {
    res.status(500).send('Error creating lecturer: ' + error.message);
  }
});

// Token verification middleware
function verifyToken(req, res, next) {
  let header = req.headers.authorization;

  if (!header) {
    return res.status(401).send('Unauthorized request');
  }

  let token = header.split(' ')[1];
  try {
    jwt.verify(token, 'your-secret-key', (err, decoded) => {
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

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});