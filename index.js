require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fulfillmentRoutes = require('./routes/fulfillmentRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Configuración de credenciales desde variable de entorno
let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = JSON.stringify(credentials);
  console.log('Credenciales cargadas correctamente desde variables de entorno');
} catch (error) {
  console.error('Error al cargar las credenciales:', error.message);
  process.exit(1);
}

process.env.DIALOGFLOW_PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID || 'sushi-y9bc';

console.log('Configuración de Dialogflow:', {
  projectId: process.env.DIALOGFLOW_PROJECT_ID,
  credentialsLoaded: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
});

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/webhook', fulfillmentRoutes);
app.use('/orders', orderRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando',
    dialogflowConfigured: !!process.env.DIALOGFLOW_PROJECT_ID,
    environment: {
      projectId: process.env.DIALOGFLOW_PROJECT_ID,
      credentialsLoaded: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON no está configurado');
    }
    if (!process.env.DIALOGFLOW_PROJECT_ID) {
      throw new Error('DIALOGFLOW_PROJECT_ID no está configurado');
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log("La conexión a la db fue exitosa");

    app.listen(PORT, '0.0.0.0', () => {
      console.log('=================================');
      console.log(`Servidor escuchando en el puerto ${PORT}`);
      console.log(`URL base: ${process.env.NGROK_URL}`);
      console.log(`Dialogflow Project ID: ${process.env.DIALOGFLOW_PROJECT_ID}`);
      console.log('Credenciales cargadas: Sí');
      console.log('=================================');
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

startServer();

process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
  process.exit(1);
});