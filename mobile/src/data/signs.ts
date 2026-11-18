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

export const CATEGORIES = ['Pagbati', 'Pamilya', 'Bilang'] as const;

export const SIGNS: Sign[] = [
  { id: '1', title: 'Kumusta', meaning: 'Pagbati o pagtatanong kung ayos ang isang tao.', category: 'Pagbati', description: 'Panoorin ang galaw ng kamay, direksyon ng palad, at ekspresyon ng mukha.', videoSource: require('../../assets/videos/kumusta.mp4') },
  { id: '2', title: 'Salamat', meaning: 'Pagpapahayag ng pasasalamat sa isang tao.', category: 'Pagbati', description: 'Panoorin ang galaw ng kamay, direksyon ng palad, at ekspresyon ng mukha.', videoSource: require('../../assets/videos/salamat.mp4') },
  { id: '3', title: 'Magandang Umaga', meaning: 'Pagbati tuwing umaga.', category: 'Pagbati', description: 'Panoorin ang galaw ng kamay, direksyon ng palad, at ekspresyon ng mukha.', videoSource: require('../../assets/videos/magandang_umaga.mp4') },
  { id: '4', title: 'Paalam', meaning: 'Pagbati sa paghihiwalay o pag-alis.', category: 'Pagbati', description: 'Panoorin ang galaw ng kamay, direksyon ng palad, at ekspresyon ng mukha.', videoSource: require('../../assets/videos/paalam.mp4') },
  { id: '5', title: 'Ingat', meaning: 'Paalalang mag-ingat at mag-alaga sa sarili.', category: 'Pagbati', description: 'Panoorin ang galaw ng kamay, direksyon ng palad, at ekspresyon ng mukha.', videoSource: require('../../assets/videos/ingat.mp4') },
  { id: '6', title: 'Nanay', meaning: 'Tawag sa ina o babaeng magulang.', category: 'Pamilya', description: 'Panoorin ang galaw ng kamay, direksyon ng palad, at ekspresyon ng mukha.', videoSource: require('../../assets/videos/nanay.mp4') },
  { id: '7', title: 'Tatay', meaning: 'Tawag sa ama o lalaking magulang.', category: 'Pamilya', description: 'Panoorin ang galaw ng kamay, direksyon ng palad, at ekspresyon ng mukha.', videoSource: require('../../assets/videos/tatay.mp4') },
  { id: '8', title: 'Isa', meaning: 'Bilang na kasunod ng sero.', category: 'Bilang', description: 'Panoorin ang galaw ng kamay, direksyon ng palad, at ekspresyon ng mukha.', videoSource: require('../../assets/videos/isa.mp4') },
  { id: '9', title: 'Dalawa', meaning: 'Bilang na kasunod ng isa.', category: 'Bilang', description: 'Panoorin ang galaw ng kamay, direksyon ng palad, at ekspresyon ng mukha.', videoSource: require('../../assets/videos/dalawa.mp4') },
];
