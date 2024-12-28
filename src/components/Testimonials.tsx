import React, { useRef, useState, useEffect } from 'react';
import { FaStar, FaQuoteLeft, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

interface TestimonialProps {
  id?: string;
  name: string;
  date: string;
  content: string;
  rating: number;
}

const TestimonialCard: React.FC<TestimonialProps> = ({ name, date, content, rating }) => {
  return (
    <div className="px-4 py-6 h-[400px]">
      <div className="relative bg-white rounded-xl p-8 h-full transition-all duration-300 hover:translate-y-[-4px] group">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-[#F5EEE6] rounded-tl-xl rounded-br-[100px] -z-1"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#F5EEE6] rounded-br-xl rounded-tl-[120px] -z-1"></div>
        
        {/* Content container with gradient border */}
        <div className="relative z-10 bg-white rounded-lg p-6 h-full flex flex-col shadow-[0_0_0_1px_rgba(107,68,35,0.1)] hover:shadow-[0_0_0_2px_rgba(107,68,35,0.2)]">
          {/* Quote icon with decorative circle */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
            <FaQuoteLeft className="text-[#B68D40] text-sm" />
          </div>

          {/* Rating display */}
          <div className="flex mb-4">
            {[...Array(rating)].map((_, index) => (
              <FaStar key={index} className="text-[#B68D40] w-4 h-4 mr-1" />
            ))}
          </div>

          {/* Testimonial content */}
          <p className="text-gray-700 relative z-10 mb-auto leading-relaxed break-words line-clamp-6">
            {content}
          </p>

          {/* Author section with enhanced styling */}
          <div className="flex items-center pt-4 border-t border-[#E6D5B8] mt-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#6B4423] to-[#B68D40] rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-inner">
              {name.charAt(0)}
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-[#6B4423] text-lg">{name}</h4>
              <p className="text-sm text-[#B68D40]">{date}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomArrow = ({ direction, onClick }: { direction: 'prev' | 'next', onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`absolute ${direction === 'prev' ? '-left-6' : '-right-6'} top-1/2 transform -translate-y-1/2 
    w-12 h-12 bg-white rounded-full shadow-lg z-10 flex items-center justify-center
    transition-all duration-300 hover:bg-gradient-to-r hover:from-[#6B4423] hover:to-[#B68D40] hover:text-white text-[#6B4423]
    focus:outline-none focus:ring-2 focus:ring-[#B68D40] focus:ring-opacity-50
    border border-[#E6D5B8] group`}
  >
    {direction === 'prev' ? (
      <FaArrowLeft className="text-xl group-hover:scale-110 transition-transform duration-300" />
    ) : (
      <FaArrowRight className="text-xl group-hover:scale-110 transition-transform duration-300" />
    )}
  </button>
);

const Testimonials: React.FC = () => {
  const sliderRef = useRef<Slider>(null);
  const [testimonials, setTestimonials] = useState<TestimonialProps[]>([]);
  const [totalRating, setTotalRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const q = query(collection(db, 'testimonials'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const testimonialData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TestimonialProps[];
        
        setTestimonials(testimonialData);
        
        // Calculate average rating
        const total = testimonialData.reduce((acc, curr) => acc + curr.rating, 0);
        setTotalRating(testimonialData.length > 0 ? total / testimonialData.length : 0);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const getSliderSettings = (count: number) => {
    const baseSettings = {
      dots: count > 1,
      infinite: count > 2,
      speed: 500,
      autoplay: count > 1,
      autoplaySpeed: 3000,
      pauseOnHover: true,
      cssEase: "linear",
      arrows: count > 1,
      slidesToShow: Math.min(count, 3),
      slidesToScroll: 1,
      prevArrow: count > 1 ? <CustomArrow direction="prev" /> : undefined,
      nextArrow: count > 1 ? <CustomArrow direction="next" /> : undefined,
      appendDots: (dots: React.ReactNode) => (
        <div style={{ position: 'relative', bottom: '-20px' }}>
          <ul className="flex justify-center gap-2"> {dots} </ul>
        </div>
      ),
      customPaging: () => (
        <button className="w-3 h-3 rounded-full bg-blue-600/30 hover:bg-blue-600 transition-colors duration-300" />
      ),
      responsive: [
        {
          breakpoint: 1536,
          settings: {
            slidesToShow: Math.min(count, 3),
            slidesToScroll: 1,
          }
        },
        {
          breakpoint: 1280,
          settings: {
            slidesToShow: Math.min(count, 2),
            slidesToScroll: 1,
          }
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: false
          }
        }
      ]
    };

    return baseSettings;
  };

  if (isLoading) {
    return (
      <div className="py-16 bg-[#F5EEE6]">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B4423] mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  const settings = getSliderSettings(testimonials.length);

  return (
    <div className="py-16 bg-gradient-to-b from-[#F5EEE6] to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#6B4423] mb-4 relative inline-block">
            What Our Clients Say
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#B68D40] to-transparent"></div>
          </h2>
          
          <div className="flex items-center justify-center mt-6">
            <div className="bg-white px-6 py-3 rounded-full shadow-md flex items-center">
              <span className="text-3xl font-bold text-[#6B4423] mr-3">{totalRating.toFixed(1)}</span>
              <div className="flex mr-3">
                {[...Array(5)].map((_, index) => (
                  <FaStar
                    key={index}
                    className={`w-5 h-5 ${
                      index < Math.floor(totalRating)
                        ? 'text-[#B68D40]'
                        : 'text-[#E6D5B8]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-700 font-medium">
                Based on {testimonials.length} reviews
              </span>
            </div>
          </div>
        </div>
        
        <div className="relative px-12">
          <Slider ref={sliderRef} {...settings}>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.id || index} {...testimonial} />
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
