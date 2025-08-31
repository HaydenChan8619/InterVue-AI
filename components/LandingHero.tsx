'use client'
import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';

const LandingHero = () => {
    const router = useRouter();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "tween", 
        ease: "easeInOut", 
        duration: 0.5 
      }
    }
  };

  const handleStartSession = () => 
    {
        router.push('/backgroundinfo');
    }

  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold text-indigo-900 mb-6"
          >
            Ace Your Next <span className="text-indigo-600">Interview</span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto mb-10"
          >
            AI-powered interview practice tailored to your resume and target job. Get instant feedback to improve your performance.
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
          >
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg text-lg transition duration-200 transform hover:scale-105 shadow-lg"
            onClick={handleStartSession}>
              Start Practicing - It's Free
            </button>
          </motion.div>
        </motion.div>
        
        <ProcessSection />
      </div>
    </section>
  );
};

const ProcessSection = () => {
  return (
    <motion.div 
      className="mt-16 relative" 
      id="process"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="absolute -inset-4 bg-indigo-600 rounded-2xl opacity-20 blur-xl z-0"></div>
      <div className="relative bg-white rounded-2xl shadow-xl p-8 z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-indigo-900 mb-3">How InterVue AI Works</h2>
          <p className="text-slate-600 max-w-xl mx-auto">Transform your interview skills in just 3 simple steps</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-stretch">
          <ProcessStep 
            number={1}
            title="Upload & Analyze"
            description="Upload your resume and target job description"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          
          <div className="hidden md:flex items-center justify-center text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          
          <ProcessStep 
            number={2}
            title="AI Interview Simulation"
            description="Answer personalized questions with voice analysis"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }
          />
          
          <div className="hidden md:flex items-center justify-center text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          
          <ProcessStep 
            number={3}
            title="Personalized Feedback"
            description="Get detailed report with strengths and improvements"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>
    </motion.div>
  );
};

interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ number, title, description, icon }) => {
  return (
    <div className="flex-1 bg-gradient-to-b from-indigo-50 to-white rounded-xl p-6 border border-indigo-100">
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl mb-4">
          {number}
        </div>
        <div className="text-indigo-600 mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-indigo-900 mb-2">{title}</h3>
        <p className="text-slate-600">{description}</p>
      </div>
    </div>
  );
};

export default LandingHero;