import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'
import { LogOut, AlertTriangle, MapPin, BarChart3, Plus } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Report {
  _id: string
  coordinates: {
    lat: number
    lng: number
  }
  date: string
  riskPercentage: number
  status: string
  actionsTaken: string
  locationName?: string
  image?: string
}

const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

const Dashboard: React.FC = () => {
  const { user, token, logout, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportsLoading, setReportsLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showReportDetails, setShowReportDetails] = useState(false)
  const [manualLocation, setManualLocation] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Report[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraLoading, setCameraLoading] = useState(false)

  const fetchReports = useCallback(async () => {
    if (!token) return
    
    setReportsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/report', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched reports:', data)
        
        // Update reports with location names if they're missing
        const updatedReports = await Promise.all(
          data.map(async (report: Report) => {
            if (!report.locationName || report.locationName === 'Unknown Location') {
              console.log('Updating location for report:', report._id)
              const locationName = await getLocationName(report.coordinates.lat, report.coordinates.lng)
              console.log('New location name:', locationName)
              return { ...report, locationName }
            }
            return report
          })
        )
        
        setReports(updatedReports)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setReportsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isLoading) return // Wait for auth to initialize
    
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchReports()
    
    // Try to get user's current location and center the map
    getCurrentLocation().then(location => {
      // You could center the map here if needed
      console.log('User location:', location)
    }).catch(error => {
      console.log('Could not get user location:', error)
    })
  }, [isAuthenticated, isLoading, navigate, fetchReports])

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
    setShowReportModal(true)
  }

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  const getLocationName = async (lat: number, lng: number): Promise<string> => {
    try {
      console.log('Getting location name for:', lat, lng)
      
      // Major Indian cities with their approximate coordinates
      const majorCities = [
        { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
        { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
        { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
        { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
        { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
        { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
        { name: 'Pune', lat: 18.5204, lng: 73.8567 },
        { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
        { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
        { name: 'Surat', lat: 21.1702, lng: 72.8311 },
        { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
        { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
        { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
        { name: 'Indore', lat: 22.7196, lng: 75.8577 },
        { name: 'Thane', lat: 19.2183, lng: 72.9781 },
        { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
        { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
        { name: 'Pimpri-Chinchwad', lat: 18.6298, lng: 73.7997 },
        { name: 'Patna', lat: 25.5941, lng: 85.1376 },
        { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
        { name: 'Jalgaon', lat: 21.0077, lng: 75.5626 },
        { name: 'Dhule', lat: 20.9028, lng: 74.7772 }
      ]
      
      // Check if coordinates are near any major city
      console.log('Checking distance to major cities...')
      for (const city of majorCities) {
        const distance = Math.sqrt(
          Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
        )
        console.log(`Distance to ${city.name}: ${distance.toFixed(3)} (${(distance * 111).toFixed(1)}km)`)
        if (distance < 0.5) { // Within ~50km
          console.log(`✅ Found nearby city: ${city.name} (distance: ${distance.toFixed(3)} = ${(distance * 111).toFixed(1)}km)`)
          return city.name
        }
      }
      console.log('❌ No nearby cities found within 50km radius')
      
      // If not near a major city, try geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=en&limit=1`
      )
      
      if (!response.ok) {
        console.error('Geocoding API error:', response.status, response.statusText)
        return 'Unknown Location'
      }
      
      const data = await response.json()
      console.log('Full geocoding response:', data)
      
      // Try multiple approaches to get location name
      let locationName = 'Unknown Location'
      
      // Approach 1: Use address components
      if (data.address) {
        console.log('Address components:', data.address)
        const address = data.address
        if (address.city) {
          locationName = address.city
          console.log('Found city:', locationName)
        } else if (address.town) {
          locationName = address.town
          console.log('Found town:', locationName)
        } else if (address.village) {
          locationName = address.village
          console.log('Found village:', locationName)
        } else if (address.district) {
          locationName = address.district
          console.log('Found district:', locationName)
        } else if (address.state) {
          locationName = address.state
          console.log('Found state:', locationName)
        }
      }
      
      // Approach 2: Parse display_name if address components didn't work
      if (locationName === 'Unknown Location' && data.display_name) {
        console.log('Display name:', data.display_name)
        const parts = data.display_name.split(', ')
        console.log('Address parts:', parts)
        
        // Look for meaningful location names
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim()
          if (part.length > 2 && 
              !['India', 'State', 'District', 'Postal Code', 'PIN', 'Road', 'Street', 'Avenue', 'Highway'].includes(part)) {
            locationName = part
            console.log('Selected from display_name:', locationName)
            break
          }
        }
      }
      
      // Approach 3: Use the first meaningful part
      if (locationName === 'Unknown Location' && data.display_name) {
        const parts = data.display_name.split(', ')
        if (parts.length > 0) {
          locationName = parts[0].trim()
          console.log('Using first part:', locationName)
        }
      }
      
      console.log('Final location name:', locationName)
      return locationName
      
    } catch (error) {
      console.error('Error getting location name:', error)
      return 'Unknown Location'
    }
  }

  const handleReportPothole = async () => {
    try {
      toast.loading('Getting your current location...', { id: 'location' })
      
      const currentLocation = await getCurrentLocation()
      setSelectedLocation(currentLocation)
      setShowReportModal(true)
      
      toast.success('Location captured! Please confirm details.', { id: 'location' })
    } catch (error) {
      console.error('Error getting location:', error)
      toast.error('Could not get your location. Please click on the map to select a location.', { id: 'location' })
      
      // Fallback to default location
      setSelectedLocation({ lat: 20.5937, lng: 78.9629 })
      setShowReportModal(true)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleReportClick = (report: Report) => {
    setSelectedReport(report)
    setShowReportDetails(true)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const query = searchQuery.toLowerCase().trim()
      
      // Search through existing reports
      const filteredReports = reports.filter(report => {
        const locationMatch = report.locationName?.toLowerCase().includes(query)
        const statusMatch = report.status.toLowerCase().includes(query)
        const dateMatch = new Date(report.date).toLocaleDateString().includes(query)
        const riskMatch = report.riskPercentage.toString().includes(query)
        
        return locationMatch || statusMatch || dateMatch || riskMatch
      })
      
      setSearchResults(filteredReports)
      
      if (filteredReports.length === 0) {
        toast('No reports found matching your search', { icon: '🔍' })
      } else {
        toast.success(`Found ${filteredReports.length} report(s)`)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed')
    } finally {
      setSearchLoading(false)
    }
  }

  // Camera functions
  const startCamera = async () => {
    setCameraLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      setCameraStream(stream)
      setShowCamera(true)
      setCameraLoading(false)
    } catch (error) {
      console.error('Camera error:', error)
      toast.error('Failed to access camera')
      setCameraLoading(false)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (!cameraStream) return

    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    video.srcObject = cameraStream
    video.play()

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      if (context) {
        context.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        console.log('Photo captured! Image data length:', imageData.length)
        console.log('Image data preview:', imageData.substring(0, 100) + '...')
        setCapturedImage(imageData)
        stopCamera()
        toast.success('Photo captured successfully!')
      }
    }
  }

  const removePhoto = () => {
    setCapturedImage(null)
  }

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/report/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Report deleted successfully')
        fetchReports()
        if (selectedReport?._id === reportId) {
          setShowReportDetails(false)
          setSelectedReport(null)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to delete report')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast.error('Failed to delete report')
    }
  }

  // Auto-search as user types
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const filteredReports = reports.filter(report => {
        const locationMatch = report.locationName?.toLowerCase().includes(query)
        const statusMatch = report.status.toLowerCase().includes(query)
        const dateMatch = new Date(report.date).toLocaleDateString().includes(query)
        const riskMatch = report.riskPercentage.toString().includes(query)
        
        return locationMatch || statusMatch || dateMatch || riskMatch
      })
      console.log('Search query:', query)
      console.log('Total reports:', reports.length)
      console.log('Filtered reports:', filteredReports.length)
      console.log('Search results:', filteredReports)
      setSearchResults(filteredReports)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, reports])

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocation) {
      toast.error('Please select a location first')
      return
    }

    setLoading(true)
    console.log('Submitting report with location:', selectedLocation)
    
    try {
      setLocationLoading(true)
      
      // Get location name from coordinates
      let locationName = await getLocationName(selectedLocation.lat, selectedLocation.lng)
      
      // If automatic location detection failed, use manual input
      if (locationName === 'Unknown Location' && manualLocation.trim()) {
        locationName = manualLocation.trim()
      }
      
      const reportData = {
        coordinates: selectedLocation,
        date: new Date().toISOString(),
        riskPercentage: Math.floor(Math.random() * 100) + 1, // Random risk for demo
        locationName: locationName,
        image: capturedImage // Include the captured image
      }
      
      console.log('Report data:', reportData)
      console.log('Image data present:', !!capturedImage)
      console.log('Image data length:', capturedImage ? capturedImage.length : 0)
      console.log('Token:', token ? 'Present' : 'Missing')
      console.log('Image data preview:', capturedImage ? capturedImage.substring(0, 100) + '...' : 'None')
      
      // Check if image data is too large (MongoDB has limits)
      if (capturedImage && capturedImage.length > 16000000) { // 16MB limit
        console.warn('Image data is very large, might cause issues')
        toast.error('Image is too large. Please try a smaller photo.')
        return
      }
      
      if (!token) {
        toast.error('Authentication token missing. Please login again.')
        return
      }
      
      const response = await fetch('http://localhost:5000/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const responseData = await response.json()
      console.log('Response data:', responseData)

      if (response.ok) {
        console.log('Report submitted successfully with image length:', capturedImage ? capturedImage.length : 0)
        toast.success('🚨 Pothole reported to government authorities!', {
          duration: 5000,
          icon: '🚨',
        })
        setShowReportModal(false)
        setSelectedLocation(null)
        
        // Refresh the reports list after successful submission
        setTimeout(() => {
          fetchReports()
        }, 1000)
      } else {
        toast.error(responseData.message || 'Failed to report pothole')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Network error')
    } finally {
      setLoading(false)
      setLocationLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  {/* Car in pothole icon */}
                  <path d="M3 14h18v2H3z" fill="currentColor"/> {/* Road */}
                  <path d="M7 12h10v4H7z" fill="none" stroke="currentColor" strokeWidth="0.5"/> {/* Pothole outline */}
                  <path d="M8 13h8v2H8z" fill="none" stroke="currentColor" strokeWidth="0.5"/> {/* Pothole inner */}
                  <path d="M9 10h6v4h-6z" fill="currentColor"/> {/* Car body */}
                  <path d="M10 9h4v2h-4z" fill="currentColor"/> {/* Car top */}
                  <circle cx="11" cy="13" r="0.8" fill="currentColor"/> {/* Front wheel */}
                  <circle cx="13" cy="13" r="0.8" fill="currentColor"/> {/* Back wheel */}
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Pothole Reporter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleReportPothole}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Report Pothole
              </button>
              
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {/* Search Results Dropdown */}
                {searchQuery && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-[9999] max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Found {searchResults.length} report(s)</p>
                      {searchResults.slice(0, 5).map((report) => (
                        <div 
                          key={report._id}
                          className="p-2 hover:bg-blue-50 rounded cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => {
                            handleReportClick(report)
                            setSearchQuery('')
                            setSearchResults([])
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                Risk: {report.riskPercentage}%
                              </p>
                              <p className="text-xs text-gray-600">
                                {new Date(report.date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-blue-600 font-medium">
                                📍 {report.locationName || 'Unknown Location'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
                              report.status === 'Resolved' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {searchResults.length > 5 && (
                        <p className="text-xs text-gray-500 text-center py-1">
                          ... and {searchResults.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* No Results */}
                {searchQuery && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-[9999]">
                    <div className="p-3 text-center">
                      <p className="text-sm text-gray-600">No reports found</p>
                      <p className="text-xs text-gray-500">Try different search terms</p>
                    </div>
                  </div>
                )}
              </div>
              


              <span className="text-sm text-gray-700 font-bold">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[20.5937, 78.9629]} // India center
            zoom={5}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler onMapClick={handleMapClick} />
            
            {reports.map((report) => (
              <Marker
                key={report._id}
                position={[report.coordinates.lat, report.coordinates.lng]}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">Pothole Report</h3>
                    <p className="text-sm text-gray-600">
                      Risk: {report.riskPercentage}%
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {report.status}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(report.date).toLocaleDateString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Floating Action Button */}
          <div className="absolute bottom-6 right-6 z-50">
            <button
              onClick={handleReportPothole}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transform transition-transform hover:scale-105"
              title="Report a pothole with GPS location"
              style={{ zIndex: 1000 }}
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Statistics</h2>
              <button
                onClick={fetchReports}
                disabled={reportsLoading}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                {reportsLoading ? '🔄' : '🔄 Refresh'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Total Reports</p>
                    {reportsLoading ? (
                      <div className="animate-pulse bg-blue-200 h-8 w-12 rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold text-blue-600">{reports.length}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reports.filter(r => r.status === 'Resolved').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reports.map((report) => (
                <div 
                  key={report._id} 
                  className="bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleReportClick(report)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Risk: {report.riskPercentage}%
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(report.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        📍 {report.locationName || 'Unknown Location'}
                      </p>
                      {report.image && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                          📸 Photo attached
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
                      report.status === 'Resolved' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    📍 Click to view details
                  </div>
                  {report.image && (
                    <div className="mt-2">
                      <img
                        src={report.image}
                        alt="Pothole preview"
                        className="w-full h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No reports yet</p>
                  <p className="text-xs">Report your first pothole!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={(e) => {
          if (e.target === e.currentTarget) {
            console.log('Closing modal via overlay - captured image length:', capturedImage ? capturedImage.length : 0)
            setShowReportModal(false)
            setSelectedLocation(null)
            setCapturedImage(null)
            setManualLocation('')
          }
        }}>
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🚧 Report Pothole</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600">GPS Active</span>
                <button
                  onClick={() => {
                    console.log('Closing modal via X button - captured image length:', capturedImage ? capturedImage.length : 0)
                    setShowReportModal(false)
                    setSelectedLocation(null)
                    setCapturedImage(null)
                    setManualLocation('')
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleReportSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 GPS Location Captured
                </label>
                {selectedLocation ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 font-medium">
                      ✅ Location: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      This location will be sent to local government authorities
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-yellow-600">
                    Click on the map to select a location, or use the default location below
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏙️ Location Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter city/area name (e.g., Mumbai, Delhi, Bangalore)"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  If automatic location detection fails, you can manually enter the location name
                </p>
              </div>

              {/* Camera Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📸 Pothole Photo (Optional)
                </label>
                
                {!capturedImage && !showCamera && (
                  <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">Take a photo of the pothole for better documentation</p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        disabled={cameraLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {cameraLoading ? '🔄 Starting camera...' : '📸 Take Photo'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Create a simple test image
                          const canvas = document.createElement('canvas')
                          canvas.width = 200
                          canvas.height = 150
                          const ctx = canvas.getContext('2d')
                          if (ctx) {
                            ctx.fillStyle = '#ff6b6b'
                            ctx.fillRect(0, 0, 200, 150)
                            ctx.fillStyle = 'white'
                            ctx.font = '16px Arial'
                            ctx.fillText('Test Pothole', 50, 75)
                            const testImage = canvas.toDataURL('image/jpeg', 0.7)
                            setCapturedImage(testImage)
                            console.log('Test image created:', testImage.length, 'characters')
                            toast.success('Test image created!')
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                      >
                        🧪 Test Image
                      </button>
                    </div>
                  </div>
                )}

                {showCamera && (
                  <div className="relative">
                    <video
                      ref={(video) => {
                        if (video && cameraStream) {
                          video.srcObject = cameraStream
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                      >
                        📸 Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <div className="relative">
                    <img
                      src={capturedImage}
                      alt="Captured pothole"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white rounded-full text-xs hover:bg-red-700"
                    >
                      ✕
                    </button>
                    <div className="mt-2 text-xs text-green-600 text-center">
                      ✅ Photo captured! This will be sent to government authorities
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📋 Report Details
                </label>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Reporter:</span>
                    <span className="font-medium">{user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span className="font-medium">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority:</span>
                    <span className="font-medium text-orange-600">High</span>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <div className="text-blue-600 mr-2 mt-0.5">ℹ️</div>
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Government Notification:</p>
                    <p>This report will be automatically sent to:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Local Municipal Corporation</li>
                      <li>Public Works Department</li>
                      <li>Traffic Police Department</li>
                    </ul>
                  </div>
                </div>
              </div>



              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Closing modal via Cancel button - captured image length:', capturedImage ? capturedImage.length : 0)
                    setShowReportModal(false)
                    setSelectedLocation(null)
                    setCapturedImage(null)
                    setManualLocation('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedLocation}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (locationLoading ? '📍 Detecting location...' : '🚀 Submitting to Government...') : '🚨 Submit to Government'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showReportDetails && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowReportDetails(false)
            setSelectedReport(null)
          }
        }}>
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📋 Report Details</h3>
              <button
                onClick={() => {
                  setShowReportDetails(false)
                  setSelectedReport(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">


              {/* Report ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report ID</label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">{selectedReport._id}</p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📍 Location</label>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    📍 {selectedReport.locationName || 'Unknown Location'}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Latitude:</strong> {selectedReport.coordinates.lat.toFixed(6)}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Longitude:</strong> {selectedReport.coordinates.lng.toFixed(6)}
                  </p>
                  <a 
                    href={`https://www.google.com/maps?q=${selectedReport.coordinates.lat},${selectedReport.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                  >
                    🗺️ View on Google Maps
                  </a>
                </div>
              </div>

              {/* Pothole Photo */}
              {selectedReport.image ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📸 Pothole Photo</label>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <img
                      src={selectedReport.image}
                      alt="Pothole photo"
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        console.error('Image failed to load:', e)
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      📸 Photo captured by reporter
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📸 Pothole Photo</label>
                  <div className="bg-gray-50 p-3 rounded-md text-center">
                    <p className="text-sm text-gray-500">No photo captured for this report</p>
                    <button
                      type="button"
                      onClick={() => {
                        // Test with a simple image to see if display works
                        const testImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
                        const updatedReport = { ...selectedReport, image: testImage }
                        setSelectedReport(updatedReport)
                        console.log('Test image added to report:', updatedReport)
                        toast.success('Test image added to this report')
                      }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      🧪 Add Test Image
                    </button>
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">⚠️ Risk Assessment</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        selectedReport.riskPercentage > 70 ? 'bg-red-500' :
                        selectedReport.riskPercentage > 40 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${selectedReport.riskPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{selectedReport.riskPercentage}%</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedReport.riskPercentage > 70 ? 'High Risk - Immediate attention required' :
                   selectedReport.riskPercentage > 40 ? 'Medium Risk - Attention needed soon' : 'Low Risk - Monitor'}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📊 Status</label>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  selectedReport.status === 'Resolved' 
                    ? 'bg-green-100 text-green-800'
                    : selectedReport.status === 'In Progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedReport.status}
                </span>
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📅 Date & Time</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedReport.date).toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">
                  {Math.floor((Date.now() - new Date(selectedReport.date).getTime()) / (1000 * 60 * 60 * 24))} days ago
                </p>
              </div>

              {/* Actions Taken */}
              {selectedReport.actionsTaken && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🔧 Actions Taken</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedReport.actionsTaken}
                  </p>
                </div>
              )}

              {/* Government Departments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🏛️ Sent to Departments</label>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Local Municipal Corporation
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Public Works Department
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Traffic Police Department
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  setShowReportDetails(false)
                  setSelectedReport(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Copy report details to clipboard
                  navigator.clipboard.writeText(
                    `Pothole Report ID: ${selectedReport._id}\nLocation: ${selectedReport.coordinates.lat}, ${selectedReport.coordinates.lng}\nRisk: ${selectedReport.riskPercentage}%\nStatus: ${selectedReport.status}\nDate: ${new Date(selectedReport.date).toLocaleString()}`
                  )
                  toast.success('Report details copied to clipboard!')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                📋 Copy Details
              </button>
              <button
                onClick={() => deleteReport(selectedReport._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                🗑️ Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowSearchModal(false)
            setSearchQuery('')
            setSearchResults([])
          }
        }}>
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🔍 Search Reports</h3>
              <button
                onClick={() => {
                  setShowSearchModal(false)
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search by location, status, date, or risk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {searchLoading ? '🔍' : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Tips */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800 font-medium mb-1">💡 Search Tips:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Location: "Dhule", "Mumbai", "Delhi"</li>
                <li>• Status: "Reported", "Resolved", "In Progress"</li>
                <li>• Risk: "50", "75", "25"</li>
                <li>• Date: "2025", "27", "7/27"</li>
              </ul>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Found {searchResults.length} report(s)
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((report) => (
                    <div 
                      key={report._id}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        handleReportClick(report)
                        setShowSearchModal(false)
                        setSearchQuery('')
                        setSearchResults([])
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Risk: {report.riskPercentage}%
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(report.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-blue-600 font-medium mt-1">
                            📍 {report.locationName || 'Unknown Location'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
                          report.status === 'Resolved' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-blue-600">
                        📍 Click to view details
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !searchLoading && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No reports found</p>
                <p className="text-xs">Try different search terms</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 