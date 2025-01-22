const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    sushiType: {
        type: String,
        required: true
    },
    cantidad: {
        type: Number,
        required: true
    },
    direccion: {
        type: String,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'confirmado', 'en_preparacion', 'enviado', 'entregado'],
        default: 'confirmado'
    },
    fechaPedido: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);