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
  hideText?: boolean;
  forceTheme?: 'light' | 'dark';
}

const iconSizeClasses = {
  sm: 'h-[48px] w-[48px]', // 12x12 equivalent (48px)
  md: 'h-[64px] w-[64px]', // 16x16 equivalent (64px)
  lg: 'h-[96px] w-[96px]', // 24x24 equivalent (96px)
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-lg',
};

const getLuminance = (hex?: string | null) => {
  if (!hex) return 0;
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length !== 6) return 0.5;
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  const a = [r, g, b].map((v) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

export default function BrandLogo({
  subtitle = 'CRM & Gestão Inteligente',
  byline,
  iconSize = 'md',
  textSize = 'md',
  className = '',
  hideText = false,
  forceTheme,
}: BrandLogoProps) {
  const tenant = useStore((state) => state.tenant);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [tenant?.logoUrl]);

  const isDefaultLogo = !tenant?.logoUrl || logoFailed;
  const containerBgClass = isDefaultLogo
    ? 'bg-transparent border-0 shadow-none'
    : 'bg-[linear-gradient(145deg,rgba(197,168,128,0.18),rgba(255,255,255,0.98))] border border-davinci-gold/25 shadow-[0_18px_35px_rgba(197,168,128,0.12)]';

  const resolvedLight = forceTheme 
    ? forceTheme === 'light' 
    : (tenant?.secondaryColor ? getLuminance(tenant.secondaryColor) > 0.5 : false);
  const textHeadingClass = resolvedLight ? 'text-zinc-900' : 'text-zinc-150';
  const textSubClass = resolvedLight ? 'text-zinc-500' : 'text-zinc-400';

  const primaryColor = tenant?.primaryColor || '#C5A880';
  const secondaryColor = tenant?.secondaryColor || '#7C3AED';
  const initials = tenant?.name ? tenant.name.trim().charAt(0).toUpperCase() : 'V';

  const isVenusta = !tenant || tenant.subdomain === 'venusta';

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      {/* Hide the default logo container for Venusta */}
      {!(isVenusta && isDefaultLogo) && (
        <div
          className={`${iconSizeClasses[iconSize]} rounded-2xl flex items-center justify-center backdrop-blur-sm overflow-hidden p-0.5 ${containerBgClass}`}
        >
          {!isDefaultLogo ? (
            <img
              src={getLogoUrl(tenant!.logoUrl!)}
              alt={tenant!.name || 'Logo'}
              className="w-full h-full object-contain rounded-xl"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div
              style={{
                background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`
              }}
              className="w-full h-full rounded-xl flex items-center justify-center font-bold text-xl text-white font-display select-none"
            >
              {initials}
            </div>
          )}
        </div>
      )}

      {!hideText && (
        <div>
          <h2 className={`${textSizeClasses[textSize]} font-bold ${textHeadingClass} uppercase tracking-wider text-glow truncate max-w-[200px]`}>
            {isVenusta ? 'Venusta' : tenant.name}
          </h2>
          <p className={`text-[8px] uppercase tracking-[0.08em] font-semibold ${textSubClass}`}>
            {isVenusta ? subtitle : 'Estabelecimento Parceiro'}
          </p>
          {byline ? <p className="text-[8px] text-zinc-500 uppercase tracking-[0.08em] font-bold mt-1">{byline}</p> : null}
        </div>
      )}
    </div>
  );
}
