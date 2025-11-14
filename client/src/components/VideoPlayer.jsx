import React, { useEffect, useRef, useState } from 'react';
import Swiper from 'swiper';
import 'swiper/css';
import './VideoPlayer.css';
import API from '../api';

const VideoPlayer = () => {
  const swiperRef = useRef(null);
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await API.get('/slides');
        // This is a placeholder until the backend is implemented
        const data = [
            {
              id: 1,
              videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
            },
            {
              id: 2,
              videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
            },
            {
              id: 3,
              videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
            },
          ];
        setSlides(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length > 0) {
      swiperRef.current = new Swiper('.swiper-container', {
        direction: 'vertical',
        loop: true,
      });
    }
  }, [slides]);

  return (
    <div className="swiper-container">
      <div className="swiper-wrapper">
        {slides.map((slide) => (
          <div className="swiper-slide" key={slide.id}>
            <video src={slide.videoUrl} controls />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoPlayer;
