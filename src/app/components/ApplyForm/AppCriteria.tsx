"use client"

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import pattern from "../../../../public/pattern.png";

export const AppCriteria = () => {
  const [isMuted, setIsMuted] = useState(true);

  const titleRef = useRef(null);
  const paragraphRef = useRef(null);
  const additionalTextRef = useRef(null);
  const logoRef = useRef(null);
  const animatedTextRef = useRef(null);

  const toggleSound = () => {
    setIsMuted((prev) => !prev);
  };

  // GSAP Animations on load
  useEffect(() => {
    // Animating with stagger for title and paragraph
    gsap.fromTo(
      [titleRef.current, paragraphRef.current, additionalTextRef.current, logoRef.current],
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        stagger: 0.4, // delay between animations of each element
        duration: 1.5,
        ease: 'power4.out',
      }
    );

    // Typewriter effect for "KREJT BASHKE N'SHESH" text with repeat
    gsap.fromTo(
      animatedTextRef.current,
      {
        opacity: 0,
        width: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      },
      {
        opacity: 1,
        width: '100%',
        duration: 3, // total duration for the typing effect
        ease: 'steps(30)', // typewriter effect with steps
        delay: 1.5, // delay before the animation starts
        repeat: -1, // repeats infinitely
        repeatDelay: 5, // delay between repetitions (5000ms)
      }
    );
  }, []);

  return (
    <div className="relative min-h-screen bg-[#031603] flex justify-center items-center">
      {/* Fullscreen Video */}
      <video
        src="/FINAL WIDE (1).mp4"
        playsInline
        autoPlay
        loop
        muted={isMuted}
        className="absolute inset-0 w-full h-full object-cover"
      >
        Your browser does not support the video tag.
      </video>

      {/* Voice Toggle Button */}
      <button
        onClick={toggleSound}
        className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-lg focus:outline-none hover:bg-gray-200 transition ease-in-out z-10"
        aria-label="Toggle Sound"
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {/* Overlay Content */}
      <div className="relative z-10 bg-white rounded-lg shadow-lg p-8 space-y-8 max-w-4xl">
        {/* Logo */}
        <div ref={logoRef}>
          <div ref={animatedTextRef} className="text-2xl lg:text-6xl font-bold text-[#EF5B13] text-center pt-8">
            KREJT BASHKË N&rsquo;SHESH!
          </div>
        </div>

        {/* Main Message */}
        <h1
          ref={titleRef}
          className="text-xl lg:text-xl font-bold text-[#031603] text-center"
        >
          Aplikimet për shtëpizat për tregun e fundvitit <b className='uppercase'>&quot;Akull n&rsquo;Verë&quot;</b> janë mbyllur.
        </h1>

        {/* Thank You */}
        <p
          ref={paragraphRef}
          className="text-gray-700 text-lg lg:text-xl font-medium lg:w-1/2 mx-auto text-center"
        >
          Faleminderit për interesimin e jashtëzakonshëm që keni treguar për të qenë pjesë e festës sonë të përbashkët.
        </p>

        {/* Additional Information */}
        <p
          ref={additionalTextRef}
          className="text-gray-700 text-sm text-center"
        >
          Për më shumë informacione dhe detaje të tjera, ju ftojmë të ndiqni njoftimet tona përmes kanaleve tona zyrtare.
        </p>

        {/* Animated Text */}
        <Image
            src={pattern}
            alt="Logo"
            className="object-contain mx-auto h-24"
          />
      </div>
    </div>
  );
};
