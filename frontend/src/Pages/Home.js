import React from "react";
import { useNavigate, Link } from "react-router-dom";
import backgroundImage from '../assets/myznik-egor-R6jqskUqZYI-unsplash.jpg';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    const heroStyle = {
        background: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${backgroundImage}) no-repeat center center`,
        backgroundSize: 'cover'
    };

    return (
        <div className="home-container">
            <div className="hero-section" style={heroStyle}>
                <div className="hero-content">
                    <h1>Your Voice. Your Words. Connected.</h1>
                    <p>Convert speech to text and text to speech to lifelike speech using AI</p>
                    <div className="hero-buttons">
                        <button className="btn-primary">Get Started</button>
                    </div>
                </div>
            </div>

            <section className="features-section">
                <h2>Explore Features</h2>
                <div className="feature-buttons">
                    <Link to="/text-to-speech" className="feature-btn feature-btn-filled">
                        <span className="btn-text">Try Text to Speech</span>
                    </Link>
                    <Link to="/speech-to-text" className="feature-btn feature-btn-outline">
                        <span className="btn-text">Try Speech to Text</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default Home;