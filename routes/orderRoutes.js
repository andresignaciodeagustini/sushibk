const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// Obtener todos los pedidos
router.get('/', async (req, res) => {
    try {
        console.log('Obteniendo pedidos...');
       
        const filter = {};
        
       
        if (req.query.sushiType) {
            filter.sushiType = req.query.sushiType;
        }
        
       
        if (req.query.fecha) {
            const fecha = new Date(req.query.fecha);
            filter.fechaPedido = {
                $gte: new Date(fecha.setHours(0,0,0)),
                $lt: new Date(fecha.setHours(23,59,59))
            };
        }

      
        if (req.query.direccion) {
            filter.direccion = { $regex: req.query.direccion, $options: 'i' };
        }

       
        if (req.query.estado) {
            filter.estado = req.query.estado;
        }

        const orders = await Order.find(filter).sort('-fechaPedido');
        console.log('Pedidos encontrados:', orders);
        
        res.json({
            message: 'Lista de pedidos',
            total: orders.length,
            filtros: filter,
            data: orders
        });
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json({
            message: 'Pedido encontrado',
            data: order
        });
    } catch (error) {
        console.error('Error al obtener el pedido:', error);
        res.status(500).json({ error: 'Error al obtener el pedido' });
    }
});


router.patch('/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { estado },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json({
            message: 'Estado del pedido actualizado',
            data: order
        });
    } catch (error) {
        console.error('Error al actualizar el estado del pedido:', error);
        res.status(500).json({ error: 'Error al actualizar el estado del pedido' });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json({
            message: 'Pedido eliminado exitosamente',
            data: order
        });
    } catch (error) {
        console.error('Error al eliminar el pedido:', error);
        res.status(500).json({ error: 'Error al eliminar el pedido' });
    }
});

module.exports = router;