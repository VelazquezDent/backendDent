const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// URL del endpoint en Hostinger
const UPLOAD_URL = 'https://consultoriovelazquezmcd.com/upload_image.php';

// Clave API para autenticar la solicitud
const API_KEY = process.env.UPLOAD_API_KEY;

// Función para subir imágenes al servidor remoto
const subirImagen = async (imagePath) => {
  const formData = new FormData();
  formData.append('image', require('fs').createReadStream(imagePath));

  try {
    const response = await axios.post(UPLOAD_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${API_KEY}`,
      },
    });
    return response.data.url;
  } catch (error) {
    console.error('Error al subir la imagen:', error.response?.data || error.message);
    throw new Error('No se pudo subir la imagen.');
  }
};

module.exports = { subirImagen };
