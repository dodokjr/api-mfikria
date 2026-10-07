const { google } = require('googleapis');
const stream = require('stream');
require('dotenv').config();

// Membaca kredensial langsung dari Environment Variable (.env)
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// Konfigurasi Google Auth menggunakan kredensial dari .env
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });
const FOLDER_ID = process.env.FOLDER_ID;

// 1. Controller untuk Upload File (Gambar, MP3, MP4, atau JSON)
const uploadFile = async (req, res) => {
    try {
        const file = req.file;
        const { customName, jsonData } = req.body;

        if (!file && !jsonData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Harap unggah file (gambar/mp3/mp4) atau sertakan data JSON!' 
            });
        }

        let bufferStream = new stream.PassThrough();
        let fileName = '';
        let mimeType = '';

        if (file) {
            bufferStream.end(file.buffer);
            fileName = customName ? `${customName}-${file.originalname}` : file.originalname;
            mimeType = file.mimetype;
        } else {
            const jsonString = JSON.stringify(typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData, null, 2);
            bufferStream.end(jsonString);
            fileName = (customName || 'data') + '.json';
            mimeType = 'application/json';
        }

        const fileMetadata = {
            name: fileName,
            parents: [FOLDER_ID],
        };

        const media = {
            mimeType: mimeType,
            body: bufferStream,
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name, mimeType, webViewLink, webContentLink, createdTime',
        });

        res.status(200).json({
            success: true,
            message: 'File berhasil diunggah ke Google Drive!',
            data: {
                id: response.data.id,
                name: response.data.name,
                mimeType: response.data.mimeType,
                viewUrl: response.data.webViewLink,
                downloadUrl: response.data.webContentLink,
                createdTime: response.data.createdTime
            }
        });

    } catch (error) {
        console.error('Error saat upload:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Controller untuk Mengambil Daftar Semua File
const getAllFiles = async (req, res) => {
    try {
        const response = await drive.files.list({
            q: `'${FOLDER_ID}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
            orderBy: 'createdTime desc'
        });

        res.status(200).json({
            success: true,
            totalFiles: response.data.files.length,
            files: response.data.files
        });
    } catch (error) {
        console.error('Error mengambil daftar file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Controller untuk Mengambil Detail File Tertentu
const getFileDetail = async (req, res) => {
    try {
        const fileId = req.params.nameOrId;

        const meta = await drive.files.get({ 
            fileId: fileId, 
            fields: 'id, name, mimeType, webViewLink, webContentLink' 
        });

        res.status(200).json({
            success: true,
            fileInfo: meta.data,
            message: "Gunakan link 'viewUrl' untuk melihat atau 'downloadUrl' untuk mengunduh file media ini."
        });

    } catch (error) {
        console.error('Error membaca file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    uploadFile,
    getAllFiles,
    getFileDetail
};