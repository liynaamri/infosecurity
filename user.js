const { MongoClient } = require('mongodb');

async function registerUser(user, client) {
  try {
    const db = client.db("BERR3123");
    const userCollection = db.collection('user');

    // Check if the user already exists
    const existingUser = await userCollection.findOne({ email: user.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Insert new user
    const result = await userCollection.insertOne(user);
    return result;
  } catch (err) {
    throw new Error('Error registering user: ' + err);
  }
}

module.exports = { registerUser };