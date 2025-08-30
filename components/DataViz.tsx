"use client";

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import VideoPlayer from './VideoPlayer';

const chartData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 700 },
  { name: 'Jun', value: 900 },
];

interface DataVizProps {
  videoUrl: string;
  posterUrl: string;
}

const DataViz: React.FC<DataVizProps> = ({ videoUrl, posterUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="relative h-full w-full bg-black">
      <VideoPlayer
        mp4Src={videoUrl}
        poster={posterUrl}
        isActive={true}
        isSecretActive={false}
        videoId="dataviz-video"
        videoRef={videoRef}
        onTimeUpdate={() => {}}
        startTime={0}
        onPlaybackFailure={() => {}}
        isPlaying={true}
      />
      <motion.div
        className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-black bg-opacity-50 p-4 rounded-lg"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2 }} // Animate in after 2 seconds
      >
        <h3 className="text-white text-xl mb-4 text-center">Engagement Growth</h3>
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }}
              labelStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default DataViz;
