const { MongoClient } = require('mongodb');

async function createLecturer(lecturer, client) {
  try {
    // Ensure the client is connected before interacting with the database
    // No need for client.isConnected() anymore; MongoDB driver manages the connection state automatically
    const db = client.db("BERR3123");
    const lecturerCollection = db.collection('lecturer');
    
    // Insert the lecturer object into the database
    const result = await lecturerCollection.insertOne(lecturer);
    return result.insertedId; // Return the inserted ID or any other useful data
  } catch (err) {
    throw new Error('Error inserting lecturer: ' + err.message); // Provide more specific error message
  }
}

module.exports = { createLecturer };