const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

/**
 * Connect to the in-memory MongoDB server before running tests
 */
const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("Connected to in-memory MongoDB");
};

/**
 * Drop database collections and close connection after tests complete
 */
const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
  console.log("Disconnected from in-memory MongoDB");
};

/**
 * Clear all data from collections between tests to keep tests isolated
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    if (collections.hasOwnProperty(key)) {
      await collections[key].deleteMany();
    }
  }
};

module.exports = {
  connect,
  closeDatabase,
  clearDatabase,
};
