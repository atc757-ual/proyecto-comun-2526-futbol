// Force non-test environment so the real service chain initializes
process.env.NODE_ENV = 'development';

jest.mock('opossum', () => {
    return jest.fn().mockImplementation((fn) => ({
        fire: jest.fn().mockImplementation((input) => fn(input)),
        fallback: jest.fn(),
        on: jest.fn()
    }));
});

jest.mock('@langchain/google-genai', () => ({ ChatGoogleGenerativeAI: class {} }));
jest.mock('@langchain/core/prompts', () => ({ PromptTemplate: { fromTemplate: jest.fn(() => ({ pipe: jest.fn() })) } }));
jest.mock('@langchain/core/runnables', () => ({ RunnableSequence: { from: jest.fn(() => ({ invoke: jest.fn() })) } }));

const AIService = require('../services/ai.service');

describe('AIService', () => {
    afterAll(() => { process.env.NODE_ENV = 'test'; });
    afterEach(() => jest.clearAllMocks());

    // ── Mock mode (NODE_ENV=test) ────────────────────────────────────────────
    test('returns static mock when isTest is true', async () => {
        const testService = { isTest: true, analyzePlayers: AIService.analyzePlayers.bind({ isTest: true }) };
        const result = await testService.analyzePlayers([]);
        expect(result).toHaveProperty('analysis');
        expect(result).toHaveProperty('idealEleven');
    });

    // ── Real mode: success paths ─────────────────────────────────────────────
    test('parsea respuesta JSON simple del circuit-breaker', async () => {
        AIService.aiBreaker.fire.mockResolvedValueOnce('{"analysis":"todo bien","idealEleven":[]}');
        const result = await AIService.analyzePlayers([{ name: 'A' }]);
        expect(result).toHaveProperty('analysis', 'todo bien');
        expect(result.idealEleven).toEqual([]);
    });

    test('parsea respuesta con markdown code fence', async () => {
        const markdown = '```json\n{"analysis":"ok","idealEleven":[]}\n```';
        AIService.aiBreaker.fire.mockResolvedValueOnce({ content: markdown });
        const result = await AIService.analyzePlayers([{ name: 'B' }]);
        expect(result).toMatchObject({ analysis: 'ok' });
    });

    test('parsea respuesta JSON embebida en texto', async () => {
        AIService.aiBreaker.fire.mockResolvedValueOnce('Aquí el resultado: {"analysis":"ok","idealEleven":[]}');
        const result = await AIService.analyzePlayers([{ name: 'C' }]);
        expect(result.analysis).toBe('ok');
    });

    // ── Real mode: error paths ───────────────────────────────────────────────
    test('lanza error cuando la respuesta no es JSON válido', async () => {
        AIService.aiBreaker.fire.mockResolvedValueOnce('not a json at all');
        await expect(AIService.analyzePlayers([{ name: 'D' }]))
            .rejects.toThrow('El formato de respuesta de la IA no es un JSON válido');
    });

    test('propaga error del circuit-breaker envuelto en mensaje de fallo', async () => {
        AIService.aiBreaker.fire.mockRejectedValueOnce(new Error('breaker down'));
        await expect(AIService.analyzePlayers([{ name: 'E' }]))
            .rejects.toThrow('Fallo en la comunicación con la IA: breaker down');
    });

    test('fallback re-lanza el error original correctamente', async () => {
        AIService.aiBreaker.fire.mockRejectedValueOnce(new Error('circuit abierto'));
        await expect(AIService.analyzePlayers([]))
            .rejects.toThrow('Fallo en la comunicación con la IA: circuit abierto');
    });
});
