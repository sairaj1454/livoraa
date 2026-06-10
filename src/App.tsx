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
import GetQuote from './pages/GetQuote'
import LivoraaComfort from './components/LivoraaComfort'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Testimonials from './components/Testimonials'
import ScrollToTop from './components/ScrollToTop';
import CustomerLogin from './pages/customer/Login';
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerProtectedRoute from './components/CustomerProtectedRoute';
import { ImageKitProvider } from '@imagekit/react';
import { urlEndpoint, publicKey, authenticator } from './config/imagekit';
// Initialize EmailJS
emailjs.init('oOOOitjU95GaDU0hL');

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

// Customer Routes Component
const CustomerRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<CustomerLogin />} />
      <Route
        path="/dashboard/*"
        element={
          <CustomerProtectedRoute>
            <CustomerDashboard />
          </CustomerProtectedRoute>
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
          <Route path="/get-quote" element={<GetQuote />} />
          <Route path="/comfort" element={<LivoraaComfort />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <Router>
      <ImageKitProvider urlEndpoint={urlEndpoint}>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Routes>
            {/* Admin section - completely separate */}
            <Route path="/admin/*" element={<AdminRoutes />} />
            {/* Customer section - completely separate */}
            <Route path="/customer/*" element={<CustomerRoutes />} />
            {/* Main website */}
            <Route path="/*" element={<MainWebsiteRoutes />} />
          </Routes>
        </div>
        <ToastContainer position="bottom-right" />
      </ImageKitProvider>
    </Router>
  );
}

export default App
