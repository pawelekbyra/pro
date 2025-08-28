"use client";

import { motion } from 'framer-motion';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';

interface SlideUIProps {
  slide: {
    user: string;
    description: string;
    initialLikes: number;
    initialIsLiked: boolean;
  };
}

const uiVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.5, // Delay the UI animation until the slide is in place
      staggerChildren: 0.2,
    }
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const SlideUI: React.FC<SlideUIProps> = ({ slide }) => {
  return (
    <motion.div
      className="absolute inset-0 z-10"
      variants={uiVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <TopBar />
      </motion.div>
      <motion.div variants={itemVariants}>
        <Sidebar initialLikes={slide.initialLikes} initialIsLiked={slide.initialIsLiked} />
      </motion.div>
      <motion.div variants={itemVariants}>
        <BottomBar user={slide.user} description={slide.description} />
      </motion.div>
    </motion.div>
  );
};

export default SlideUI;
