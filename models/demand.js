// models/demand.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const demandSchema = new Schema({
    product: {
        type: String,
        required: true
    },
    counter: {
        type: Number,
        default: 1
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Demand', demandSchema);