import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, MapPin, CheckCircle } from 'lucide-react'

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-yellow-50 flex flex-col relative overflow-hidden">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-8 py-4 bg-gradient-to-r from-emerald-500 via-lime-400 to-green-500 shadow-lg fixed top-0 left-0 z-20">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">Pothole Detector</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="px-4 py-2 rounded font-semibold text-emerald-900 bg-white/80 hover:bg-white transition shadow-sm">Log In</Link>
          <Link to="/register" className="px-4 py-2 rounded font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow transition">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center">
        {/* Spacer to prevent overlap with navbar */}
        <div className="w-full" style={{ height: '128px' }}></div>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-50 z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center h-full">
          {/* Hero content */}
          <h1 className="text-6xl font-extrabold text-gray-900 mb-4">
            Detect. Report. Fix. <span className="text-blue-700">Potholes</span> Together.
          </h1>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl text-center">
            Join the movement to make roads safer. Our app lets you instantly report potholes with GPS and photos, helping local authorities take action faster. Every report counts towards safer journeys for everyone.
          </p>
          <div className="flex gap-4">
            <Link to="/register" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center">
              Get Started
            </Link>
            <Link to="/login" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-100 transition flex items-center justify-center">
              Log In
            </Link>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <span className="animate-bounce text-white text-3xl">↓</span>
        </div>
      </section>

      {/* Info Section (grey, appears after scrolling) */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl mb-2">⚠️</div>
            <h2 className="font-bold text-xl mb-2">Why Potholes Matter</h2>
            <p className="text-gray-700">
              Potholes cause accidents, vehicle damage, and traffic jams. Early detection and reporting can prevent injuries and save money for everyone.
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">📍</div>
            <h2 className="font-bold text-xl mb-2">How It Works</h2>
            <p className="text-gray-700">
              Spot a pothole? Use our app to capture its location and photo. Your report is sent directly to local authorities for quick action.
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">✅</div>
            <h2 className="font-bold text-xl mb-2">Community Impact</h2>
            <p className="text-gray-700">
              Every report helps build safer roads. Join thousands of users making a difference in their city—one pothole at a time.
            </p>
          </div>
        </div>
      </section>

      {/* Subtle background illustration (optional) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <svg width="100%" height="100%" className="absolute inset-0 opacity-10" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="400" cy="300" rx="350" ry="120" fill="#60a5fa" />
          <ellipse cx="600" cy="500" rx="200" ry="60" fill="#34d399" />
          <ellipse cx="200" cy="100" rx="120" ry="40" fill="#fbbf24" />
        </svg>
      </div>
    </div>
  )
}

export default Landing 