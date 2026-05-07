import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const DeepfakeIcon: React.FC<IconProps> = ({ className, size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="mask1" x1="50" y1="50" x2="150" y2="150" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient id="mask2" x1="80" y1="80" x2="180" y2="180" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FBBF24" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
      <filter id="shadow" x="0" y="0" width="200" height="200" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="5" />
      </filter>
    </defs>
    {/* Mask 1 (Back) */}
    <path d="M40 80C40 60 60 40 100 40C140 40 160 60 160 80C160 110 140 140 100 140C60 140 40 110 40 80Z" fill="url(#mask1)" transform="rotate(-15 100 100)" />
    <circle cx="80" cy="80" r="10" fill="white" fillOpacity="0.2" transform="rotate(-15 100 100)" />
    <circle cx="120" cy="80" r="10" fill="white" fillOpacity="0.2" transform="rotate(-15 100 100)" />
    
    {/* Mask 2 (Front) */}
    <path d="M60 100C60 80 80 60 120 60C160 60 180 80 180 100C180 130 160 160 120 160C80 160 60 130 60 100Z" fill="url(#mask2)" transform="rotate(10 120 110)" />
    <circle cx="100" cy="100" r="12" fill="white" fillOpacity="0.3" transform="rotate(10 120 110)" />
    <circle cx="140" cy="100" r="12" fill="white" fillOpacity="0.3" transform="rotate(10 120 110)" />
  </svg>
);

export const AIVoiceIcon: React.FC<IconProps> = ({ className, size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="phoneGrad" x1="60" y1="40" x2="140" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#374151" />
        <stop offset="1" stopColor="#111827" />
      </linearGradient>
    </defs>
    {/* Phone Body */}
    <rect x="60" y="40" width="80" height="120" rx="12" fill="url(#phoneGrad)" />
    <rect x="70" y="50" width="60" height="100" rx="8" fill="#1F2937" />
    
    {/* Waves */}
    <path d="M80 100Q90 80 100 100T120 100" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" />
    <path d="M80 110Q90 90 100 110T120 110" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
    
    {/* Mask Overlay */}
    <path d="M110 110C110 100 125 90 145 90C165 90 180 100 180 110C180 130 165 145 145 145C125 145 110 130 110 110Z" fill="#60A5FA" fillOpacity="0.8" />
  </svg>
);

export const SocialEngineeringIcon: React.FC<IconProps> = ({ className, size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Browser Window */}
    <rect x="40" y="50" width="120" height="90" rx="8" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
    <rect x="40" y="50" width="120" height="20" rx="8" fill="#93C5FD" />
    <circle cx="50" cy="60" r="3" fill="white" />
    <circle cx="60" cy="60" r="3" fill="white" />
    
    {/* User Profile */}
    <circle cx="100" cy="100" r="15" fill="#3B82F6" />
    <path d="M85 125C85 115 115 115 115 125" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" />
    
    {/* Connection Nodes */}
    <circle cx="60" cy="100" r="5" fill="#F59E0B" />
    <circle cx="140" cy="100" r="5" fill="#F59E0B" />
    <circle cx="100" cy="65" r="5" fill="#F59E0B" />
    <circle cx="100" cy="135" r="5" fill="#F59E0B" />
    
    <path d="M100 100L60 100M100 100L140 100M100 100L100 65M100 100L100 135" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 2" />
  </svg>
);

export const EmailPhishingIcon: React.FC<IconProps> = ({ className, size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Envelope */}
    <rect x="50" y="70" width="100" height="60" rx="4" fill="#FEF3C7" stroke="#FBBF24" strokeWidth="2" />
    <path d="M50 70L100 100L150 70" stroke="#FBBF24" strokeWidth="2" />
    
    {/* Hook */}
    <path d="M110 30V90C110 110 130 110 130 90" stroke="#A855F7" strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M130 90L125 85M130 90L135 85" stroke="#A855F7" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export const VoicePhishingIcon: React.FC<IconProps> = ({ className, size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="bubbleGrad" x1="40" y1="60" x2="160" y2="140" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    {/* Speech Bubble */}
    <path d="M40 80C40 60 60 40 100 40C140 40 160 60 160 80C160 100 140 120 100 120C90 120 80 125 70 140C70 130 75 120 80 115C60 110 40 100 40 80Z" fill="url(#bubbleGrad)" />
    
    {/* Sound Waves */}
    <path d="M70 80H85M95 70V90M105 60V100M115 70V90M125 80H130" stroke="white" strokeWidth="4" strokeLinecap="round" />
    
    {/* Exclamation Badge */}
    <circle cx="150" cy="60" r="15" fill="#EF4444" />
    <text x="146" y="67" fill="white" fontWeight="bold" fontSize="20">!</text>
  </svg>
);
