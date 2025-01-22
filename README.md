@"
# Sushi Bot Backend 🍱

Servidor backend para el chatbot de pedidos de sushi utilizando Dialogflow y Node.js.

## Instalación

1. Clonar el repositorio
\`\`\`bash
git clone https://github.com/andresignaciodeagustini/sushi-backend.git
cd sushi-backend
\`\`\`

2. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

3. Configurar variables de entorno
\`\`\`bash
cp .env.example .env
# Editar .env con tus valores:
# GOOGLE_APPLICATION_CREDENTIALS=./credentials/your-credentials-file.json
# MONGO_URL=your_mongodb_url
# PORT=5000
# DIALOGFLOW_PROJECT_ID=your_project_id
\`\`\`

4. Configurar Dialogflow
- Crear proyecto en Google Cloud Console
- Habilitar API de Dialogflow
- Crear service account y descargar credenciales
- Colocar archivo de credenciales en /credentials

5. Iniciar el servidor
\`\`\`bash
npm run backend
\`\`\`

## Intents y Comandos

### 🍣 BuscarSushi (Consulta de Menú)
Frases de entrenamiento:
- "¿Hay [tipo de roll] disponible?"
- "Precio del [tipo de roll]"
- "¿Cuánto cuesta el [tipo de roll]?"
- "¿Tienen [tipo de roll]?"
- "Menú por favor"
- "Ver carta"
- "Mostrar menú"
- "¿Qué tipos de sushi tienen?"

Productos disponibles:
- California Roll
- Philadelphia Roll
- Sake Roll
- Hot Roll
- Crunchy Roll
- Veggie Roll
- Cucumber Roll

### 🛵 ConsultaDelivery
- "¿Hacen delivery?"
- "¿Hacen envíos?"
- "¿Cuánto tarda el delivery?"
- "¿Llevan a domicilio?"
- "¿Hasta dónde hacen entregas?"
- "¿El delivery es gratis?"
- "¿Cuánto cuesta el envío?"
- "¿Tienen envío a domicilio?"

### 🕒 ConsultaHorario
- "Horarios de atención"
- "¿Están abiertos ahora?"
- "¿Trabajan los domingos?"
- "¿Qué días atienden?"
- "¿Cuál es su horario?"
- "¿A qué hora abren?"
- "¿A qué hora cierran?"
- "¿Hasta qué hora atienden?"
- "¿Están trabajando hoy?"

### 💳 ConsultaMediosPago
- "Formas de pago"
- "¿Trabajan con tarjetas de crédito?"
- "¿Aceptan débito?"
- "¿Puedo transferir?"
- "¿Tienen Mercado Pago?"
- "¿Aceptan efectivo?"
- "¿Puedo pagar con tarjeta?"
- "¿Qué medios de pago aceptan?"

### 📦 HacerPedido
- "Ordenar sushi"
- "Hacer un pedido"
- "Quiero hacer un pedido"
- "Realizar un pedido"
- "Quiero pedir sushi"

### 🏠 MenuPrincipal
- "Volver al inicio"
- "Necesito ayuda"
- "¿Cómo funciona?"
- "Ayuda"
- "Opciones"
- "Inicio"
- "Página principal"
- "Menú principal"

## Endpoints

### Webhook
- POST /webhook
  - Maneja las interacciones con Dialogflow
  - Procesa los intents y devuelve respuestas apropiadas

### Órdenes
- GET /orders
  - Lista todos los pedidos realizados
  - Ordenados por fecha de creación
- POST /orders
  - Crea un nuevo pedido
  - Requiere: tipo de sushi, cantidad, dirección

### Estadísticas
- GET /stats
  - Muestra estadísticas de uso
  - Conteo de pedidos por tipo de sushi
  - Métricas de interacción

## Tecnologías Utilizadas
- Node.js
- Express
- MongoDB
- Dialogflow
- Google Cloud Platform

## Scripts
- \`npm run backend\`: Inicia el servidor
- \`npm run dev\`: Inicia el servidor en modo desarrollo
"@ | Out-File -FilePath README.md -Encoding UTF8

Tests 🧪
Cómo ejecutar los tests
BASH

# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ver cobertura de código
npm run test:coverage
Cobertura de tests
Los tests cubren las siguientes funcionalidades:

Rutas de Pedidos (Orders)
GET /api/orders

✅ Obtención de lista vacía
✅ Filtrado por tipo de sushi
✅ Filtrado por fecha
✅ Filtrado por dirección
✅ Filtrado por estado
GET /api/orders/:id

✅ Obtención de pedido específico
✅ Manejo de ID inexistente
PATCH /api/orders/:id/estado

✅ Actualización de estado
✅ Validación de pedido inexistente
DELETE /api/orders/:id

✅ Eliminación de pedido
✅ Validación de pedido inexistente
Manejo de Errores 🚨
Los tests verifican el correcto manejo de los siguientes errores:

Errores de Base de Datos

Fallos en conexión
Errores en consultas
Timeouts
Errores de Validación

IDs inválidos
Datos faltantes
Formatos incorrectos
Errores de Negocio

Pedidos no encontrados
Estados inválidos
Operaciones no permitidas
Configuración de Tests
Los tests utilizan:

Jest como framework de testing
Supertest para pruebas de API
Mocks para simular la base de datos
Variables de entorno específicas para testing (.env.test)