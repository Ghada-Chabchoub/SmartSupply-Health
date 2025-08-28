const axios = require('axios');

const searchGoogle = async (query) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX_ID;

  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}`;

  try {
    const res = await axios.get(url);
    const items = res.data.items || [];

   

    return items.map(item => {
      const priceMatch = item.snippet.match(/(\d+[.,]?\d*)\s?(€|euros|EUR)/i);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null;

      return {
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        price
      };
    });
  } catch (err) {
    console.error("Erreur Google Search:", err.message);
    return [];
  }
};

module.exports = searchGoogle;
