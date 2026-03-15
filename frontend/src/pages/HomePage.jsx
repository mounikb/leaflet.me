import React from 'react';
import Hero from '../components/Hero';

export default function HomePage({ onAuthClick }) {
  return <Hero onAuthClick={onAuthClick} />;
}