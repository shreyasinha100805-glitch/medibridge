const mongoose = require('mongoose');
const Log = require('./logSchema');
require('dotenv').config();

const events = [
  { event_type: 'auth_failure', severity: 'high', user: 'admin', ip: '192.168.1.105', location: 'Mumbai, IN', details: '5 failed SSH login attempts in 60 seconds from same IP' },
  { event_type: 'auth_failure', severity: 'high', user: 'root', ip: '45.33.32.156', location: 'Amsterdam, NL', details: 'Brute force attack detected on root account with 20 attempts' },
  { event_type: 'port_scan', severity: 'medium', user: 'unknown', ip: '103.21.244.0', location: 'Singapore, SG', details: 'Sequential port scan detected across ports 20-1024' },
  { event_type: 'privilege_escalation', severity: 'critical', user: 'john.doe', ip: '10.0.0.5', location: 'Delhi, IN', details: 'User attempted to escalate privileges using sudo exploit' },
  { event_type: 'anomalous_access', severity: 'medium', user: 'jane.smith', ip: '172.16.0.8', location: 'Bangalore, IN', details: 'User accessed 200 files in 5 minutes, unusual behavior' },
  { event_type: 'auth_failure', severity: 'high', user: 'admin', ip: '91.108.4.0', location: 'Moscow, RU', details: 'Multiple failed login attempts from unknown geographic location' },
  { event_type: 'malware_detected', severity: 'critical', user: 'system', ip: '192.168.1.20', location: 'Kolkata, IN', details: 'Ransomware signature detected in uploaded file on server' },
  { event_type: 'data_exfiltration', severity: 'critical', user: 'contractor1', ip: '203.0.113.5', location: 'Chennai, IN', details: 'Large data transfer of 5GB to external IP detected' },
  { event_type: 'port_scan', severity: 'low', user: 'unknown', ip: '198.51.100.0', location: 'London, UK', details: 'Slow port scan detected over 24 hour period' },
  { event_type: 'anomalous_access', severity: 'high', user: 'mike.jones', ip: '10.0.0.12', location: 'Hyderabad, IN', details: 'Login at 3am from new device not seen before' },
  { event_type: 'auth_failure', severity: 'medium', user: 'deploy', ip: '52.74.219.0', location: 'Tokyo, JP', details: 'Failed API key authentication on deployment server' },
  { event_type: 'privilege_escalation', severity: 'critical', user: 'guest', ip: '10.0.0.99', location: 'Pune, IN', details: 'Guest account attempted to access admin panel' },
  { event_type: 'malware_detected', severity: 'high', user: 'system', ip: '192.168.2.15', location: 'Mumbai, IN', details: 'Trojan detected in email attachment on mail server' },
  { event_type: 'data_exfiltration', severity: 'high', user: 'sarah.connor', ip: '10.0.1.5', location: 'Noida, IN', details: 'Sensitive database records accessed and copied to USB' },
  { event_type: 'anomalous_access', severity: 'low', user: 'bob.wilson', ip: '172.16.0.20', location: 'Jaipur, IN', details: 'User logged in from two different countries within 1 hour' },
];

// Generate timestamps spread over last 7 days
const seededLogs = events.map((e, i) => ({
  ...e,
  timestamp: new Date(Date.now() - (i * 8 * 60 * 60 * 1000)), // every 8 hours back
  embedding: [] // we'll add embeddings next
}));

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Log.deleteMany({});
  await Log.insertMany(seededLogs);
  console.log(`Seeded ${seededLogs.length} security logs`);
  mongoose.disconnect();
}

seed().catch(console.error);