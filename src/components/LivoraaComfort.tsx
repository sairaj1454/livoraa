import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import {
  HiOutlineSparkles,
  HiOutlinePhone,
  HiOutlineChevronDown,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  icon: string;
  gradient: string;
  accent: string;
  badge?: string;
}

const products: Product[] = [
  {
    id: 'mattress',
    name: 'Luxury Mattresses',
    tagline: 'Sleep Like Royalty',
    description:
      'Handcrafted mattresses engineered for superior comfort and lasting support. From memory foam to orthopedic spring systems — tailored to your body and your bedroom.',
    features: [
      'Memory Foam & Pocket Spring options',
      'Custom sizes (King, Queen, Single)',
      'Orthopedic & Anti-allergenic layers',
      '100-night comfort guarantee',
      'Home delivery & setup included',
    ],
    icon: '🛏️',
    gradient: 'from-[#f9f4ed] to-[#f0e8d8]',
    accent: '#8B5E3C',
    badge: 'Best Seller',
  },
  {
    id: 'curtains',
    name: 'Curtain Materials',
    tagline: 'Frame Every View',
    description:
      'Premium draping fabrics curated from across India and beyond. From sheer voiles to blackout linens — we help you dress your windows in style.',
    features: [
      'Sheer, Semi-sheer & Blackout options',
      'Velvet, Linen, Silk & Cotton blends',
      'Custom stitching & rod fittings',
      'UV protection & thermal fabrics',
      '300+ fabric swatches to choose from',
    ],
    icon: '🪟',
    gradient: 'from-[#f4eef9] to-[#e8d8f0]',
    accent: '#6B3C8B',
    badge: 'New Arrivals',
  },
  {
    id: 'interiors',
    name: 'Custom Interiors',
    tagline: 'Spaces Designed Around You',
    description:
      'End-to-end interior solutions — from concept to completion. Modular furniture, custom wardrobes, false ceilings, and bespoke decor for every room in your home.',
    features: [
      'Full-home & room-specific designs',
      'Modular kitchens & wardrobes',
      'False ceilings & wall panelling',
      '3D visualization before execution',
      '5-year warranty on workmanship',
    ],
    icon: '🏡',
    gradient: 'from-[#edf4f9] to-[#d8e8f0]',
    accent: '#3C6B8B',
    badge: 'Premium',
  },
];

// ─── Why Choose Us ────────────────────────────────────────────────────────────
const reasons = [
  { icon: '🏅', title: 'Trusted Quality', text: 'Premium-grade materials sourced from certified manufacturers with rigorous quality checks.' },
  { icon: '🎨', title: 'Fully Customizable', text: 'Every product is made-to-measure for your exact space, style, and specifications.' },
  { icon: '🚚', title: 'Doorstep Delivery', text: 'We bring showroom experience to your home with free delivery and professional setup.' },
  { icon: '💬', title: 'Expert Guidance', text: 'Our designers assist you from selection to installation — zero guesswork.' },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const faqs = [
  { q: 'Do you offer home visits for measurements?', a: 'Yes! We offer free home visits across Hyderabad for all curtain and interior enquiries. Simply WhatsApp us to schedule.' },
  { q: 'Can I see fabric swatches before ordering?', a: 'Absolutely. We can courier sample swatches to you, or you can visit our studio in Hyderabad to browse our entire collection.' },
  { q: 'What mattress sizes do you offer?', a: 'We offer all standard sizes (Single, Double, Queen, King) as well as fully custom dimensions to fit your bed frame perfectly.' },
  { q: 'How long does delivery take?', a: 'In-stock mattresses ship within 3–5 days. Custom curtains and interior works are delivered and installed within 2–4 weeks.' },
];

// ─── Component ───────────────────────────────────────────────────────────────
const LivoraaComfort: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' },
    }),
  };

  const whatsappUrl = 'https://wa.me/919000191496?text=Hello%20Livoraa%20Comfort!%20I%27m%20interested%20in%20your%20products.';

  return (
    <div className="bg-[#FAF7F3] min-h-screen font-sans">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/comfort-hero.png')` }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2A1810]/80 via-[#2A1810]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2A1810]/60 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white rounded-full px-5 py-2 mb-6"
            >
              <HiOutlineSparkles className="text-[#C9A96E]" />
              <span className="text-sm font-semibold tracking-wider uppercase">Livoraa Comfort</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="text-5xl md:text-7xl font-black text-white leading-tight mb-6"
            >
              Live in <br />
              <span className="text-[#C9A96E]">Comfort.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.65 }}
              className="text-xl text-white/80 leading-relaxed mb-10 max-w-lg"
            >
              Premium mattresses, handpicked curtain fabrics, and bespoke custom interiors — all under one roof. Crafted for Hyderabad homes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-900/30 transition-all duration-300 hover:scale-[1.03]"
              >
                <FaWhatsapp className="text-2xl" />
                Get Free Consultation
              </a>
              <a
                href="tel:+919000191496"
                className="flex items-center gap-3 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border border-white/30 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.03]"
              >
                <HiOutlinePhone className="text-2xl" />
                Call Us Now
              </a>
            </motion.div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 flex flex-col items-center gap-1"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <HiOutlineChevronDown className="text-xl" />
        </motion.div>
      </section>

      {/* ── Marquee Ticker ────────────────────────────────────────────────── */}
      <div className="bg-[#4A2D1D] py-4 overflow-hidden border-y border-[#C9A96E]/20">
        <div
          className="flex gap-0 whitespace-nowrap"
          style={{ animation: 'marquee 28s linear infinite' }}
        >
          {[
            '🛏️ Luxury Mattresses', '✦', '🪡 Premium Curtain Fabrics', '✦',
            '🏡 Custom Interiors', '✦', '🧵 100+ Fabric Swatches', '✦',
            '🔧 Free Home Visit', '✦', '✅ 5-Year Warranty', '✦',
            '📐 Made-to-Measure', '✦', '🚚 Free Delivery & Setup', '✦',
            '🛏️ Luxury Mattresses', '✦', '🪡 Premium Curtain Fabrics', '✦',
            '🏡 Custom Interiors', '✦', '🧵 100+ Fabric Swatches', '✦',
            '🔧 Free Home Visit', '✦', '✅ 5-Year Warranty', '✦',
            '📐 Made-to-Measure', '✦', '🚚 Free Delivery & Setup', '✦',
          ].map((tag, i) => (
            <span
              key={i}
              className={`text-sm font-bold px-6 ${
                tag === '✦' ? 'text-[#C9A96E]' : 'text-white/80'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* ── Products ──────────────────────────────────────────────────────── */}
      <section className="py-24 container mx-auto px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-black uppercase tracking-[0.25em] text-[#8B5E3C] bg-[#8B5E3C]/10 px-4 py-2 rounded-full mb-4">What We Offer</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#2A1810] leading-tight">
            Everything Your Home <br />
            <span className="text-[#8B5E3C]">Deserves</span>
          </h2>
        </motion.div>

        <div className="space-y-10">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className={`relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br ${product.gradient} border border-white shadow-xl shadow-black/5`}
            >
              {/* Badge */}
              {product.badge && (
                <div
                  className="absolute top-6 right-6 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-lg"
                  style={{ backgroundColor: product.accent }}
                >
                  {product.badge}
                </div>
              )}

              <div className={`grid md:grid-cols-2 gap-0 items-stretch ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                {/* Content */}
                <div className="p-10 md:p-14 flex flex-col justify-center">
                  <div className="text-5xl mb-5">{product.icon}</div>
                  <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: product.accent }}>
                    {product.tagline}
                  </div>
                  <h3 className="text-3xl font-black text-[#2A1810] mb-4">{product.name}</h3>
                  <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>

                  <ul className="space-y-3 mb-10">
                    {product.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-3">
                        <HiOutlineCheckCircle className="text-xl mt-0.5 flex-shrink-0" style={{ color: product.accent }} />
                        <span className="text-sm font-medium text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={`${whatsappUrl}&text=Hello%20Livoraa%20Comfort!%20I%27m%20interested%20in%20${encodeURIComponent(product.name)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 self-start px-8 py-4 rounded-2xl text-white font-bold shadow-lg transition-all duration-300 hover:scale-[1.04] hover:shadow-xl"
                    style={{ backgroundColor: product.accent }}
                  >
                    <FaWhatsapp className="text-xl" />
                    Enquire on WhatsApp
                    <HiOutlineArrowRight />
                  </a>
                </div>

                {/* Highlights Panel */}
                <div
                  className="min-h-[280px] md:min-h-0 flex flex-col justify-center p-10 md:p-14 relative overflow-hidden"
                  style={{ backgroundColor: `${product.accent}0d` }}
                >
                  {/* Top label */}
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] mb-5" style={{ color: product.accent }}>
                    At a Glance
                  </div>

                  {/* Feature tag pills */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {product.features.map((f, fi) => (
                      <span
                        key={fi}
                        className="text-xs font-bold px-3 py-1.5 rounded-full border"
                        style={{ borderColor: `${product.accent}40`, color: product.accent, backgroundColor: `${product.accent}10` }}
                      >
                        {f.split(' ').slice(0, 3).join(' ')}{f.split(' ').length > 3 ? '…' : ''}
                      </span>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="w-12 h-0.5 mb-6" style={{ backgroundColor: `${product.accent}40` }} />

                  {/* Spec rows */}
                  <div className="space-y-3">
                    {product.id === 'mattress' && [
                      ['Sizes', 'Single · Double · Queen · King · Custom'],
                      ['Layers', 'Memory Foam / Pocket Spring / Orthopedic'],
                      ['Warranty', '100-night comfort trial included'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-3 text-sm">
                        <span className="font-black w-20 flex-shrink-0" style={{ color: product.accent }}>{k}</span>
                        <span className="text-gray-600">{v}</span>
                      </div>
                    ))}
                    {product.id === 'curtains' && [
                      ['Fabric', 'Velvet · Linen · Silk · Sheer · Cotton'],
                      ['Type', 'Blackout · UV-protect · Thermal · Sheer'],
                      ['Service', 'Custom stitch · Rod fitting · Home install'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-3 text-sm">
                        <span className="font-black w-20 flex-shrink-0" style={{ color: product.accent }}>{k}</span>
                        <span className="text-gray-600">{v}</span>
                      </div>
                    ))}
                    {product.id === 'interiors' && [
                      ['Scope', 'Kitchen · Wardrobe · Ceiling · Decor'],
                      ['Process', 'Concept → 3D Design → Execution'],
                      ['Warranty', '5-year workmanship guarantee'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-3 text-sm">
                        <span className="font-black w-20 flex-shrink-0" style={{ color: product.accent }}>{k}</span>
                        <span className="text-gray-600">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Why Us ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#2A1810]">
        <div className="container mx-auto px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block text-xs font-black uppercase tracking-[0.25em] text-[#C9A96E] bg-[#C9A96E]/10 px-4 py-2 rounded-full mb-4">Why Livoraa Comfort</span>
            <h2 className="text-4xl font-black text-white">The Livoraa Difference</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasons.map((r, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{r.icon}</div>
                <h4 className="text-lg font-black text-white mb-2">{r.title}</h4>
                <p className="text-sm text-white/60 leading-relaxed">{r.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-24 container mx-auto px-6 max-w-3xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-black uppercase tracking-[0.25em] text-[#8B5E3C] bg-[#8B5E3C]/10 px-4 py-2 rounded-full mb-4">Got Questions?</span>
          <h2 className="text-4xl font-black text-[#2A1810]">Frequently Asked</h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span className="font-bold text-[#2A1810] pr-4">{faq.q}</span>
                <motion.span
                  animate={{ rotate: openFaq === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-[#8B5E3C] flex-shrink-0"
                >
                  <HiOutlineChevronDown className="text-2xl" />
                </motion.span>
              </button>
              <motion.div
                initial={false}
                animate={{ height: openFaq === i ? 'auto' : 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-6 text-gray-600 leading-relaxed">{faq.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#8B5E3C] to-[#4A2D1D] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #C9A96E 0%, transparent 50%), radial-gradient(circle at 80% 50%, #C9A96E 0%, transparent 50%)`,
          }}
        />
        <div className="relative container mx-auto px-6 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="text-5xl mb-6">🏠</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Ready to Transform <br />Your Home?
            </h2>
            <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
              Talk to our comfort consultants today. Free home visit, free design consultation, zero obligation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-green-900/30 transition-all hover:scale-[1.04]"
              >
                <FaWhatsapp className="text-2xl" />
                WhatsApp Us
              </a>
              <Link
                to="/get-quote"
                className="flex items-center gap-3 bg-white text-[#4A2D1D] hover:bg-[#FAF7F3] px-10 py-5 rounded-2xl font-black text-lg shadow-2xl transition-all hover:scale-[1.04]"
              >
                Get a Free Quote
                <HiOutlineArrowRight />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LivoraaComfort;
