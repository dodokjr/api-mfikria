const { google } = require('googleapis');
require('dotenv').config();

const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;

if (!process.env.GOOGLE_CREDENTIALS) {
  throw new Error('GOOGLE_CREDENTIALS belum diset di environment/.env');
}

let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} catch (err) {
  throw new Error('GOOGLE_CREDENTIALS bukan JSON yang valid: ' + err.message);
}

// Scope READ-ONLY: token yang dihasilkan tidak bisa upload/ubah/hapus apa pun
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: credentials.client_email,
    // Jaga-jaga kalau "\n" ter-escape ganda saat disimpan di .env / hosting
    private_key: credentials.private_key.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Mengambil daftar foto dari folder Google Drive
 */
async function getPhotosFromFolder(folderId = DRIVE_FOLDER_ID) {
  if (!folderId) {
    throw new Error('DRIVE_FOLDER_ID belum diset');
  }

  try {
    const safeId = String(folderId).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const query = `'${safeId}' in parents and mimeType contains 'image/' and trashed = false`;

    const response = await drive.files.list({
      q: query,
      pageSize: 50,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, mimeType, webViewLink, createdTime)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return response.data.files || [];
  } catch (error) {
    throw new Error('Gagal mengambil data foto dari folder Drive: ' + error.message);
  }
}

/**
 * Mengambil metadata satu file berdasarkan ID
 */
async function getFileMetadata(fileId) {
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, webViewLink, createdTime, parents',
      supportsAllDrives: true,
    });
    return response.data;
  } catch (error) {
    throw new Error('Gagal mengambil metadata file: ' + error.message);
  }
}

/**
 * Mengambil isi file sebagai stream (untuk ditampilkan/proxy ke client)
 * Contoh pemakaian di Express:
 *   const { stream, mimeType } = await getFileStream(id);
 *   res.setHeader('Content-Type', mimeType);
 *   stream.pipe(res);
 */
async function getFileStream(fileId) {
  try {
    const meta = await getFileMetadata(fileId);
    const response = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );
    return { stream: response.data, mimeType: meta.mimeType, name: meta.name };
  } catch (error) {
    throw new Error('Gagal mengambil isi file: ' + error.message);
  }
}

/**
 * Scan folder Drive: cari satu file berdasarkan nama persis (mis. logo.png)
 */
async function findFileByName(name, folderId = DRIVE_FOLDER_ID) {
  if (!folderId) {
    throw new Error('DRIVE_FOLDER_ID belum diset');
  }

  try {
    const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const query = `name = '${esc(name)}' and '${esc(folderId)}' in parents and trashed = false`;

    const response = await drive.files.list({
      q: query,
      pageSize: 1,
      fields: 'files(id, name, mimeType)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return (response.data.files || [])[0] || null;
  } catch (error) {
    throw new Error('Gagal mencari file di folder Drive: ' + error.message);
  }
}

module.exports = {
  drive,
  defaultFolderId: DRIVE_FOLDER_ID,
  getPhotosFromFolder,
  findFileByName,
  getFileMetadata,
  getFileStream,
};