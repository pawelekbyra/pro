// Plik: client/src/pages/VideoPlayerPage.jsx
// Wersja z poprawionym importem stylów Swipera

import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

// Bardziej bezpośredni import stylów - to może pomóc w niektórych środowiskach budowania
import 'swiper/swiper.min.css';

import './VideoPlayerPage.css';
import api from '../api';

const VideoPlayerPage = () => {
  const [slides, setSlides] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await api.get('/slides');
        setSlides(response.data);
      } catch (err) {
        setError('Nie udało się załadować wideo. Spróbuj ponownie później.');
        console.error('Błąd pobierania slajdów:', err);
      }
    };
    fetchSlides();
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (slides.length === 0) {
    return <div>Ładowanie...</div>;
  }

  return (
    <Swiper
      direction={'vertical'}
      className="video-swiper"
      loop={true}
    >
      {slides.map((slide) => (
        <SwiperSlide key={slide.id} className="video-slide">
          <video src={slide.videoUrl} controls autoPlay muted loop playsInline />
          <div className="video-title">{slide.title}</div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default VideoPlayerPage;
