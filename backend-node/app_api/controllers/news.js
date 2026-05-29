const crypto = require('node:crypto');
const newsService = require('../services/news.service');
const { sendApiResult } = require('./apiResult');

const getNews = async (req, res) => {
    try {
        const { data, pagination } = await newsService.findAll(req);
        const body = {
            result: {
                transactionId: crypto.randomUUID(),
                code: '200',
                description: 'OK',
                descriptionDetail: 'Procesamiento concluído exitosamente',
                responseTimestamp: new Date().toISOString()
            },
            data
        };
        if (pagination) body.pagination = pagination;
        res.status(200).json(body);
    } catch (error) {
        sendApiResult(res, 500, "Error en Bridge CORBA: " + error.message);
    }
};

const getFeaturedNews = async (req, res) => {
    try {
        const { data } = await newsService.findFeatured(req);
        sendApiResult(res, 200, "Procesamiento concluído exitosamente", data);
    } catch (error) {
        sendApiResult(res, 500, "Error en Bridge CORBA: " + error.message);
    }
};

const getNewsById = async (req, res) => {
    try {
        const data = await newsService.findOne(req.params.id, req);
        sendApiResult(res, 200, "Procesamiento concluído exitosamente", data);
    } catch (error) {
        sendApiResult(res, 404, "Noticia no encontrada en CORBA");
    }
};

const createNews = async (req, res) => {
    try {
        const data = await newsService.create(req.body, req);
        sendApiResult(res, 201, "Noticia creada en CORBA", data);
    } catch (error) {
        sendApiResult(res, 500, "Error al crear noticia en CORBA: " + error.message);
    }
};

const updateNews = async (req, res) => {
    try {
        const data = await newsService.update(req.params.id, req.body, req);
        sendApiResult(res, 200, "Procesamiento concluído exitosamente", data);
    } catch (error) {
        sendApiResult(res, 500, "Error al actualizar noticia en CORBA: " + error.message);
    }
};

const deleteNews = async (req, res) => {
    try {
        await newsService.remove(req.params.id, req);
        res.status(204).send();
    } catch (error) {
        sendApiResult(res, 500, "Error al eliminar noticia en CORBA: " + error.message);
    }
};

const bulkCreateNews = async (req, res) => {
    try {
        const data = await newsService.bulkCreate(req.body, req);
        sendApiResult(res, 201, "Carga masiva completada en CORBA", data);
    } catch (error) {
        sendApiResult(res, 500, "Error en carga masiva CORBA: " + error.message);
    }
};

module.exports = {
    getNews,
    getFeaturedNews,
    getNewsById,
    createNews,
    updateNews,
    bulkCreateNews,
    deleteNews
};
