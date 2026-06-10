import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiHome,
    HiArrowRight,
    HiArrowLeft,
    HiCheckCircle,
    HiUser,
    HiPhone,
    HiLocationMarker,
    HiCurrencyRupee
} from 'react-icons/hi';
import {
    FaKitchenSet,
    FaBed,
    FaTv,
    FaLightbulb,
    FaPaintRoller,
    FaCouch,
    FaHouse
} from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useEmailNotification } from '../hooks/useEmailNotification';

const GetQuote = () => {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();
    const { sendEmail } = useEmailNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        floorPlan: '',
        purpose: '',
        requirements: [] as string[],
        name: '',
        phone: '',
        location: '',
        budget: ''
    });

    const steps = [
        { id: 1, name: 'Floor Plan' },
        { id: 2, name: 'Requirements' },
        { id: 3, name: 'Details' }
    ];

    const floorPlans = [
        { id: '2 BHK', label: '2 BHK', icon: HiHome },
        { id: '3 BHK', label: '3 BHK', icon: HiHome },
        { id: '4 BHK', label: '4 BHK', icon: HiHome },
        { id: '5 BHK', label: '5 BHK', icon: HiHome },
        { id: 'Villa', label: 'Villa', icon: FaHouse },
        { id: 'Other', label: 'Other', icon: HiHome },
    ];

    const purposes = [
        { id: 'Move In', label: 'Move In' },
        { id: 'Rent Out', label: 'Rent Out' },
        { id: 'Renovation', label: 'Renovation' },
    ];

    const requirementsList = [
        { id: 'Modular Kitchen', label: 'Modular Kitchen', icon: FaKitchenSet },
        { id: 'Wardrobe', label: 'Wardrobe', icon: FaBed },
        { id: 'TV Unit', label: 'TV Unit', icon: FaTv },
        { id: 'False Ceiling', label: 'False Ceiling', icon: FaLightbulb },
        { id: 'Painting', label: 'Painting', icon: FaPaintRoller },
        { id: 'Living Area', label: 'Living Area', icon: FaCouch },
    ];

    const handleRequirementToggle = (reqId: string) => {
        setFormData(prev => ({
            ...prev,
            requirements: prev.requirements.includes(reqId)
                ? prev.requirements.filter(id => id !== reqId)
                : [...prev.requirements, reqId]
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.phone || !formData.location || !formData.budget) {
            toast.error('Please fill in all details');
            return;
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
            toast.error('Enter a valid 10-digit Indian mobile number');
            return;
        }

        setIsSubmitting(true);
        try {
            const requestsRef = collection(db, 'personalized_enquiries');
            await addDoc(requestsRef, {
                ...formData,
                timestamp: serverTimestamp(),
                status: 'pending'
            });

            // Send email notification to admin
            await sendEmail({
                name: formData.name,
                phone: formData.phone,
                formType: 'get-quote',
                message: `Floor Plan: ${formData.floorPlan}
Purpose: ${formData.purpose}
Requirements: ${formData.requirements.join(', ')}
Property Location: ${formData.location}
Budget: ${formData.budget}`,
            });

            setStep(4); // Success step
            toast.success('Quote request submitted successfully!');
        } catch (error) {
            console.error('Error submitting quote request:', error);
            toast.error('Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && (!formData.floorPlan || !formData.purpose)) {
            toast.error('Please select both floor plan and purpose');
            return;
        }
        if (step === 2 && formData.requirements.length === 0) {
            toast.error('Please select at least one requirement');
            return;
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    return (
        <div className="min-h-screen bg-[#F8F3EE] pt-24 md:pt-32 pb-12 md:pb-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 md:mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-5xl font-serif text-[#4A2D1D] mb-4"
                    >
                        Design Your Dream Space
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-[#6B4423] text-sm md:text-base max-w-lg mx-auto"
                    >
                        Tell us about your home and requirements, and we'll create a personalized plan just for you.
                    </motion.p>
                </div>

                {/* Step Indicator */}
                {step < 4 && (
                    <div className="relative mb-12 md:mb-16">
                        <div className="flex justify-between w-full max-w-[320px] sm:max-w-[400px] md:max-w-[500px] mx-auto relative px-10 md:px-12">
                            {/* Line container anchored to circle centers */}
                            <div className="absolute top-[16px] md:top-[20px] left-[60px] md:left-[75px] right-[60px] md:right-[75px] h-[2px] bg-gray-200 z-0">
                                {/* Active progress line */}
                                <div
                                    className="h-full bg-[#4A2D1D] transition-all duration-500"
                                    style={{
                                        width: `${(step - 1) * 50}%`
                                    }}
                                />
                            </div>

                            {steps.map((s) => (
                                <div key={s.id} className="flex flex-col items-center relative z-10 min-w-[80px]">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300 ${step >= s.id
                                        ? 'bg-[#4A2D1D] text-white shadow-lg shadow-[#4A2D1D]/20 active-step-glow'
                                        : 'bg-white border-2 border-gray-200 text-gray-400'
                                        }`}>
                                        {step > s.id ? <HiCheckCircle className="w-5 h-5 md:w-6 md:h-6" /> : s.id}
                                    </div>
                                    <span className={`text-[10px] md:text-xs mt-3 font-bold uppercase tracking-widest text-center ${step >= s.id ? 'text-[#4A2D1D]' : 'text-gray-400'}`}>
                                        {s.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white rounded-3xl md:rounded-[32px] p-6 md:p-12 shadow-xl shadow-black/5"
                    >
                        {step === 1 && (
                            <div className="space-y-8 md:space-y-12">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-serif text-[#4A2D1D] text-center mb-6 md:mb-8">Select Floor Plan</h2>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                        {floorPlans.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setFormData(prev => ({ ...prev, floorPlan: item.id }))}
                                                className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 gap-2 md:gap-3 group ${formData.floorPlan === item.id
                                                    ? 'border-[#BC9B7A] bg-[#BC9B7A]/5 text-[#BC9B7A]'
                                                    : 'border-gray-50 hover:border-[#BC9B7A]/30 text-gray-400 hover:text-gray-600'
                                                    }`}
                                            >
                                                <item.icon className={`text-2xl md:text-3xl transition-transform duration-300 ${formData.floorPlan === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                                                <span className="text-sm md:font-medium">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl md:text-2xl font-serif text-[#4A2D1D] text-center mb-6 md:mb-8">Purpose</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                        {purposes.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setFormData(prev => ({ ...prev, purpose: item.id }))}
                                                className={`py-3 md:py-4 px-6 rounded-xl border-2 transition-all duration-300 text-sm md:font-medium ${formData.purpose === item.id
                                                    ? 'border-[#BC9B7A] bg-[#BC9B7A]/5 text-[#BC9B7A]'
                                                    : 'border-gray-50 hover:border-[#BC9B7A]/30 text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={nextStep}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#BC9B7A] text-white rounded-xl font-bold hover:bg-[#a88a6d] transition-colors shadow-lg shadow-[#BC9B7A]/20"
                                    >
                                        Next Step <HiArrowRight />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 md:space-y-12">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-serif text-[#4A2D1D] text-center mb-6 md:mb-8">What do you need?</h2>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                        {requirementsList.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleRequirementToggle(item.id)}
                                                className={`flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 gap-3 md:gap-4 group ${formData.requirements.includes(item.id)
                                                    ? 'border-[#BC9B7A] bg-[#BC9B7A]/5 text-[#BC9B7A] shadow-lg shadow-[#BC9B7A]/10'
                                                    : 'border-gray-50 hover:border-[#BC9B7A]/30 text-gray-400 hover:text-gray-600'
                                                    }`}
                                            >
                                                <item.icon className={`text-3xl md:text-4xl transition-transform duration-300 ${formData.requirements.includes(item.id) ? 'scale-110' : 'group-hover:scale-110'}`} />
                                                <span className="text-sm md:font-medium text-center">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                                    <button
                                        onClick={prevStep}
                                        className="order-2 sm:order-1 flex items-center justify-center gap-2 px-8 py-3.5 bg-white border-2 border-[#4A2D1D]/10 text-[#4A2D1D] rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        <HiArrowLeft /> Back
                                    </button>
                                    <button
                                        onClick={nextStep}
                                        className="order-1 sm:order-2 flex items-center justify-center gap-2 px-8 py-3.5 bg-[#BC9B7A] text-white rounded-xl font-bold hover:bg-[#a88a6d] transition-colors shadow-lg shadow-[#BC9B7A]/20"
                                    >
                                        Next Step <HiArrowRight />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 md:space-y-12">
                                <h2 className="text-xl md:text-2xl font-serif text-[#4A2D1D] text-center mb-6 md:mb-8 uppercase tracking-widest font-bold">Your Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-[#4A2D1D] uppercase tracking-wider">Name</label>
                                        <div className="relative">
                                            <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BC9B7A] text-xl" />
                                            <input
                                                type="text"
                                                placeholder="Your Name"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-100 bg-[#FBFBFB] focus:ring-2 focus:ring-[#BC9B7A]/20 focus:border-[#BC9B7A] transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-[#4A2D1D] uppercase tracking-wider">Phone Number</label>
                                        <div className="flex rounded-xl border border-gray-100 bg-[#FBFBFB] overflow-hidden focus-within:ring-2 focus-within:ring-[#BC9B7A]/20 focus-within:border-[#BC9B7A] transition-all">
                                            <span className="flex items-center px-3 bg-gray-100 text-gray-600 font-semibold text-sm border-r border-gray-200 select-none whitespace-nowrap">
                                                +91
                                            </span>
                                            <input
                                                type="tel"
                                                placeholder="Your Phone Number"
                                                value={formData.phone}
                                                maxLength={10}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                                                className="flex-1 px-3 py-4 bg-transparent focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-[#4A2D1D] uppercase tracking-wider">Property Location</label>
                                        <div className="relative">
                                            <HiLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BC9B7A] text-xl" />
                                            <input
                                                type="text"
                                                placeholder="e.g. Hitech City, Hyderabad"
                                                value={formData.location}
                                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-100 bg-[#FBFBFB] focus:ring-2 focus:ring-[#BC9B7A]/20 focus:border-[#BC9B7A] transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-[#4A2D1D] uppercase tracking-wider">Budget (Approx)</label>
                                        <div className="relative">
                                            <HiCurrencyRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BC9B7A] text-xl" />
                                            <select
                                                value={formData.budget}
                                                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-100 bg-[#FBFBFB] focus:ring-2 focus:ring-[#BC9B7A]/20 focus:border-[#BC9B7A] transition-all outline-none appearance-none text-gray-500"
                                            >
                                                <option value="">Select Budget</option>
                                                <option value="3-5 Lakhs">3-5 Lakhs</option>
                                                <option value="5-8 Lakhs">5-8 Lakhs</option>
                                                <option value="8-12 Lakhs">8-12 Lakhs</option>
                                                <option value="12-15 Lakhs">12-15 Lakhs</option>
                                                <option value="15+ Lakhs">15+ Lakhs</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row justify-between items-center gap-3 md:gap-4 pt-6 md:pt-8 w-full">
                                    <button
                                        onClick={prevStep}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 bg-white border-2 border-[#4A2D1D]/10 text-[#4A2D1D] rounded-xl font-bold hover:bg-gray-50 transition-colors text-sm md:text-base"
                                    >
                                        <HiArrowLeft /> Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-[2] sm:flex-none flex items-center justify-center gap-2 px-6 md:px-12 py-3.5 md:py-4 bg-[#4a2e1f] text-white rounded-xl font-bold hover:bg-[#3d261a] transition-colors shadow-lg shadow-black/10 text-sm md:text-base disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Submitting...
                                            </>
                                        ) : 'Submit Request'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="text-center py-8 md:py-12 space-y-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                                    className="w-20 h-20 md:w-24 md:h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8"
                                >
                                    <HiCheckCircle className="w-12 h-12 md:w-16 md:h-16" />
                                </motion.div>
                                <h2 className="text-3xl md:text-4xl font-serif text-[#4A2D1D]">Thank You!</h2>
                                <p className="text-base md:text-lg text-[#6B4423] max-w-md mx-auto px-4">
                                    We have received your details. Our design expert will call you shortly to discuss your requirements.
                                </p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="mt-8 px-10 py-4 bg-[#4a2e1f] text-white rounded-xl font-bold hover:bg-[#3d261a] transition-all shadow-lg shadow-black/10 w-full sm:w-auto"
                                >
                                    Back to Home
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default GetQuote;
