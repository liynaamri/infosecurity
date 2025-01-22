const express = require('express')
const app = express();
const port = process.env.PORT || 3000;
const attendance = require ('./attendance.js')

app.use(express.json())

app.post('/attendance', StudentToken, async (req, res) => {
    const { matrix, date, subject, code, section } = req.body;
    try {
      attendanceModule.recordAttendance(matrix, date, subject, code, section);
      res.status(201).send("Attendance Submitted");
    } catch (error) {
      console.log(error);
      res.status(500).send(`Error ${error}`);
    }
  });
    async function recordAttendance(matrix, date, subject,code, section){
      try{
        const database = client.db ('BENR2423');
        const collection = database.collection('attendance') ;
        
        const user ={
          matrix: matrix,
          date :date ,
          subject:subject,
          code:code,
          section:section,
          };
        
          await collection.insertOne(user);
          console.log("Attendance Submitted Successfully");
        }
        catch(error){
          console.log("Attendance already exists")
          }
          }
          function StudentToken(req, res, next) {
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
          
                if (decoded.role !== 'student') {
                  return res.status(401).send( 'You are not authorized to submit attendance.');
                }
          
                next();
              });
          
            } catch (error) {
              console.error('Unexpected error:', error);
              res.status(500).send('Internal server error');
            }
          }



module.exports = {
   attendance,

}
