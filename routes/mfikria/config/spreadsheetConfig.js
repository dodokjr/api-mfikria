const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

if (!SPREADSHEET_ID) {
  throw new Error('SPREADSHEET_ID belum diset di environment/.env');
}

if (!process.env.GOOGLE_CREDENTIALS) {
  throw new Error('GOOGLE_CREDENTIALS belum diset di environment/.env');
}

let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} catch (err) {
  throw new Error('GOOGLE_CREDENTIALS bukan JSON yang valid: ' + err.message);
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: credentials.client_email,
    // Jaga-jaga kalau "\n" ter-escape ganda saat disimpan di .env / hosting
    private_key: credentials.private_key.replace(/\\n/g, '\n'),
  },
  // Cukup scope Sheets; Drive sudah ditangani file drive terpisah
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

module.exports = {
  spreadsheetId: SPREADSHEET_ID,
  sheets,
};