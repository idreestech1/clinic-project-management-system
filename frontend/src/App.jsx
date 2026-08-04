import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Header from './components/header/Header'
import Pages from './pages/Pages'
import Footer from './components/footer/Footer'
import TourOverlay from './components/tour/TourOverlay'
import { api } from './api/client'

function App() {
  const [activeSection, setActiveSection] = useState('Home')
  const [isRegistered, setIsRegistered] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isAdminSignedIn, setIsAdminSignedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [isTourOpen, setIsTourOpen] = useState(false)
  const [tourStepIndex, setTourStepIndex] = useState(0)
  const toastTimerRef = useRef(null)
  const showPublicHeader = !(isAdminSignedIn && activeSection === 'Dashboard')

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activeSection])

  const availableSections = useMemo(() => {
    if (isAdminSignedIn) {
      return ['Dashboard']
    }

    const base = ['Home', 'About', 'Services', 'Reviews', 'Contact']
    return isSignedIn ? [...base, 'Appointment'] : base
  }, [isSignedIn, isAdminSignedIn])

  const tourSteps = useMemo(() => {
    const steps = [
      {
        target: '[data-tour="navbar-logo"]',
        title: 'Welcome to Dr. Hammad Clinic',
        description: 'This top bar keeps key actions one click away. We made navigation simple and clean.',
        section: 'Home',
      },
      {
        target: '[data-tour="home-hero"]',
        title: 'Hero Section',
        description: 'This area quickly introduces the doctor and your main care message.',
        section: 'Home',
      },
      {
        target: '[data-tour="hero-book"]',
        title: 'Quick Booking',
        description: 'Use Book Appointment for fast scheduling. It smartly checks login status first.',
        section: 'Home',
      },
      {
        target: '[data-tour="services-page"]',
        title: 'Services Overview',
        description: 'Patients can explore all specialties and care options from this section.',
        section: 'Services',
      },
      {
        target: '[data-tour="about-page"]',
        title: 'Doctor Profile',
        description: 'This section builds trust with credentials, milestones, and philosophy of care.',
        section: 'About',
      },
      {
        target: '[data-tour="contact-page"]',
        title: 'Contact & Inquiry',
        description: 'Patients can send messages, view clinic hours, and open location directions.',
        section: 'Contact',
      },
    ]

    if (isSignedIn) {
      steps.push({
        target: '[data-tour="appointment-page"]',
        title: 'Appointment Dashboard',
        description: 'Signed-in patients can choose date/time slots and submit booking details here.',
        section: 'Appointment',
      })
    } else {
      steps.push({
        target: '[data-tour="patient-login"]',
        title: 'Patient Login',
        description: 'Guests can register and sign in here to unlock appointment booking.',
        section: 'Home',
      })
    }

    return steps
  }, [isSignedIn])

  useEffect(() => {
    if (!isTourOpen) {
      return
    }

    const currentStep = tourSteps[tourStepIndex]
    if (currentStep?.section) {
      setActiveSection(currentStep.section)
    }
  }, [isTourOpen, tourStepIndex, tourSteps])

  const handleNavClick = (section) => {
    if (!isSignedIn && section === 'Appointment') {
      return
    }

    if (!isAdminSignedIn && section === 'Dashboard') {
      return
    }

    setActiveSection(section)
  }

  const handlePatientLogin = () => {
    setActiveSection(isRegistered ? 'SignIn' : 'Register')
  }

  const handleOpenSignIn = () => {
    setActiveSection('SignIn')
  }

  const handleOpenRegister = () => {
    setActiveSection('Register')
  }

  const handleRegister = async ({ name, email, password }) => {
    try {
      await api.post('/auth/register', { name, email, password })
      setIsRegistered(true)
      setActiveSection('SignIn')
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  const handleSignIn = async ({ email, password }) => {
    try {
      const { user } = await api.post('/auth/login', { email, password })
      setCurrentUser(user)

      if (user.role === 'admin') {
        setIsAdminSignedIn(true)
        setIsSignedIn(false)
        setActiveSection('Dashboard')
        return { success: true, role: 'admin' }
      }

      setIsAdminSignedIn(false)
      setIsSignedIn(true)
      setIsRegistered(true)
      setActiveSection('Appointment')
      return { success: true, role: 'patient' }
    } catch (err) {
      return { success: false, reason: 'invalid_credentials', message: err.message }
    }
  }

  const handleLogout = () => {
    setIsAdminSignedIn(false)
    setIsSignedIn(false)
    setCurrentUser(null)
    setActiveSection('Home')
  }

  const showSignInToast = () => {
    setToastMessage('Please register first to book your appointment.')
    setShowToast(true)

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }

    toastTimerRef.current = setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }

  const handleBookAppointmentFromHome = () => {
    if (isSignedIn) {
      setActiveSection('Appointment')
      return
    }

    setActiveSection('Register')
    showSignInToast()
  }

  const handleContactFromHome = () => {
    setActiveSection('Contact')
  }

  const handleOpenServices = () => {
    setActiveSection('Services')
  }

  const handleVirtualTourFromHome = () => {
    setTourStepIndex(0)
    setIsTourOpen(true)
    setActiveSection('Home')
  }

  const handleTourNext = () => {
    if (tourStepIndex >= tourSteps.length - 1) {
      setIsTourOpen(false)
      return
    }

    setTourStepIndex((prev) => prev + 1)
  }

  const handleTourPrev = () => {
    setTourStepIndex((prev) => Math.max(0, prev - 1))
  }

  const handleTourClose = () => {
    setIsTourOpen(false)
  }

  return (
    <>
      {showPublicHeader && (
        <Header
          active={activeSection}
          onNavClick={handleNavClick}
          isSignedIn={isSignedIn}
          isAdminSignedIn={isAdminSignedIn}
          isRegistered={isRegistered}
          onPatientLogin={handlePatientLogin}
          onOpenSignIn={handleOpenSignIn}
          onLogout={handleLogout}
          sections={availableSections}
        />
      )}
      {showToast && (
        <div className="app-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
      <TourOverlay
        open={isTourOpen}
        step={tourSteps[tourStepIndex]}
        stepIndex={tourStepIndex}
        totalSteps={tourSteps.length}
        onNext={handleTourNext}
        onPrev={handleTourPrev}
        onClose={handleTourClose}
      />
      <Pages
        activeSection={activeSection}
        isSignedIn={isSignedIn}
        isAdminSignedIn={isAdminSignedIn}
        isRegistered={isRegistered}
        onRegister={handleRegister}
        onOpenSignIn={handleOpenSignIn}
        onOpenRegister={handleOpenRegister}
        onSignIn={handleSignIn}
        currentUser={currentUser}
        onLogout={handleLogout}
        onBookAppointmentFromHome={handleBookAppointmentFromHome}
        onContactFromHome={handleContactFromHome}
        onVirtualTourFromHome={handleVirtualTourFromHome}
        onOpenServices={handleOpenServices}
      />
      {showPublicHeader && <Footer activeSection={activeSection} />}
    </>
  )
}

export default App
