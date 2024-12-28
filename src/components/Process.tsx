import React from 'react';
import { motion } from 'framer-motion';
import { FaRegLightbulb, FaRegHandshake, FaPencilRuler, FaTools, FaClipboardCheck, FaRegSmile } from 'react-icons/fa';

const processSteps = [
  {
    icon: FaRegLightbulb,
    title: 'Initial Consultation',
    description: 'We begin with a detailed discussion of your vision, requirements, and preferences.',
    phase: 'Planning'
  },
  {
    icon: FaPencilRuler,
    title: 'Design Concept',
    description: 'Our designers create custom concepts tailored to your style and space.',
    phase: 'Planning'
  },
  {
    icon: FaRegHandshake,
    title: 'Design Approval',
    description: 'Review and refine the designs until they perfectly match your vision.',
    phase: 'Design'
  },
  {
    icon: FaTools,
    title: 'Implementation',
    description: 'Expert craftsmen bring the approved designs to life with precision.',
    phase: 'Execution'
  },
  {
    icon: FaClipboardCheck,
    title: 'Quality Check',
    description: 'Rigorous quality inspection to ensure everything meets our high standards.',
    phase: 'Execution'
  },
  {
    icon: FaRegSmile,
    title: 'Final Handover',
    description: 'Your beautifully transformed space is ready for you to enjoy.',
    phase: 'Completion'
  }
];

const Process: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-[#F5EEE6] to-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[url('/pattern-light.png')] opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-[#4A2D1D] mb-4">
            Our Process
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-[#B68D40] via-[#4A2D1D] to-[#B68D40] mx-auto mb-6" />
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience our streamlined approach to bringing your interior design vision to life
          </p>
        </motion.div>

        {/* Process Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {processSteps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative group"
            >
              <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                {/* Phase Label */}
                <div className="absolute top-4 right-4">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F5EEE6] text-[#4A2D1D]">
                    {step.phase}
                  </span>
                </div>

                {/* Step Number */}
                <div className="absolute -left-4 -top-4 w-16 h-16 bg-[#4A2D1D]/5 rounded-full flex items-center justify-center text-2xl font-bold text-[#4A2D1D]/20">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="relative z-10 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#F5EEE6] to-white rounded-full flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-[#4A2D1D]" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-[#4A2D1D] mb-3 group-hover:text-[#B68D40] transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Decorative line */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#B68D40]/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Process;
