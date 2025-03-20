const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csrf = require('csurf'); // Importar csurf

const usuarioRoutes = require('./routes/usuarioRoutes');
const tratamientoRoutes = require('./routes/tratamientoRoutes');
const citaRoutes = require('./routes/citaRoutes');
const tratamientoPacienteRoutes = require('./routes/tratamientoPacienteRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const historialRoutes = require('./routes/historialRoutes');
const pacienteSinPlataformaRoutes = require('./routes/pacienteSinPlataformaRoutes');

const app = express();
const port = 4000;

// Middleware para parsear JSON y cookies
app.use(express.json());
app.use(cookieParser());

// Configuración de CORS
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://consultoriovelazquezmcd.com'], // Permite peticiones desde estas URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    credentials: true, // Permitir el envío de cookies y encabezados de autenticación
    allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN'], // Incluir CSRF en los headers
  })
);

// Configuración de CSRF usando cookies
const csrfProtection = csrf({
  cookie: {
    httpOnly: false, // Permitir que el frontend pueda acceder a la cookie
    secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
    sameSite: 'None', // Permitir envío de cookies cross-origin
    path: '/', // Disponible en todas las rutas
  }
});
app.use(csrfProtection); // Aplicar protección CSRF


app.get('/api/get-csrf-token', (req, res) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false, // Permitir acceso desde el frontend
    secure: process.env.NODE_ENV === "production", 
    sameSite: 'None',
    path: '/',
  });
  res.json({ csrfToken: req.csrfToken() });
});


// Rutas protegidas con CSRF
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/tratamientos', tratamientoRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/tratamientos-pacientes', tratamientoPacienteRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/pacientes-sin-plataforma', pacienteSinPlataformaRoutes);

// Manejo de errores CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {  
    return res.status(403).json({ message: 'Fallo en la validación del CSRF token' });
  }
  console.error('Error:', err.stack);
  res.status(500).send('¡Algo salió mal en el servidor!');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
