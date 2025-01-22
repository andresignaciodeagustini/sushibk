const crypto = require('crypto');
const fs = require('fs');

// Asegúrate de cambiar esta contraseña y guardarla de forma segura
const password = 'Micontraseñasecreta611';

try {
    
    const credentials = fs.readFileSync('credentials.json', 'utf8');
    
   
    const cipher = crypto.createCipher('aes-256-cbc', password);
    
    
    let encrypted = cipher.update(credentials, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    
    fs.writeFileSync('credentials.enc', encrypted);
    
    console.log('Archivo encriptado exitosamente como credentials.enc');
    console.log('Guarda esta contraseña de forma segura:', password);
} catch (error) {
    console.error('Error al encriptar:', error);
}