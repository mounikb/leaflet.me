import React from 'react';
import Hero from '../components/Hero';

export default function HomePage({ onAuthClick, onDiscoverClick, planting }) {
  return <Hero onAuthClick={onAuthClick} onDiscoverClick={onDiscoverClick} planting={planting} />;
}