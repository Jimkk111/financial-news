import { useRef } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const hotNews = [
  {
    id: 1,
    title: 'AI技术赋能金融科技，智能投顾成新趋势',
    image: 'https://images.unsplash.com/photo-1660626063662-55bb5e169e1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNpYWwlMjBuZXdzJTIwdHJhZGluZyUyMHN0b2Nrc3xlbnwxfHx8fDE3Njk2OTM1NjF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    tag: '热点'
  },
  {
    id: 2,
    title: '全球股市走势分析：科技板块领涨',
    image: 'https://images.unsplash.com/photo-1767424196045-030bbde122a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9jayUyMG1hcmtldCUyMGFuYWx5c2lzJTIwY2hhcnR8ZW58MXx8fHwxNzY5NjkzNTYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    tag: '分析'
  },
  {
    id: 3,
    title: '数字货币市场回暖，比特币突破新高',
    image: 'https://images.unsplash.com/photo-1633534415766-165181ffdbb7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcnlwdG9jdXJyZW5jeSUyMGJpdGNvaW4lMjB0cmFkaW5nfGVufDF8fHx8MTc2OTY5MzU2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    tag: '快讯'
  }
];

export function HotCarousel() {
  const sliderRef = useRef<Slider>(null);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
  };

  // 隐藏轮播图但不删除，后续可能会用到
  const hidden = true;

  if (hidden) {
    return null;
  }

  return (
    <div className="w-full px-4 mb-6">
      <Slider ref={sliderRef} {...settings}>
        {hotNews.map((news) => (
          <div key={news.id} className="outline-none">
            <div className="relative h-40 rounded-xl overflow-hidden">
              <img 
                src={news.image} 
                alt={news.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                  {news.tag}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white font-medium line-clamp-2">
                  {news.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}
