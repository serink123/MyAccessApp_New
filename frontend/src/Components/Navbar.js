import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (!isMobile) {
                setIsOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar__logo">MyAccess</div>
            <button 
                className="navbar__hamburger" 
                onClick={toggleMenu}
                aria-expanded={isOpen}
                aria-label="Toggle navigation menu"
            >
                {isOpen ? '✕' : '☰'}
            </button>
            <ul className={`navbar__links ${isOpen ? 'active' : ''}`}>
                <li><Link to="/" onClick={() => isMobile && setIsOpen(false)}>Features</Link></li>
                <li><Link to="/speech-to-text" onClick={() => isMobile && setIsOpen(false)}>Speech to Text</Link></li>
                <li><Link to="/text-to-speech" onClick={() => isMobile && setIsOpen(false)}>Text to Speech</Link></li>
                <li><Link to="/voice-assistant" onClick={() => isMobile && setIsOpen(false)}>Voice Assistant</Link></li>
                <li><Link to="#" onClick={() => isMobile && setIsOpen(false)}>About</Link></li>
                <li><Link to="#" onClick={() => isMobile && setIsOpen(false)}>Contact</Link></li>
            </ul>
        </nav>
    );
};

export default Navbar;