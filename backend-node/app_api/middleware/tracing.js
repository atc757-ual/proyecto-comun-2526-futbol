const { v4: uuidv4 } = require('uuid');

/**
 * Middleware de Tracing Correlacionado
 * Captura el X-Transaction-Id del Gateway o genera uno nuevo.
 */
const tracingMiddleware = (req, res, next) => {
    const transactionId = req.headers['x-transaction-id'] || uuidv4();
    
    // Lo guardamos en el objeto request para uso posterior
    req.transactionId = transactionId;
    const originalLog = console.log;
    originalLog(`[TRACING] Incoming: ${req.method} ${req.url} | ID: ${transactionId}`);
    
    // Lo añadimos a la respuesta para trazabilidad desde el cliente
    res.setHeader('X-Transaction-Id', transactionId);

    // Sobrescribimos temporalmente el console.log para este flujo (Opcional, pero útil para el ejemplo)
    // Nota: En producción usaríamos un logger como Winston o Bunyan con AsyncLocalStorage
    console.log = (...args) => {
        originalLog(`[NODE] [${transactionId}]`, ...args);
    };

    // Restauramos el log original al terminar la petición
    res.on('finish', () => {
        console.log = originalLog;
    });

    next();
};

module.exports = tracingMiddleware;
