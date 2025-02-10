const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const usuarioRoutes = require('./routes/usuarioRoutes');
const tratamientoRoutes = require('./routes/tratamientoRoutes');
const citaRoutes = require('./routes/citaRoutes');
const tratamientoPacienteRoutes = require('./routes/tratamientoPacienteRoutes');

const app = express();
const port = 4000;

// Middleware para parsear JSON
app.use(express.json());
app.use(cookieParser());

// Configuración de CORS
app.use(
  cors({
    origin: ['http://localhost:5173','https://consultoriovelazquezmcd.com'], // Permite peticiones desde esta URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    credentials: true, // Permitir el envío de cookies y encabezados de autenticación
  })
);

// Rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/tratamientos', tratamientoRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/tratamientos-pacientes', tratamientoPacienteRoutes);
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
