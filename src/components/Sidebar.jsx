import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

import logoImage from '../assets/images/Barre-logo.png'

function Sidebar() {
  const location = useLocation()
  const [logoError, setLogoError] = useState(false)

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname === path
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-placeholder">
            {logoImage && !logoError ? (
              <img 
                src={logoImage} 
                alt="Barre with Sarah" 
                className="logo-image"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="logo-circle">
                <span className="logo-text">Barre</span>
                <span className="logo-subtext">WITH SARAH</span>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
          >
            <i className="fa-solid fa-rectangles-mixed nav-icon"></i>
            <span className="nav-text">Overview</span>
          </Link>

          <Link
            to="/classes"
            className={`nav-item ${isActive('/classes') ? 'active' : ''}`}
          >
            <i className="fa-solid fa-person-meditating nav-icon"></i>
            <span className="nav-text">Classes</span>
          </Link>

          <Link
            to="/ladies"
            className={`nav-item ${isActive('/ladies') ? 'active' : ''}`}
          >
            <i className="fa-solid fa-rectangle-list nav-icon"></i>
            <span className="nav-text">Girlies</span>
          </Link>

          <Link
            to="/payments"
            className={`nav-item ${isActive('/payments') ? 'active' : ''}`}
          >
            <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="30" height="30">
              <path fill="currentColor" d="M120 112C97.9 112 80 129.9 80 152L80 232C80 245.3 69.3 256 56 256C42.7 256 32 245.3 32 232L32 152C32 103.4 71.4 64 120 64L520 64C568.6 64 608 103.4 608 152L608 232C608 245.3 597.3 256 584 256C570.7 256 560 245.3 560 232L560 152C560 129.9 542.1 112 520 112L120 112zM400 528C400 492.7 428.7 464 464 464L464 160L512 160L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 160L176 160L176 464C211.3 464 240 492.7 240 528L400 528zM416 320C416 373 373 416 320 416C267 416 224 373 224 320C224 267 267 224 320 224C373 224 416 267 416 320z"/>
            </svg>
            <span className="nav-text">Payments</span>
          </Link>
        </nav>

        <div className="sidebar-settings">
          <Link
            to="/settings"
            className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
          >
            <i className="fa-solid fa-cog nav-icon"></i>
            <span className="nav-text">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="mobile-bottom-bar">
        <Link
          to="/"
          className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
        >
          <i className="fa-solid fa-rectangles-mixed mobile-nav-icon"></i>
        </Link>

        <Link
          to="/classes"
          className={`mobile-nav-item ${isActive('/classes') ? 'active' : ''}`}
        >
          <i className="fa-solid fa-person-meditating mobile-nav-icon"></i>
        </Link>

        <Link
          to="/ladies"
          className={`mobile-nav-item ${isActive('/ladies') ? 'active' : ''}`}
        >
          <i className="fa-solid fa-rectangle-list mobile-nav-icon"></i>
        </Link>

        <Link
          to="/payments"
          className={`mobile-nav-item ${isActive('/payments') ? 'active' : ''}`}
        >
          <svg className="mobile-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="24" height="24">
            <path fill="currentColor" d="M120 112C97.9 112 80 129.9 80 152L80 232C80 245.3 69.3 256 56 256C42.7 256 32 245.3 32 232L32 152C32 103.4 71.4 64 120 64L520 64C568.6 64 608 103.4 608 152L608 232C608 245.3 597.3 256 584 256C570.7 256 560 245.3 560 232L560 152C560 129.9 542.1 112 520 112L120 112zM400 528C400 492.7 428.7 464 464 464L464 160L512 160L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 160L176 160L176 464C211.3 464 240 492.7 240 528L400 528zM416 320C416 373 373 416 320 416C267 416 224 373 224 320C224 267 267 224 320 224C373 224 416 267 416 320z"/>
          </svg>
        </Link>

        <Link
          to="/settings"
          className={`mobile-nav-item ${isActive('/settings') ? 'active' : ''}`}
        >
          <i className="fa-solid fa-cog mobile-nav-icon"></i>
        </Link>
      </nav>
    </>
  )
}

export default Sidebar
