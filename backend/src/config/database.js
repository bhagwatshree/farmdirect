const mongoose = require('mongoose');

const generateDocDBAuthToken = async () => {
  const { Signer } = require('@aws-sdk/rds-signer');
  const signer = new Signer({
    hostname: process.env.DOCDB_HOST,
    port: parseInt(process.env.DOCDB_PORT || '27017', 10),
    username: process.env.DOCDB_USERNAME,
    region: process.env.AWS_REGION || 'ap-south-1',
  });
  return signer.getAuthToken();
};

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    };

    // DocumentDB IAM authentication (used on AWS)
    if (process.env.DOCDB_IAM_AUTH === 'true') {
      const token = await generateDocDBAuthToken();
      const host = process.env.DOCDB_HOST;
      const port = process.env.DOCDB_PORT || '27017';
      const dbName = process.env.DOCDB_DATABASE || 'farmdirect';
      const username = encodeURIComponent(process.env.DOCDB_USERNAME);

      uri = `mongodb://${username}:${encodeURIComponent(token)}@${host}:${port}/${dbName}?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;

      const caPath = process.env.DOCDB_CA_PATH || '/app/rds-combined-ca-bundle.pem';
      options.tls = true;
      options.tlsCAFile = caPath;
    }

    if (!uri) {
      uri = 'mongodb://127.0.0.1:27017/farmdirect';
    }

    await mongoose.connect(uri, options);
    console.log('MongoDB/DocumentDB connected successfully');
    return true;
  } catch (error) {
    console.warn('Database connection failed:', error.message);
    console.warn('Using in-memory fallback mode. Install and run MongoDB for persistence.');
    return false;
  }
};

module.exports = connectDB;
