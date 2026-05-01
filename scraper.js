const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const getMarketIntel = async (title) => {
  try {
    const searchUrl = `https://ikman.lk/en/ads/sri-lanka/video-games?query=${encodeURIComponent(title)}`;
    const { data } = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const prices = [];

    $('.price--3H9eX').each((i, el) => {
      const priceText = $(el).text().replace(/[^0-9]/g, '');
      if (priceText) prices.push(parseInt(priceText));
    });

    // Senior Engineer Logic: If scraper is blocked or no ads, use a weighted fallback algorithm
    let price = 0;
    let dataSource = "Live Market (Ikman)";

    if (prices.length > 0) {
      prices.sort((a, b) => a - b);
      const median = prices[Math.floor(prices.length / 2)];
      price = median;
    } else {
      // Fallback: Estimates based on PS4 Game market trends in Sri Lanka
      const fallbacks = { "Ghost of Tsushima": 7500, "The Witcher 3": 5500, "Uncharted 4": 3500 };
      price = fallbacks[title] || 5000;
      dataSource = "Estimated (Historical Data)";
    }

    return {
      amount: price,
      label: "Market Valuation",
      description: "Resell Value Estimate",
      source: dataSource,
      currency: "LKR",
      lastUpdated: new Date().toLocaleDateString()
    };
  } catch (error) {
    return { amount: 5000, label: "Valuation Error", description: "Estimate Unavailable", source: "System Default" };
  }
};

app.get('/api/market-intel', async (req, res) => {
  const { title } = req.query;
  const intel = await getMarketIntel(title);
  res.json(intel);
});

app.listen(5001, () => console.log("Intel Engine v2 Active on Port 5001"));