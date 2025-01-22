require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const fulfillmentRoutes = require('./routes/fulfillmentRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Función para desencriptar y configurar credenciales
function setupCredentials() {
  try {
    console.log('Iniciando proceso de desencriptación de credenciales...');
    
    const encryptedPath = path.join(__dirname, 'credentials.enc');
    const password = process.env.CREDENTIALS_PASSWORD;

    if (!password) {
      throw new Error('CREDENTIALS_PASSWORD no está configurada en las variables de entorno');
    }

    if (!fs.existsSync(encryptedPath)) {
      throw new Error('Archivo de credenciales encriptadas no encontrado');
    }

    // Leer y desencriptar
    const encryptedData = fs.readFileSync(encryptedPath, 'utf8');
    const decipher = crypto.createDecipher('aes-256-cbc', password);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Guardar temporalmente
    const tempPath = path.join(__dirname, 'temp-credentials.json');
    fs.writeFileSync(tempPath, decrypted);
    
    // Configurar variable de entorno
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath;

    console.log('Credenciales desencriptadas y configuradas exitosamente');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error al configurar credenciales:', error);
    throw error;
  }
}

// Configurar credenciales
const credentials = setupCredentials();
process.env.DIALOGFLOW_PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID || 'sushi-y9bc';

console.log('Configuración de Dialogflow:', {
  projectId: process.env.DIALOGFLOW_PROJECT_ID,
  credentialsConfigured: !!credentials
});

const app = express();

// Configuración CORS mejorada
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://sushi2f.onrender.com',
  'https://sushibk.onrender.com'
];
app.use(cors({
  origin: function(origin, callback) {
    // Permitir solicitudes sin origen (como Postman o solicitudes móviles)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('Origen no permitido:', origin);
      callback(null, true); // Permitir todos los orígenes en desarrollo
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware adicional para asegurar headers CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Logging de solicitudes
  console.log('Solicitud recibida:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    headers: req.headers
  });

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Middleware para procesar JSON y datos de formulario
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/webhook', fulfillmentRoutes);
app.use('/orders', orderRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando',
    dialogflowConfigured: !!process.env.DIALOGFLOW_PROJECT_ID,
    environment: {
      projectId: process.env.DIALOGFLOW_PROJECT_ID,
      credentialsConfigured: !!credentials,
      nodeEnv: process.env.NODE_ENV
    }
  });
});
// Middleware mejorado para manejo de errores
app.use((err, req, res, next) => {
  console.error('Error detallado:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

// Función para iniciar el servidor
async function startServer() {
  try {
    // Verificar configuración necesaria
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS no está configurado');
    }
    if (!process.env.DIALOGFLOW_PROJECT_ID) {
      throw new Error('DIALOGFLOW_PROJECT_ID no está configurado');
    }
    if (!credentials) {
      throw new Error('Las credenciales no se configuraron correctamente');
    }

    // Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Conexión a MongoDB establecida exitosamente");

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log('=================================');
      console.log(`Servidor iniciado exitosamente:`);
      console.log(`- Puerto: ${PORT}`);
      console.log(`- URL base: ${process.env.NGROK_URL}`);
      console.log(`- Dialogflow Project ID: ${process.env.DIALOGFLOW_PROJECT_ID}`);
      console.log(`- Credenciales configuradas: ${!!credentials}`);
      console.log(`- Orígenes permitidos: ${allowedOrigins.join(', ')}`);
      console.log(`- Modo: ${process.env.NODE_ENV}`);
      console.log('=================================');
    });

    // Limpiar archivo temporal de credenciales al cerrar
    process.on('SIGINT', () => {
      try {
        const tempPath = path.join(__dirname, 'temp-credentials.json');
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
          console.log('Archivo temporal de credenciales eliminado');
        }
        process.exit(0);
      } catch (error) {
        console.error('Error al limpiar archivos temporales:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error("Error fatal al iniciar el servidor:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

// Manejo mejorado de errores no controlados
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

// Limpieza al cerrar
process.on('exit', () => {
  try {
    const tempPath = path.join(__dirname, 'temp-credentials.json');
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      console.log('Archivo temporal de credenciales eliminado al cerrar');
    }
  } catch (error) {
    console.error('Error al limpiar archivos temporales durante el cierre:', error);
  }
});

module.exports = app;