require('dotenv').config();

const baseURL = process.env.NODE_ENV === 'development' 
  ? `http://localhost:${process.env.PORT}`
  : process.env.NGROK_URL;

module.exports = { baseURL };