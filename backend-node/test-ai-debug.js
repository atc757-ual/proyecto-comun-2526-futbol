require('dotenv').config();
const aiService = require('./app_api/services/ai.service');

(async () => {
  try {
      console.log('Iniciando prueba de IA...');
      const players = [{ name: 'Messi', position: 'Forward', age: 34, stats: { goals: 50, assists: 20 } }];
      const result = await aiService.analyzePlayers(players);
      console.log('Resultado Exitoso:', result);
  } catch (err) {
      console.error('ERROR CAPTURADO:', err);
  }
})();
