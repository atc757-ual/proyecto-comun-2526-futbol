const { v4: uuidv4 } = require('uuid');

// Guardamos la referencia real fuera del middleware para evitar cadenas de recursión
const realConsoleLog = console.log;

/**
 * Middleware de Tracing Correlacionado
 * Captura el X-Transaction-Id del Gateway o genera uno nuevo.
 */
const tracingMiddleware = (req, res, next) => {
    const transactionId = req.headers['x-transaction-id'] || uuidv4();
    
    // Guardamos el ID en el request
    req.transactionId = transactionId;
    
    // Log de entrada usando la referencia real
    realConsoleLog(`[TRACING] Incoming: ${req.method} ${req.url} | ID: ${transactionId}`);
    
    // Añadimos el ID a la respuesta
    res.setHeader('X-Transaction-Id', transactionId);

    // En lugar de parchear el console.log global (que causa recursión y fallos de concurrencia),
    // exponemos una función de log en el request si se desea usar específicamente.
    req.log = (...args) => {
        realConsoleLog(`[NODE] [${transactionId}]`, ...args);
    };

    next();
};

module.exports = tracingMiddleware;
