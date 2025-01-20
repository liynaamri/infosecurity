
const express = require('express')
const app = express();
const port = process.env.PORT || 3000;
const lecturer = require ('./lecturer.js')

app.use(express.json())

app.post('/lecturer', verifyToken, async (req, res) => {
    const lecturer = {
    
        subject: req.body.subject,
        code:req.body.code,
        Program: req.body.Program,
        lecturer: req.body.lecturer,

    };

    
        const db = client.db("BENR2423");
        const lecturerCollection = db.collection('lecturer');

        lecturerCollection.insertOne(lecturer, (err, result) => {
            if (err) {
                console.error('Error inserting subject:', err);
                res.status(500).send('Error inserting subject');
                return;
            }

            res.status(201).send('Subject created successfully');
        });

        client.close();
    });

    function verifyToken(req, res, next) {
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
      
            if (!decoded || !decoded.role) { // Check for missing properties
              return res.status(401).send('Invalid or incomplete token');
            }
      
            if (decoded.role !== 'lecturer' &&  decoded.role !== 'admin') {
              return res.status(401).send('Invalid role');
            }
      
            next();
          });
        } catch (error) {
          console.error('Unexpected error:', error);
          res.status(500).send('Internal server error');
        }
      }
   

    module.exports = {
        lecturer,
    }