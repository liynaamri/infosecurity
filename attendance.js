const { MongoClient } = require('mongodb');

async function recordAttendance(matrix, date, subject, code, section, client) {
  try {
    const database = client.db('BERR3123');
    const collection = database.collection('attendance');
    
    const user = {
      matrix: matrix,
      date: date,
      subject: subject,
      code: code,
      section: section,
    };
    
    await collection.insertOne(user);
    console.log("Attendance Submitted Successfully");
  } catch (error) {
    throw new Error("Error recording attendance: " + error);
  }
}

module.exports = { recordAttendance };