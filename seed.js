require('dotenv').config();
const mongoose = require('mongoose');
const Demand = require('./models/demand');
const Order = require('./models/order');

const sampleDemands = [
    {
        product: 'California Roll',
        counter: 0
    },
    {
        product: 'Philadelphia Roll',
        counter: 0
    },
    {
        product: 'Sake Roll',
        counter: 0
    },
    {
        product: 'Hot Roll',
        counter: 0
    },
    {
        product: 'Crunchy Roll',
        counter: 0
    },
    {
        product: 'Veggie Roll',
        counter: 0
    },
    {
        product: 'Cucumber Roll',
        counter: 0
    }
];

const sampleOrders = [
    {
        sushiType: 'California Roll',
        cantidad: 2,
        direccion: 'Av. Ejemplo 123',
        total: 1600,
        fechaPedido: new Date()
    },
    {
        sushiType: 'Philadelphia Roll',
        cantidad: 1,
        direccion: 'Calle Muestra 456',
        total: 900,
        fechaPedido: new Date()
    },
    {
        sushiType: 'Hot Roll',
        cantidad: 3,
        direccion: 'Plaza Principal 789',
        total: 2850,
        fechaPedido: new Date()
    }
];

async function seedDatabase() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Conectado a MongoDB');

        // Limpiar colecciones existentes
        await Demand.deleteMany({});
        await Order.deleteMany({});
        console.log('Colecciones limpiadas');

        // Insertar datos de ejemplo
        await Demand.insertMany(sampleDemands);
        console.log('Demands insertadas');

        await Order.insertMany(sampleOrders);
        console.log('Orders insertadas');

        console.log('Base de datos poblada exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('Error al poblar la base de datos:', error);
        process.exit(1);
    }
}

// Ejecutar el seed
seedDatabase();