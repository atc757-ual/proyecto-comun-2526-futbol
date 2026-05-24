const axios = require('axios');
const newsService = require('../services/news.service');
const { formatToCorbaDate, getHeaders, findAll, bulkCreate } = newsService;

jest.mock('axios');

function mockReq({ role = 'user', query = {}, headers = {} } = {}) {
    return { user: { role }, headers: { authorization: 'Bearer token', ...headers }, query };
}

describe('News Service - formatToCorbaDate', () => {
    test('converts YYYY-MM-DD to DD/MM/YYYY', () => {
        expect(formatToCorbaDate('2023-07-15T00:00:00Z')).toBe('15/07/2023');
    });
    test('keeps DD/MM/YYYY unchanged', () => {
        expect(formatToCorbaDate('15/07/2023')).toBe('15/07/2023');
    });
    test('returns null for falsy input', () => {
        expect(formatToCorbaDate(null)).toBeNull();
    });
    test('returns original when format is unrecognised', () => {
        expect(formatToCorbaDate('20230715')).toBe('20230715');
    });
});

describe('News Service - getHeaders', () => {
    test('uses user role from req.user', () => {
        const headers = getHeaders(mockReq({ role: 'admin' }));
        expect(headers['X-User-Role']).toBe('ADMIN');
    });
    test('falls back to x-user-role header', () => {
        const headers = getHeaders({ headers: { authorization: 'Bearer abc', 'x-user-role': 'editor' } });
        expect(headers['X-User-Role']).toBe('EDITOR');
    });
    test('defaults to USER when no role info available', () => {
        const headers = getHeaders({ headers: { authorization: 'Bearer abc' } });
        expect(headers['X-User-Role']).toBe('USER');
    });
});

describe('News Service - CRUD', () => {
    beforeEach(() => jest.clearAllMocks());

    test('findAll devuelve feed para usuario normal', async () => {
        const req = mockReq();
        axios.get.mockResolvedValueOnce({ data: { data: ['n1', 'n2'], pagination: null } });
        const result = await newsService.findAll(req);
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/feed'), expect.any(Object));
        expect(result).toEqual({ data: ['n1', 'n2'], pagination: null });
    });

    test('findAll devuelve todo cuando admin solicita all=true', async () => {
        const req = mockReq({ role: 'admin', query: { all: 'true' } });
        axios.get.mockResolvedValueOnce({ data: { data: ['a1', 'a2'], pagination: null } });
        const result = await newsService.findAll(req);
        expect(axios.get).toHaveBeenCalledWith(expect.not.stringContaining('/feed'), expect.any(Object));
        expect(result).toEqual({ data: ['a1', 'a2'], pagination: null });
    });

    test('findAll reenvía parámetros de paginación', async () => {
        const req = mockReq({ query: { page: '2', limit: '5' } });
        const pag = { page: 2, limit: 5, total: 20, totalPages: 4 };
        axios.get.mockResolvedValueOnce({ data: { data: ['n1'], pagination: pag } });
        const result = await newsService.findAll(req);
        const callArgs = axios.get.mock.calls[0][1];
        expect(callArgs.params).toEqual({ page: '2', limit: '5' });
        expect(result.pagination).toEqual(pag);
    });

    test('findOne recupera la noticia indicada', async () => {
        axios.get.mockResolvedValueOnce({ data: { data: { id: 5, title: 'T' } } });
        const result = await newsService.findOne(5, mockReq());
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/5'), expect.any(Object));
        expect(result).toMatchObject({ id: 5, title: 'T' });
    });

    test('create arma el payload y devuelve respuesta del Bridge', async () => {
        const news = { title: 'Nuevo', content: 'Contenido' };
        axios.post.mockResolvedValueOnce({ data: { data: { id: 'new-1', ...news } } });
        const result = await newsService.create(news, mockReq());
        const payload = axios.post.mock.calls[0][1];
        expect(payload.title).toBe('Nuevo');
        expect(result).toMatchObject({ title: 'Nuevo' });
    });

    test('update envía PUT y devuelve datos actualizados', async () => {
        axios.put.mockResolvedValueOnce({ data: { data: { id: 'u1', title: 'Editado' } } });
        const result = await newsService.update('u1', { title: 'Editado' }, mockReq());
        expect(axios.put).toHaveBeenCalled();
        expect(result).toMatchObject({ id: 'u1', title: 'Editado' });
    });

    test('remove llama al DELETE del endpoint', async () => {
        axios.delete.mockResolvedValueOnce({});
        await newsService.remove('del1', mockReq());
        expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/del1'), expect.any(Object));
    });
});

describe('News Service - bulkCreate', () => {
    beforeEach(() => jest.clearAllMocks());

    test('procesa lista válida y devuelve respuesta del Bridge', async () => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });
        const result = await bulkCreate([{ title: 'T1' }, { title: 'T2' }], mockReq());
        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/bulk'), expect.any(Array), expect.any(Object));
        expect(result).toEqual({ success: true });
    });

    test('lanza error cuando el argumento no es un array', async () => {
        await expect(bulkCreate(null, mockReq())).rejects.toThrow('El formato de las noticias no es válido');
    });

    test('propaga error del Bridge con status HTTP', async () => {
        const err = new Error('Bridge error');
        err.response = { status: 400, data: { message: 'Bad request' } };
        axios.post.mockRejectedValueOnce(err);
        await expect(bulkCreate([{ title: 'X' }], mockReq())).rejects.toThrow('Error en el Bridge CORBA: Bad request');
    });

    test('propaga error de red cuando no hay respuesta', async () => {
        const err = new Error('Network down');
        err.request = {};
        axios.post.mockRejectedValueOnce(err);
        await expect(bulkCreate([{ title: 'Y' }], mockReq())).rejects.toThrow('El servidor de noticias (Bridge) no responde');
    });
});
