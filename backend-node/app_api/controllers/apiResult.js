// Helper para estandarizar las respuestas estilo ApiResult de Java
const sendApiResult = (res, code, detail, data = null) => {
    res.status(parseInt(code)).json({
        result: {
            transactionId: new Date().getTime().toString(), // Simulado
            code: code.toString(),
            description: parseInt(code) < 400 ? "OK" : "NOK",
            descriptionDetail: detail,
            responseTimestamp: new Date().toISOString()
        },
        data: data
    });
};

module.exports = { sendApiResult };
