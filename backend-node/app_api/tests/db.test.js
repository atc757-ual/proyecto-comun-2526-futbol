describe('Database connection Edge Cases', () => {
    let originalEnv;

    beforeEach(() => {
        originalEnv = process.env.NODE_ENV;
        jest.resetModules();
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
        jest.restoreAllMocks();
    });

    test('connectWithRetry throws immediately in test env when mongoose.connect fails', async () => {
        process.env.NODE_ENV = 'test';
        const mongoose = require('mongoose');
        jest.spyOn(mongoose, 'connect').mockRejectedValueOnce(new Error('Mocked DB Error'));

        const setImmediateSpy = jest.spyOn(global, 'setImmediate').mockImplementation((cb) => {
            try { cb(); } catch (e) { expect(e.message).toBe('Mocked DB Error'); }
        });

        require('../models/db');
        await new Promise(resolve => setTimeout(resolve, 50));
        
        expect(setImmediateSpy).toHaveBeenCalled();
        setImmediateSpy.mockRestore();
    });

    test('connectWithRetry retries in non-test env', async () => {
        process.env.NODE_ENV = 'development';
        process.env.MONGO_CONNECT_MAX_RETRIES = '3';
        process.env.MONGO_CONNECT_RETRY_DELAY_MS = '10';

        const mongoose = require('mongoose');
        jest.spyOn(mongoose, 'connect')
            .mockRejectedValueOnce(new Error('Error 1'))
            .mockRejectedValueOnce(new Error('Error 2'))
            .mockResolvedValueOnce('Connected');

        require('../models/db');
        
        await new Promise(resolve => setTimeout(resolve, 300)); // wait longer for retries
        
        expect(mongoose.connect).toHaveBeenCalledTimes(3);
    });

    test('connectWithRetry gives up after max retries in non-test env', async () => {
        process.env.NODE_ENV = 'development';
        process.env.MONGO_CONNECT_MAX_RETRIES = '1';
        process.env.MONGO_CONNECT_RETRY_DELAY_MS = '10';

        const mongoose = require('mongoose');
        jest.spyOn(mongoose, 'connect').mockRejectedValue(new Error('Persistent Error'));

        require('../models/db');
        
        await new Promise(resolve => setTimeout(resolve, 100)); // wait for retries
        
        expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });

    test('event listeners are registered', () => {
        const mongoose = require('mongoose');
        const onSpy = jest.spyOn(mongoose.connection, 'on');
        
        require('../models/db');
        
        expect(onSpy).toHaveBeenCalledWith('connected', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('error', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('disconnected', expect.any(Function));
        
        // Test event execution
        const connectedCb = onSpy.mock.calls.find(call => call[0] === 'connected')[1];
        const errorCb = onSpy.mock.calls.find(call => call[0] === 'error')[1];
        const disconnectedCb = onSpy.mock.calls.find(call => call[0] === 'disconnected')[1];
        
        expect(() => {
            connectedCb();
            errorCb(new Error('test error'));
            disconnectedCb();
        }).not.toThrow();
    });

    test('process listeners for graceful shutdown are registered', () => {
        const onceSpy = jest.spyOn(process, 'once').mockImplementation(() => {});
        const onSpy = jest.spyOn(process, 'on').mockImplementation(() => {});
        
        require('../models/db');
        
        expect(onceSpy).toHaveBeenCalledWith('SIGUSR2', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });
});
