const app = require('./app');
const connectDB = require('./config/database');
const seed = require('./utils/seed');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(connected => { if (connected) return seed(); })
  .catch(console.error);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
