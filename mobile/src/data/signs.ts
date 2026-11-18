import type { VideoSource } from 'expo-video';

// Placeholder content. Replace with verified Filipino Sign Language (FSL) content
// from credible sources before the final demo.
export type Sign = {
  id: string;
  title: string;
  meaning: string;
  category: string;
  description: string;
  videoSource: VideoSource;
};

export const CATEGORIES = ['Greetings', 'Family', 'Numbers'] as const;

export const SIGNS: Sign[] = [
  { id: '1', title: 'Kumusta', meaning: 'Hello / How are you?', category: 'Greetings', description: 'Watch the demonstration and notice the handshape, palm direction, and movement. Sign conventions can vary by region.', videoSource: require('../../assets/videos/kumusta.mp4') },
  { id: '2', title: 'Salamat', meaning: 'Thank you', category: 'Greetings', description: 'Watch the demonstration and notice the handshape, palm direction, and movement. Sign conventions can vary by region.', videoSource: require('../../assets/videos/salamat.mp4') },
  { id: '3', title: 'Magandang Umaga', meaning: 'Good morning', category: 'Greetings', description: 'Watch the demonstration and notice the handshape, palm direction, and movement. Sign conventions can vary by region.', videoSource: require('../../assets/videos/magandang_umaga.mp4') },
  { id: '4', title: 'Paalam', meaning: 'Goodbye', category: 'Greetings', description: 'Watch the demonstration and notice the handshape, palm direction, and movement. Sign conventions can vary by region.', videoSource: require('../../assets/videos/paalam.mp4') },
  { id: '5', title: 'Ingat', meaning: 'Take care', category: 'Greetings', description: 'Watch the demonstration and notice the handshape, palm direction, and movement. Sign conventions can vary by region.', videoSource: require('../../assets/videos/ingat.mp4') },
  { id: '6', title: 'Nanay', meaning: 'Mother', category: 'Family', description: 'Watch the demonstration and notice the handshape, palm direction, and movement. Sign conventions can vary by region.', videoSource: require('../../assets/videos/nanay.mp4') },
  { id: '7', title: 'Tatay', meaning: 'Father', category: 'Family', description: 'Watch the demonstration and notice the handshape, palm direction, and movement. Sign conventions can vary by region.', videoSource: require('../../assets/videos/tatay.mp4') },
  { id: '8', title: 'Isa', meaning: 'One', category: 'Numbers', description: 'Watch the demonstration and notice the handshape, palm direction, and movement. Sign conventions can vary by region.', videoSource: require('../../assets/videos/isa.mp4') },
  { id: '9', title: 'Dalawa', meaning: 'Two', category: 'Numbers', description: 'Watch the demonstration and notice the handshape, palm direction, and movement. Sign conventions can vary by region.', videoSource: require('../../assets/videos/dalawa.mp4') },
];
