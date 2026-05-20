const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const Log = require('./logSchema');
require('dotenv').config();

const ai = new GoogleGenAI({ vertexai: true, project: process.env.GOOGLE_CLOUD_PROJECT, location: process.env.GOOGLE_CLOUD_LOCATION });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getEmbedding(text) {
  const response = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: text
  });
  return response.embeddings[0].values;
}

async function embedAllLogs() {
  await mongoose.connect(process.env.MONGODB_URI);
  const logs = await Log.find({ embedding: { $size: 0 } });
  console.log(`Found ${logs.length} logs to embed`);

  for (const log of logs) {
    const text = `${log.event_type} ${log.severity} ${log.details}`;
    const embedding = await getEmbedding(text);
    await Log.updateOne({ _id: log._id }, { embedding });
    console.log(`Embedded: ${log.event_type} - ${log.ip}`);
    await sleep(3000); // wait 3 seconds between each request
  }

  console.log('All logs embedded successfully');
  mongoose.disconnect();
}

embedAllLogs().catch(console.error);