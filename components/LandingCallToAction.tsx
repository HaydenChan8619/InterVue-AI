import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const LandingCallToAction = () => {
    const router = useRouter();
    
    const handleStartSession = () => 
    {
        router.push('/backgroundinfo');
    }

  return (
    <motion.section 
      className="py-16 bg-indigo-900 text-white"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ 
        type: "tween",
        ease: "easeInOut",
        duration: 0.5
      }}
    >
      <div className="container mx-auto max-w-4xl text-center px-4">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold mb-6"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ 
            type: "tween",
            ease: "easeInOut",
            duration: 0.5,
          }}
        >
          Ready to Ace Your Next Interview?
        </motion.h2>
        <motion.p 
          className="text-xl text-indigo-200 mb-6 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ 
            type: "tween",
            ease: "easeInOut",
            duration: 0.5,
          }}
        >
          Join the job seekers who have<br />transformed their interview skills with InterVue AI.
        </motion.p>
        <motion.button 
        className="bg-white text-indigo-900 hover:bg-indigo-100 font-bold py-4 px-10 rounded-full text-lg shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ 
            transition: { 
            duration: 0.2,
            ease: "easeInOut"
            }, 
            scale:1.05
        }}
        viewport={{ once: true }}
        transition={{ 
            type: "tween",
            ease: "easeInOut",
            duration: 0.5,
        }} onClick={handleStartSession}
        >
        Get Started For Free
        </motion.button>
        <motion.p 
          className="mt-4 text-indigo-200"
          initial={{ opacity: 0, y: 10  }}
          whileInView={{ opacity: 1, y: 0  }}
          viewport={{ once: true }}
          transition={{ 
            type: "tween",
            ease: "easeInOut",
            duration: 0.5,
          }}
        >
          No payment required to start.
        </motion.p>
      </div>
    </motion.section>
  );
};

export default LandingCallToAction;