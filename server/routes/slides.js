// Plik: server/routes/slides.js
// Placeholder dla tras związanych ze slajdami

const express = require('express');
const router = express.Router();

// GET /api/slides - Zwraca przykładowe dane slajdów
router.get('/', (req, res) => {
  const slidesData = [
    { id: 1, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', title: 'Big Buck Bunny 1' },
    { id: 2, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4', title: 'Big Buck Bunny 2' },
    { id: 3, videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_5mb.mp4', title: 'Big Buck Bunny 3' },
  ];
  res.json(slidesData);
});

module.exports = router;
