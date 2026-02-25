const path = require('path');
const mongoose = require('mongoose');

const getBaseUri = () => {
  const { uri } = require(path.join(process.cwd(), '__mongoConfig__.json'));
  return uri;
};

const connect = async () => {
  const base = getBaseUri();
  // Unique DB per test file to allow parallel execution without cross-contamination
  const workerId = process.env.JEST_WORKER_ID || '0';
  const dbName = `testdb_w${workerId}_${Date.now()}`;
  const uri = base.endsWith('/') ? `${base}${dbName}` : `${base}/${dbName}`;
  await mongoose.connect(uri);
};

const disconnect = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

const clear = async () => {
  for (const coll of Object.values(mongoose.connection.collections)) {
    await coll.deleteMany({});
  }
};

module.exports = { connect, disconnect, clear };
