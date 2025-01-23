const { MongoClient } = require('mongodb');

async function createSubject(subject, client) {
  try {
    const db = client.db("BERR3123");
    const subjectCollection = db.collection('subject');
    const result = await subjectCollection.insertOne(subject);
    return result;
  } catch (err) {
    throw new Error('Error inserting subject: ' + err);
  }
}

module.exports = { createSubject };