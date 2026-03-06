const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

module.exports = async function () {
  const mongod = await MongoMemoryServer.create({
    instance: { startupTimeout: 60000 },
  });
  global.__MONGOD__ = mongod;
  fs.writeFileSync(
    path.join(process.cwd(), '__mongoConfig__.json'),
    JSON.stringify({ uri: mongod.getUri() })
  );
};
