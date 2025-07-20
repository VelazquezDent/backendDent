const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csrf = require('csurf'); // Importar csurf
const alexaRoutes = require('./routes/alexaRoutes');
// Importar las rutas de los diferentes módulos
const usuarioRoutes = require('./routes/usuarioRoutes');
const tratamientoRoutes = require('./routes/tratamientoRoutes');
const citaRoutes = require('./routes/citaRoutes');
const tratamientoPacienteRoutes = require('./routes/tratamientoPacienteRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const historialRoutes = require('./routes/historialRoutes');
const pacienteSinPlataformaRoutes = require('./routes/pacienteSinPlataformaRoutes');
const misionVisionRoutes = require('./routes/misionVisionRoutes');
const politicaRoutes = require('./routes/politicaRoutes');
const valorRoutes = require('./routes/valorRoutes');
const quienesSomosRoutes = require('./routes/quienesSomosRoutes');
const valoresRoutes = require('./routes/valoresRoutes'); // Importar las rutas de valores
const ConfiguracionesRoutes = require('./routes/configuracionesRoutes'); // Importar las rutas de configuraciones

const app = express();
const port = 4000;

// Middleware para parsear JSON y cookies
app.use(express.json());
app.use(cookieParser());

// Configuración de CORS
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://consultoriovelazquezmcd.com', 'https://developer.amazon.com'], // Permite peticiones desde estas URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN'],
  })
);

// Configuración del middleware CSRF (usa cookies)
const csrfProtection = csrf({
  cookie: {
    httpOnly: false,  // Permitir acceso desde frontend
    secure: true,     // true en producción HTTPS
    sameSite: 'None', // Necesario para dominios cruzados
    path: '/',
  }
});

// ✅ Lista de rutas excluidas de CSRF (por ejemplo: llamadas desde Alexa)
const csrfExcludedRoutes = [
  '/api/citas/por-fecha',
  '/api/alexa/proximas-citas',
  '/api/alexa/login'      // Excluye el login de CSRF // ✅ Esta ruta nueva
];
// ✅ Middleware para aplicar CSRF condicionalmente
app.use((req, res, next) => {
  if (csrfExcludedRoutes.includes(req.path)) {
    return next(); // No aplicar CSRF
  } else {
    return csrfProtection(req, res, next); // Aplicar CSRF normalmente
  }
});

// ✅ Ruta pública para obtener el token CSRF
app.get('/api/get-csrf-token', (req, res) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false,
    secure: true,
    sameSite: 'None',
    path: '/',
  });
  res.json({ csrfToken: req.csrfToken() });
});

// ✅ Rutas protegidas (excepto las excluidas)
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/tratamientos', tratamientoRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/tratamientos-pacientes', tratamientoPacienteRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/pacientes-sin-plataforma', pacienteSinPlataformaRoutes);
app.use('/api/mision-vision', misionVisionRoutes);
app.use('/api/politicas', politicaRoutes);
app.use('/api/valores', valorRoutes);
app.use('/api/quienes-somos', quienesSomosRoutes);
app.use('/api/alexa', alexaRoutes);
app.use('/api/valores', valoresRoutes); // Usar las rutas de valores
app.use('/api/configuraciones', ConfiguracionesRoutes); // Usar las rutas de configuraciones


// 🔐 Manejo de errores CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Fallo en la validación del CSRF token' });
  }
  console.error('Error:', err.stack);
  res.status(500).send('¡Algo salió mal en el servidor!');
});

// 🚀 Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
