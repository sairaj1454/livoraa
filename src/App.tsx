import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import emailjs from '@emailjs/browser';
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Process from './components/Process'
import Portfolio from './components/Portfolio'
import Contact from './components/Contact'
import Footer from './components/Footer'
import About from './components/About'
import ContactUs from './components/ContactUs'
import Gallery from './components/Gallery'
import Blog from './components/Blog'
import BlogView from './components/BlogView'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Testimonials from './components/Testimonials'
import ScrollToTop from './components/ScrollToTop';

// Initialize EmailJS
emailjs.init('wGzsvi5X7v8prOba-');

// Admin Routes Component
const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

// Main Website Routes Component
const MainWebsiteRoutes = () => {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <Services />
              <Process />
              <Portfolio />
              <Testimonials />
              <Contact />
            </>
          } />
          <Route path="/about" element={<About />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogView />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col">
        <Routes>
          {/* Admin section - completely separate */}
          <Route path="/admin/*" element={<AdminRoutes />} />
          
          {/* Main website - everything else */}
          <Route path="/*" element={<MainWebsiteRoutes />} />
        </Routes>
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  )
}

export default App
