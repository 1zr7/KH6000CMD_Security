import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
    return (
        <div className="w-full h-screen flex flex-col bg-black">
            {/* Top Section - Video Background (approx 55% height) */}
            <div className="relative w-full h-[55%] overflow-hidden">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                >
                    <source src="/ani_bg.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Bottom Section - Content (approx 45% height) */}
            <div className="relative w-full h-[45%] bg-black flex items-center px-6 md:px-12">
                <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-8">

                    {/* Main Slogan - Left Aligned, Uppercase, Bold */}
                    <div className="flex-1">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tighter leading-[0.9] uppercase">
                            Securing <br />
                            What Matters: <br />
                            <span className="text-brand-green">Your Health.</span>
                        </h1>
                    </div>

                    {/* CTA / Right Side */}
                    <div className="flex-shrink-0 flex flex-col items-start md:items-end gap-6">
                        <Link
                            to="/register"
                            className="group flex items-center gap-2 px-8 py-4 border border-gray-600 rounded-full text-white hover:bg-white hover:text-black transition-all duration-300"
                        >
                            <span className="font-medium">Get Started</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                </div>

                {/* Decorative footer line/text similar to image */}
                <div className="absolute bottom-6 left-6 md:left-12 text-gray-600 text-sm font-mono">
                    2025 HEALTHCARE ALPHA // SECURE PORTAL
                </div>
            </div>
        </div>
    );
};

export default Hero;
