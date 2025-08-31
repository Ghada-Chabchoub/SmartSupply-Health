require('dotenv').config({ path: './.env' });
const { ChromaClient } = require('chromadb');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const Product = require('../models/Product'); // <- ajoute ce modèle

// --- CONFIGURATION ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const CHROMA_COLLECTION_NAME = 'products';

if (!GEMINI_API_KEY || !MONGO_URI) {
  throw new Error("GEMINI_API_KEY ou MONGO_URI n'est pas défini.");
}

// --- INITIALISATION ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const chromaClient = new ChromaClient();

const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
const chatModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: { temperature: 0.7 },
});

// --- PRINCIPAL ---
async function getChatbotResponse(question) {
  try {
    console.log(`Recherche pour: "${question}"`);
    const collection = await chromaClient.getCollection({ name: CHROMA_COLLECTION_NAME });

    const questionEmbeddingResult = await embeddingModel.embedContent(question);
    const questionEmbedding = questionEmbeddingResult.embedding.values;

    const relevantDocs = await collection.query({
      queryEmbeddings: [questionEmbedding],
      nResults: 5,
    });

    const ids = relevantDocs.ids?.[0] || [];

    if (ids.length === 0) {
      console.log("Aucun produit trouvé.");
      return "Je n'ai trouvé aucun produit pertinent dans la base de données.";
    }

    // Récupération réelle depuis MongoDB
    const products = await Product.find({ _id: { $in: ids } });

    const context = products.map(p => {
      const specs = (p.technicalSpecs || []).map(s => `- ${s.specName}: ${s.specValue}`).join("\n");
      const faqs = (p.faqs || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n");
      return `Nom: ${p.name}\nDescription: ${p.description}\nUtilisation: ${p.usageInstructions}\nMarque: ${p.brandInfo}\nAudience: ${p.targetAudience}\nSpécifications:\n${specs}\nFAQ:\n${faqs}`;
    }).join("\n\n---\n\n");

    const prompt = `
Tu es "SmartBot", un assistant expert en matériel médical.
Base-toi STRICTEMENT sur les informations suivantes pour répondre. Ne mentionne jamais le mot "contexte".
Si la réponse ne s’y trouve pas, dis que tu ne disposes pas de cette information. N’invente rien.

INFORMATIONS PRODUITS:
${context}

QUESTION:
"${question}"

RÉPONSE:
`.trim();

    console.log('Génération de la réponse...');
    const result = await chatModel.generateContent(prompt);
    const text = result.response.text();
    console.log(`Réponse générée: "${text}"`);

    return text;

  } catch (error) {
    console.error("Erreur dans le service chatbot:", error);
    throw new Error("Erreur lors de la génération de la réponse.");
  }
}

module.exports = { getChatbotResponse };
