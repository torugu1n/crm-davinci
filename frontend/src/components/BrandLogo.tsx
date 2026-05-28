'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { getLogoUrl } from '@/lib/logo-helper';

interface BrandLogoProps {
  subtitle?: string;
  byline?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  textSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconSizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-lg',
};

export default function BrandLogo({
  subtitle = 'Plataforma para negócios de beleza',
  byline,
  iconSize = 'md',
  textSize = 'md',
  className = '',
}: BrandLogoProps) {
  const tenant = useStore((state) => state.tenant);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [tenant?.logoUrl]);

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div
        className={`${iconSizeClasses[iconSize]} rounded-2xl bg-[linear-gradient(145deg,rgba(197,168,128,0.18),rgba(255,255,255,0.98))] border border-davinci-gold/25 shadow-[0_18px_35px_rgba(197,168,128,0.12)] flex items-center justify-center backdrop-blur-sm overflow-hidden p-0.5`}
      >
        {tenant?.logoUrl && !logoFailed ? (
          <img 
            src={getLogoUrl(tenant.logoUrl)} 
            alt={tenant.name || 'Logo'} 
            className="w-full h-full object-contain rounded-xl"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <svg
            viewBox="0 0 64 64"
            aria-hidden="true"
            className="h-[72%] w-[72%]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="6" y="6" width="52" height="52" rx="18" fill="url(#bgGlow)" />
            <path
              d="M17 18C17 14.6863 19.6863 12 23 12H29C35.6274 12 41 17.3726 41 24V25C41 31.6274 35.6274 37 29 37H23C19.6863 37 17 34.3137 17 31V18Z"
              fill="url(#goldPrimary)"
            />
            <path
              d="M32.5 13.5C34.4 18.2 37.2 22 40.9 25.2L46.5 30L42.4 34.4L37.3 29.8C35.2 27.9 33.4 25.8 31.9 23.5L32.5 13.5Z"
              fill="url(#goldSecondary)"
            />
            <path
              d="M33.2 22.8L41.5 31.1"
              stroke="#FDF9F1"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M41.9 18.6C43.7 18.6 45.1 20 45.1 21.8C45.1 23.6 43.7 25 41.9 25C40.1 25 38.7 23.6 38.7 21.8C38.7 20 40.1 18.6 41.9 18.6Z"
              fill="#FDF9F1"
            />
            <path
              d="M46.2 33.7C48 33.7 49.4 35.1 49.4 36.9C49.4 38.7 48 40.1 46.2 40.1C44.4 40.1 43 38.7 43 36.9C43 35.1 44.4 33.7 46.2 33.7Z"
              fill="#FDF9F1"
            />
            <path
              d="M34 39.5C38.6 37.7 42.7 34.8 46.1 30.7"
              stroke="#A97D48"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path
              d="M21.4 18.8C23.6 17.3 26.1 16.6 28.7 16.7C32.8 16.8 35.8 18.9 37.7 23"
              stroke="#FDF9F1"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M21.4 24.3C23.6 22.8 26.1 22.1 28.7 22.2C32.8 22.3 35.8 24.4 37.7 28.5"
              stroke="#FDF9F1"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M21.4 29.8C23.6 28.3 26.1 27.6 28.7 27.7C31.9 27.8 34.4 29 36.3 31.5"
              stroke="#FDF9F1"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M16 44C23.8 44 31.4 47.1 36.9 52.6"
              stroke="#111111"
              strokeOpacity="0.12"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="18.5" cy="42.5" r="1.8" fill="#C5A880" />
            <defs>
              <linearGradient id="goldPrimary" x1="17" y1="12" x2="41" y2="37" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E4CFAD" />
                <stop offset="1" stopColor="#B99158" />
              </linearGradient>
              <linearGradient id="goldSecondary" x1="31.9" y1="13.5" x2="47" y2="34.4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D8BC95" />
                <stop offset="1" stopColor="#8F6536" />
              </linearGradient>
              <linearGradient id="bgGlow" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF7EB" />
                <stop offset="1" stopColor="#F4E4C8" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>

      <div>
        <h2 className={`${textSizeClasses[textSize]} font-bold text-davinci-black uppercase tracking-wider text-glow truncate max-w-[200px]`}>
          {tenant?.name || 'Gestão de Beleza'}
        </h2>
        <p className="text-[8px] text-davinci-gold uppercase tracking-[0.08em] font-semibold">
          {tenant?.name ? 'Estabelecimento Parceiro' : subtitle}
        </p>
        {byline ? <p className="text-[8px] text-davinci-gray uppercase tracking-[0.08em] font-bold mt-1">{byline}</p> : null}
      </div>
    </div>
  );
}
