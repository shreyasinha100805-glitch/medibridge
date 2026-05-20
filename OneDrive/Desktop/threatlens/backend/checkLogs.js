const mongoose = require('mongoose');
const Log = require('./logSchema');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const withEmbedding = await Log.countDocuments({ embedding: { $not: { $size: 0 } } });
  const without = await Log.countDocuments({ embedding: { $size: 0 } });
  console.log('With embedding:', withEmbedding);
  console.log('Without embedding:', without);
  mongoose.disconnect();
});