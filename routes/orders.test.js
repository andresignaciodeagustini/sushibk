// routes/orders.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mockOrder = {
    find: jest.fn(() => ({
        sort: jest.fn().mockResolvedValue([])
    })),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn()
};


jest.mock('../models/order', () => mockOrder);


const orderRoutes = require('./orderRoutes');

const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);

describe('Orders API', () => {
    beforeEach(() => {
        
        jest.clearAllMocks();
    });

    describe('GET /api/orders', () => {
        test('debe retornar una lista vacía inicialmente', async () => {
            
            mockOrder.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            });

            const response = await request(app).get('/api/orders');
            
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(0);
            expect(mockOrder.find).toHaveBeenCalled();
        });

        test('debe filtrar por tipo de sushi', async () => {
            const mockData = [{
                sushiType: 'California Roll',
                cantidad: 2,
                direccion: 'Calle 123'
            }];
            
            mockOrder.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockData)
            });

            const response = await request(app)
                .get('/api/orders')
                .query({ sushiType: 'California Roll' });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].sushiType).toBe('California Roll');
        });
    });

    describe('GET /api/orders/:id', () => {
        test('debe retornar un pedido por ID', async () => {
            const mockPedido = {
                _id: new mongoose.Types.ObjectId(),
                sushiType: 'California Roll',
                cantidad: 2,
                direccion: 'Calle 123'
            };

            mockOrder.findById.mockResolvedValue(mockPedido);

            const response = await request(app)
                .get(`/api/orders/${mockPedido._id}`);

            expect(response.status).toBe(200);
            expect(response.body.data.sushiType).toBe('California Roll');
        });

        test('debe retornar 404 para ID inexistente', async () => {
            mockOrder.findById.mockResolvedValue(null);

            const response = await request(app)
                .get(`/api/orders/${new mongoose.Types.ObjectId()}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /api/orders/:id/estado', () => {
        test('debe actualizar el estado de un pedido', async () => {
            const mockPedido = {
                _id: new mongoose.Types.ObjectId(),
                sushiType: 'California Roll',
                estado: 'completado'
            };

            mockOrder.findByIdAndUpdate.mockResolvedValue(mockPedido);

            const response = await request(app)
                .patch(`/api/orders/${mockPedido._id}/estado`)
                .send({ estado: 'completado' });

            expect(response.status).toBe(200);
            expect(response.body.data.estado).toBe('completado');
        });
    });

    describe('DELETE /api/orders/:id', () => {
        test('debe eliminar un pedido existente', async () => {
            const mockPedido = {
                _id: new mongoose.Types.ObjectId(),
                sushiType: 'California Roll',
                cantidad: 2
            };

            mockOrder.findByIdAndDelete.mockResolvedValue(mockPedido);

            const response = await request(app)
                .delete(`/api/orders/${mockPedido._id}`);

            expect(response.status).toBe(200);
            expect(mockOrder.findByIdAndDelete).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('debe manejar errores de MongoDB correctamente', async () => {
           
            mockOrder.find.mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Error de base de datos'))
            });

            const response = await request(app).get('/api/orders');
            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Error al obtener pedidos');
        });
    });
});