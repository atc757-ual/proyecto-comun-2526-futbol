require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

(async () => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log('Probando gemini-pro...');
    const result = await model.generateContent("Di hola");
    console.log('Respuesta:', result.response.text());
  } catch(e) {
    console.error('ERROR SDK:', e);
  }
})();
