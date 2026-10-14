// Jalankan: node test-drive.js FILE_ID
const { google } = require('googleapis');
require('dotenv').config();
const c = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const fileId = process.argv[2];
if (!fileId) { console.log('Pakai: node test-drive.js FILE_ID'); process.exit(1); }
(async () => {
  const auth = new google.auth.JWT({
    email: c.client_email,
    key: c.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const { access_token } = await auth.authorize();
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${access_token}`, Range: 'bytes=0-0' },
  });
  console.log('STATUS:', r.status);
  if (r.status !== 200 && r.status !== 206) console.log((await r.text()).slice(0, 600));
})();