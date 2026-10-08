const { google } = require('googleapis');
const stream = require('stream');
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

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: credentials.client_email,
    // Jaga-jaga kalau "\n" ter-escape ganda saat disimpan di .env / hosting
    private_key: credentials.private_key.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
  ],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Mengunggah file foto ke Google Drive
 * Mendukung express-fileupload (.data) dan multer (.buffer)
 */
async function uploadPhotoToDrive(fileObject, fileName, folderId = DRIVE_FOLDER_ID) {
  const buffer = fileObject.data || fileObject.buffer;
  if (!buffer || buffer.length === 0) {
    throw new Error(
      'Data file kosong. Jika memakai express-fileupload dengan useTempFiles: true, ' +
      'matikan opsi itu atau baca file dari tempFilePath.'
    );
  }

  const bufferStream = new stream.PassThrough();
  bufferStream.end(buffer);

  const requestBody = {
    name: fileName,
    mimeType: fileObject.mimetype,
  };

  if (folderId) {
    requestBody.parents = [folderId];
  }

  const response = await drive.files.create({
    requestBody,
    media: {
      mimeType: fileObject.mimetype,
      body: bufferStream,
    },
    fields: 'id, name, webViewLink',
    supportsAllDrives: true, // wajib untuk Shared Drive
  });

  return response.data;
}

/**
 * Mengambil daftar foto dari folder Google Drive
 */
async function getPhotosFromFolder(folderId = DRIVE_FOLDER_ID) {
  if (!folderId) {
    throw new Error('DRIVE_FOLDER_ID belum diset');
  }

  try {
    const safeId = String(folderId).replace(/'/g, "\\'");
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

module.exports = {
  drive,
  defaultFolderId: DRIVE_FOLDER_ID,
  uploadPhotoToDrive,
  getPhotosFromFolder,
};