import v1 from '../photos/arci2msUL8U.jpg';
import v2 from '../photos/WTQAiUKUZ5E.jpg';
import v3 from '../photos/6nyearUP21s.jpg';
import v4 from '../photos/JIdC4kbMVK8.jpg';
import v5 from '../photos/VzCkd6xeSwg.jpg';
import v6 from '../photos/IBtm3qQWuGI.jpg';
import v7 from '../photos/FPqW0cyTbAY.jpg';

export const CHANNEL = 'https://www.youtube.com/channel/UCpuEJNHoFEDxxrzzNmpu87A';
export interface Video { id: string; title: string; en: string; thumb: string }

export const VIDEOS: Video[] = [
    { id: 'arci2msUL8U', title: 'حكاية أسرة توت، الحلقة ٢: الأسرة الملكية', en: 'Baby Sensory Story', thumb: v1 },
    { id: 'WTQAiUKUZ5E', title: 'انطق معايا، حلقة ١: هرم، قطة، معبد', en: 'Baby First Words', thumb: v2 },
    { id: '6nyearUP21s', title: 'حكاية أسرة توت، الحلقة ١: الأمير الصغير', en: 'Baby Sensory Story', thumb: v3 },
    { id: 'JIdC4kbMVK8', title: 'القطة الفرعونية، حلقة ١', en: 'Pharaonic Cat Baby Sensory', thumb: v4 },
    { id: 'VzCkd6xeSwg', title: 'فلوكة على النيل، حلقة ١', en: 'Nile Felucca Baby Sensory', thumb: v5 },
    { id: 'IBtm3qQWuGI', title: 'أعمدة معبد الكرنك، حلقة ١', en: 'Karnak Columns Baby Sensory', thumb: v6 },
    { id: 'FPqW0cyTbAY', title: 'أهرامات مصر بالأبيض والأسود، حلقة ١', en: 'Egypt Pyramids Baby Sensory', thumb: v7 },
];
