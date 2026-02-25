process.env.MONGOMS_STARTUP_TIMEOUT = '60000';

const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

module.exports = async function () {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;
  fs.writeFileSync(
    path.join(process.cwd(), '__mongoConfig__.json'),
    JSON.stringify({ uri: mongod.getUri() })
  );
};
