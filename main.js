const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3001;

const uri = "mongodb+srv://maisarahliyana:mai1234@berr3123.3mg6v.mongodb.net/?retryWrites=true&w=majority&appName=berr3123";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

app.use(cors());
app.use(express.json());

app.post('/viewDetails', verifyToken, async (req, res) => {
  client.db("BERR3123").collection("attendance").find({
    "code": { $eq: req.body.code }
  }).toArray().then((result) => {
    if (result.length > 0) {
      res.status(200).json(result);
      res.status(400).send('View Successful')
    } else {
      res.send('No record')
    }
  })
});

// Student attendance
app.post('/attendance', StudentToken, async (req, res) => {
  try {
    const { matrix, password, date, subject, code, section } = req.body;

    if (!matrix || !password || !date || !subject || !code || !section) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingAttendance = await client
      .db('BERR3123')
      .collection('attendance')
      .findOne({ matrix });

    if (existingAttendance) {
      return res.status(400).json({ success: false, message: 'Matrix already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.db('BERR3123').collection('attendance').insertOne({
      matrix,
      password: hashedPassword,
      date,
      subject,
      code,
      section,
    });

    res.status(200).json({ success: true, message: 'Attendance submitted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Subject
app.post('/subject', SubjectToken, async (req, res) => {
  const { subject, code, program, lecturer } = req.body;

  client.db("BERR3123").collection("Subject").find({
    "code": { $eq: req.body.code }
  }).toArray().then((result) => {
    console.log(result);

    if (result.length > 0) {
      res.status(400).send("Subject already exists");
    } else {
      client.db("BERR3123").collection("Subject").insertOne({
        "subject": subject,
        "code": code,
        "program": program,
        "lecturer": lecturer
      });
      res.send('Subject added successfully');
    }
  });
});

// Lecturer
app.post('/lecturer', verifyToken, async (req, res) => {
  const { subject, code, program, lecturer } = req.body;

  client.db("BERR3123").collection("lecturer").find({
    "code": { $eq: req.body.code }
  }).toArray().then((result) => {
    console.log(result);

    if (result.length > 0) {
      res.status(400).send("Subject already exists");
    } else {
      client.db("BERR3123").collection("lecturer").insertOne({
        "subject": subject,
        "code": code,
        "program": program,
        "lecturer": lecturer
      });
      res.send('Lecturer registered successfully');
    }
  });
});

// Token verification for lecturer and admin
function verifyToken(req, res, next) {
  let header = req.headers.authorization;

  if (!header) {
    return res.status(401).send('Unauthorized request');
  }

  let tokens = header.split(' ')[1];

  try {
    jwt.verify(tokens, 'very strong password', async (err, decoded) => {
      if (err) {
        return res.status(401).send('Invalid token');
      }

      const { role } = req.body;
      if (!decoded || !decoded.role) {
        return res.status(401).send('Invalid or incomplete token');
      }

      if (decoded.role !== 'admin' && decoded.role !== 'lecturer') {
        return res.status(401).send('Access Denied.');
      }

      next();
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).send('Internal server error');
  }
}

// Token for subject
function SubjectToken(req, res, next) {
  let header = req.headers.authorization;

  if (!header) {
    return res.status(401).send('Unauthorized request');
  }

  let tokens = header.split(' ')[1];

  try {
    jwt.verify(tokens, 'very strong password', async (err, decoded) => {
      if (err) {
        return res.status(401).send('Invalid token');
      }

      if (decoded.role !== 'student') {
        return res.status(401).send('You are not authorized to submit subject.');
      }

      next();
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).send('Internal server error');
  }
}

// Token for student attendance
function StudentToken(req, res, next) {
  let header = req.headers.authorization;

  if (!header) {
    return res.status(401).send('Unauthorized request');
  }

  let tokens = header.split(' ')[1];

  try {
    jwt.verify(tokens, 'very strong password', async (err, decoded) => {
      if (err) {
        return res.status(401).send('Invalid token');
      }

      if (decoded.role !== 'student') {
        return res.status(401).send('You are not authorized to submit attendance.');
      }

      next();
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).send('Internal server error');
  }
}

function generateAccessToken(payload) {
  return jwt.sign(payload, "very strong password", { expiresIn: '365d' });
}

function isPasswordStrong(password) {
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

// Register for users (admin, lecturer, student)
app.post('/register', (req, res) => {
  const { username, password, role } = req.body;

  if (!isPasswordStrong(password)) {
    return res.status(400).send('Password must contain at least one uppercase letter, one number, one special character, and be at least 8 characters long.');
  }

  const hash = bcrypt.hashSync(password, 10);

  client.db("BERR3123").collection("users").find({
    "username": { $eq: req.body.username }
  }).toArray().then((result) => {
    if (result.length > 0) {
      res.status(400).send("Username already exists");
    } else {
      client.db("BERR3123").collection("users").insertOne({
        "username": req.body.username,
        "password": hash,
        "role": req.body.role
      });
      res.send('Registered successfully');
    }
  });
});

const sessionAttempts = {};
const MAX_PASSWORD_ATTEMPTS = 3;
const COOL_DOWN_PERIOD = 10 * 60 * 1000;

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  const currentTime = Date.now();
  sessionAttempts[username] = sessionAttempts[username] || { attempts: 0, lockUntil: null };
  const userSession = sessionAttempts[username];

  if (userSession.lockUntil && userSession.lockUntil > currentTime) {
    const waitTime = Math.ceil((userSession.lockUntil - currentTime) / 1000);
    return res.status(403).send(`Too many incorrect attempts. Try again in ${waitTime} seconds.`);
  }

  try {
    const users = await client.db("BERR3123").collection("users").find({ username }).toArray();

    if (!users || users.length === 0) {
      return res.status(404).send("User not found");
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      userSession.attempts += 1;

      if (userSession.attempts >= MAX_PASSWORD_ATTEMPTS) {
        userSession.lockUntil = currentTime + COOL_DOWN_PERIOD;
        return res.status(403).send("Too many incorrect attempts. Try again in 10 minutes.");
      }

      const remainingAttempts = MAX_PASSWORD_ATTEMPTS - userSession.attempts;
      return res.status(401).send(`Incorrect password. You have ${remainingAttempts} attempts remaining.`);
    }

    userSession.attempts = 0;
    userSession.lockUntil = null;

    const token = jwt.sign(
      { user: user.username, role: user.role },
      "very strong password",
      { expiresIn: "365d" }
    );

    res.send(token);
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal server error");
  }
});

app.post('/logout', (req, res) => {
  console.log('logout', req.body);
  res.send("See You Again :)");
});

app.get('/view/Details/:code', verifyToken, async (req, res) => {
  try {
    await viewDetails(client, req.params.code);
    return res.status(200).send("Details viewed successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

fetch('/register', {
  method: 'POST',
  body: JSON.stringify({
    username: 'user123',
    password: 'StrongPassword1!',
    role: 'student'
  }),
  headers: { 'Content-Type': 'application/json' },
})
  .then(response => response.text()) // or response.json() depending on how you're sending data
  .then(data => console.log(data))    // Ensure this logs the expected response
  .catch(error => console.error('Error:', error));
