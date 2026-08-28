import React from 'react';
import {
  Store,
  Crown,
  Sparkles,
  Package,
  Rocket,
  Shield,
  Layers,
} from 'lucide-react';

interface BrandLogoProps {
  logoType?: 'preset' | 'custom';
  logoPreset?: string;
  logoUrl?: string;
  storeName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textColor?: string;
  subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoType = 'preset',
  logoPreset = 'averion_triangle',
  logoUrl,
  storeName = 'Averion',
  size = 'md',
  className = '',
  showText = false,
  textColor = 'text-white',
  subtitle,
}) => {
  const sizeMap = {
    xs: { box: 'w-6 h-6 rounded-md', icon: 'w-3 h-3', img: 'w-6 h-6 rounded-md', text: 'text-xs' },
    sm: { box: 'w-7 h-7 rounded-lg', icon: 'w-3.5 h-3.5', img: 'w-7 h-7 rounded-lg', text: 'text-sm' },
    md: { box: 'w-9 h-9 rounded-xl', icon: 'w-4.5 h-4.5', img: 'w-9 h-9 rounded-xl', text: 'text-base' },
    lg: { box: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6', img: 'w-12 h-12 rounded-2xl', text: 'text-lg' },
    xl: { box: 'w-16 h-16 rounded-3xl', icon: 'w-8 h-8', img: 'w-16 h-16 rounded-3xl', text: 'text-xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const renderIcon = () => {
    // If custom image is set and valid
    if (logoType === 'custom' && logoUrl && logoUrl.trim().length > 0) {
      return (
        <img
          src={logoUrl}
          alt={storeName}
          className={`${currentSize.img} object-cover border border-emerald-500/30 shadow-md ${className}`}
          onError={(e) => {
            // fallback if custom image fails to load
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    // Presets
    switch (logoPreset) {
      case 'diamond':
        return (
          <div
            className={`${currentSize.box} bg-gradient-to-tr from-[#00A876] to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-[#00A876]/30 ${className}`}
          >
            <div className="w-3.5 h-3.5 bg-white rotate-45 rounded-xs" />
          </div>
        );
      case 'hexagon':
        return (
          <div
            className={`${currentSize.box} bg-[#00A876] flex items-center justify-center text-white shadow-lg shadow-[#00A876]/30 ${className}`}
          >
            <Shield className={currentSize.icon} />
          </div>
        );
      case 'store':
        return (
          <div
            className={`${currentSize.box} bg-[#00A876] flex items-center justify-center text-white shadow-lg shadow-[#00A876]/30 ${className}`}
          >
            <Store className={currentSize.icon} />
          </div>
        );
      case 'crown':
        return (
          <div
            className={`${currentSize.box} bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 ${className}`}
          >
            <Crown className={currentSize.icon} />
          </div>
        );
      case 'sparkle':
        return (
          <div
            className={`${currentSize.box} bg-gradient-to-br from-[#00A876] to-teal-600 flex items-center justify-center text-white shadow-lg shadow-[#00A876]/30 ${className}`}
          >
            <Sparkles className={currentSize.icon} />
          </div>
        );
      case 'box':
        return (
          <div
            className={`${currentSize.box} bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ${className}`}
          >
            <Package className={currentSize.icon} />
          </div>
        );
      case 'rocket':
        return (
          <div
            className={`${currentSize.box} bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30 ${className}`}
          >
            <Rocket className={currentSize.icon} />
          </div>
        );
      case 'averion_triangle':
      default:
        return (
          <div
            className={`${currentSize.box} bg-[#00A876] flex items-center justify-center text-white shadow-lg shadow-[#00A876]/30 ${className}`}
          >
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-white" />
          </div>
        );
    }
  };

  if (!showText) {
    return renderIcon();
  }

  return (
    <div className="flex items-center gap-3">
      {renderIcon()}
      <div className="min-w-0">
        <h1 className={`${currentSize.text} font-black tracking-tight ${textColor} leading-tight flex items-center gap-1.5`}>
          <span className="truncate">{storeName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00A876] shrink-0" />
        </h1>
        {subtitle && (
          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
