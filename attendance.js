const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 3001;

// Replace with your MongoDB connection string
const client = new MongoClient("mongodb+srv://maisarahliyana:mai1234@berr3123.3mg6v.mongodb.net/?retryWrites=true&w=majority&appName=berr3123");

// Middleware for parsing JSON
app.use(express.json());

// Import the attendance module
const attendanceModule = require('./attendance.js');

// Route for recording attendance
app.post('/attendance', StudentToken, async (req, res) => {
  const { matrix, password, date, subject, code, section } = req.body;

  try {
    await recordAttendance(matrix, password, date, subject, code, section);
    res.status(201).json({ success: true, message: "Attendance Submitted Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: `Error: ${error.message}` });
  }
});

// Function to record attendance in the database
async function recordAttendance(matrix, password, date, subject, code, section) {
  try {
    await client.connect();
    const database = client.db('BERR3123');
    const collection = database.collection('attendance');

    // Check if attendance already exists for this matrix
    const existingAttendance = await collection.findOne({ matrix });
    if (existingAttendance) {
      throw new Error("Attendance already exists");
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      matrix,
      password: hashedPassword,
      date,
      subject,
      code,
      section,
    };

    await collection.insertOne(user);
    console.log("Attendance Submitted Successfully");
  } catch (error) {
    throw new Error(error.message);
  }
}

// Middleware for verifying student tokens
function StudentToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ success: false, message: 'Unauthorized request' });
  }

  const token = header.split(' ')[1]; // Extract token after "Bearer"

  try {
    jwt.verify(token, 'very strong password', (err, decoded) => {
      if (err) {
        console.error('Error verifying token:', err);
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      console.log('Decoded token:', decoded);

      if (decoded.role !== 'student') {
        return res.status(403).json({ success: false, message: 'You are not authorized to submit attendance' });
      }

      next();
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// Export the module
module.exports = {
  attendance: recordAttendance,
};


