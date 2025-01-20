
const express = require('express')
const app = express();
const port = process.env.PORT || 3000;
const subject = require ('./subject.js')

app.use(express.json())

app.post('/subject', SubjectToken, async (req, res) => {
    const subject = {
        matrix: req.body.matrix,
        subject: req.body.subject,
        code:req.body.code,
        Program: req.body.Program,
        lecturer: req.body.lecturer,

    };

    
        const db = client.db("BENR2423");
        const subjectCollection = db.collection('subject');

        subjectCollection.insertOne(subject, (err, result) => {
            if (err) {
                console.error('Error inserting subject:', err);
                res.status(500).send('Error inserting subject');
                return;
            }

            res.status(201).send('Subject created successfully');
        });

        client.close();
    });

    function SubjectToken(req, res, next) {
      let header = req.headers.authorization;
    
    
      if (!header) {
        return res.status(401).send('Unauthorized request');
      }
    
      let tokens = header.split(' ')[1]; // Ensure correct space-based split
    
      try {
        // Log token for inspection
        console.log('Received token:', tokens);
    
        jwt.verify(tokens, 'very strong password', async (err, decoded) => {
          if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).send('Invalid token');
          }
    
          console.log('Decoded token:', decoded);
          
          const { role, username } = req.body;
    
          if (!decoded || !decoded.role) { // Check for missing properties
            return res.status(401).send('Invalid or incomplete token');
          }
    
          if (decoded.role !== 'admin' && decoded.role !== 'lecterur') {
            return res.status(401).send( 'You are not authorized to submit subject.');
          }
    
          next();
        });
    
      } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send('Internal server error');
      }
    }
   

    module.exports = {
        subject,
    }