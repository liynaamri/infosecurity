const { MongoClient } = require('mongodb');

async function createLecturer(lecturer, client) {
  try {
    const db = client.db("BERR3123");
    const lecturerCollection = db.collection('lecturer');
    const result = await lecturerCollection.insertOne(lecturer);
    return result;
  } catch (err) {
    throw new Error('Error inserting lecturer: ' + err);
  }
}

module.exports = { createLecturer };