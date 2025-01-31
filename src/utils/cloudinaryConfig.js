const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'drosfds92',   // Reemplaza con tu nombre de cloud
    api_key: '939861789133495',           // Reemplaza con tu API Key
    api_secret: 'Ep-3joJTT2GzSVOxtOQgtm40yI4',     // Reemplaza con tu API Secret
});

module.exports = cloudinary;
