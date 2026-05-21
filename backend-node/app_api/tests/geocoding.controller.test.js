const axios = require('axios');

const mockSendApiResult = jest.fn();

jest.mock('axios');
jest.mock('../controllers/apiResult', () => ({ sendApiResult: mockSendApiResult }));

const { reverseGeocode } = require('../controllers/geocoding');

describe('Geocoding controller (unit)', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {} };
    res = {};
  });

  test('returns 400 when lat/lng are missing', async () => {
    await reverseGeocode(req, res);

    expect(mockSendApiResult).toHaveBeenCalledWith(
      res,
      400,
      expect.stringContaining('lat o lng')
    );
  });

  test('returns 200 with parsed address when provider responds with address fields', async () => {
    req.query = { lat: '40.4168', lng: '-3.7038' };

    axios.get.mockResolvedValue({
      data: {
        display_name: 'Gran Via, 1, 28013, Madrid, Espana',
        address: {
          road: 'Gran Via',
          house_number: '1',
          postcode: '28013',
          state: 'Madrid'
        }
      }
    });

    await reverseGeocode(req, res);

    expect(mockSendApiResult).toHaveBeenCalledWith(
      res,
      200,
      expect.any(String),
      expect.objectContaining({ displayAddress: 'Gran Via, 1, 28013, Madrid' })
    );
  });

  test('falls back to display_name slices when address fields are empty', async () => {
    req.query = { lat: '10', lng: '20' };

    axios.get.mockResolvedValue({
      data: {
        display_name: 'Linea 1, Linea 2, Linea 3, Linea 4',
        address: {}
      }
    });

    await reverseGeocode(req, res);

    expect(mockSendApiResult).toHaveBeenCalledWith(
      res,
      200,
      expect.any(String),
      expect.objectContaining({
        displayAddress: expect.stringContaining('Linea 1')
      })
    );
  });

  test('returns 404 when provider has no display_name', async () => {
    req.query = { lat: '10', lng: '20' };
    axios.get.mockResolvedValue({ data: {} });

    await reverseGeocode(req, res);

    expect(mockSendApiResult).toHaveBeenCalledWith(
      res,
      404,
      expect.stringContaining('coordenadas')
    );
  });

  test('returns 500 when provider fails', async () => {
    req.query = { lat: '10', lng: '20' };
    axios.get.mockRejectedValue(new Error('network down'));

    await reverseGeocode(req, res);

    expect(mockSendApiResult).toHaveBeenCalledWith(res, 500, 'Error al consultar el servicio de geocoding externo');
  });
});