import { motion } from 'framer-motion';

const LandingTestimonials = () => {
  const testimonials = [
    {
      initials: "JS",
      name: "Jamie Smith",
      role: "Software Engineer",
      content: "InterVue AI completely transformed my interview preparation. The feedback on my answers helped me identify weaknesses I didn't even know I had. I landed my dream job at a FAANG company!",
    },
    {
      initials: "MT",
      name: "Maria Torres",
      role: "Product Manager",
      content: "The AI-generated questions were incredibly relevant to the positions I was applying for. The vocal analysis helped me eliminate filler words and speak more confidently. Highly recommended!",
    },
    {
      initials: "AK",
      name: "Alex Kim",
      role: "Data Scientist",
      content: "As an introvert, I struggled with interviews. InterVue AI gave me a safe space to practice repeatedly. The detailed feedback helped me improve my communication skills dramatically.",
    },
    {
      initials: "RP",
      name: "Rahul Patel",
      role: "UX Designer",
      content: "The personalized feedback report was a game-changer. It didn't just tell me what to improve, but showed me exactly how to improve it. I went from multiple rejections to 3 job offers!",
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-indigo-50 to-indigo-100 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl font-bold text-indigo-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ 
              type: "tween",
              ease: "easeInOut",
              duration: 0.5 
            }}
          >
            Trusted by Job Seekers
          </motion.h2>
          <motion.p 
            className="text-xl text-slate-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ 
              type: "tween",
              ease: "easeInOut",
              duration: 0.5,
              //delay: 0.1
            }}
          >
            Hear what our users say about their interview success
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                type: "tween",
                ease: "easeInOut",
                duration: 0.5,
                //delay: index * 0.15
              }}
            >
              <div className="flex items-center mb-6">
                <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center text-indigo-600 font-bold mr-4">
                  {testimonial.initials}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{testimonial.name}</h4>
                  <p className="text-slate-600">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-slate-700 italic mb-6">
                "{testimonial.content}"
              </p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;