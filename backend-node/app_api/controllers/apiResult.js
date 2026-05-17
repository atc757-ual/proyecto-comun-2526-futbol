// Helper para estandarizar las respuestas estilo ApiResult de Java
const crypto = require('crypto');

const sendApiResult = (res, code, detail, data = null) => {
    const finalDetail = parseInt(code) === 200 ? "Procesamiento concluído exitosamente" : detail;
    res.status(parseInt(code)).json({
        result: {
            transactionId: crypto.randomUUID(),
            code: code.toString(),
            description: parseInt(code) < 400 ? "OK" : "NOK",
            descriptionDetail: finalDetail,
            responseTimestamp: new Date().toISOString()
        },
        data: data
    });
};

module.exports = { sendApiResult };
