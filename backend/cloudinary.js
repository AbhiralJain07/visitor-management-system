const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Cloudinary configure karo
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer — memory mein photo rakho
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Photo upload karo Cloudinary pe
const uploadPhoto = (buffer) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder: 'vms-visitors' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        ).end(buffer);
    });
};

module.exports = { upload, uploadPhoto };