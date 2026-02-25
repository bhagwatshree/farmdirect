const path = require('path');
const fs = require('fs');

module.exports = async function () {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
  const p = path.join(process.cwd(), '__mongoConfig__.json');
  if (fs.existsSync(p)) fs.unlinkSync(p);
};
