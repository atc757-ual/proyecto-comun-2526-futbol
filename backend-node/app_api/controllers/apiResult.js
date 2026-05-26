// Helper para estandarizar las respuestas estilo ApiResult de Java
const crypto = require('node:crypto');

const sendApiResult = (res, code, detail, data = null) => {
    const finalDetail = Number.parseInt(code) === 200 ? "Procesamiento concluído exitosamente" : detail;
    res.status(Number.parseInt(code)).json({
        result: {
            transactionId: crypto.randomUUID(),
            code: code.toString(),
            description: Number.parseInt(code) < 400 ? "OK" : "NOK",
            descriptionDetail: finalDetail,
            responseTimestamp: new Date().toISOString()
        },
        data: data
    });
};

module.exports = { sendApiResult };
