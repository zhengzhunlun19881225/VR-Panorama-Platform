import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  id?: string;
  className?: string;
  showText?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  id = 'btn-theme-toggle',
  className = '',
  showText = true
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      id={id}
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer select-none ${
        isDark
          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 shadow-sm hover:border-zinc-600'
          : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-sm hover:border-zinc-300'
      } ${className}`}
      title={isDark ? '切换到浅色皮肤' : '切换到深色皮肤'}
      aria-label={isDark ? '切换到浅色皮肤' : '切换到深色皮肤'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-sky-600 transition-transform duration-300 -rotate-12 hover:rotate-0" />
        )}
      </div>

      {showText && (
        <span className="font-medium tracking-wide whitespace-nowrap">
          {isDark ? '切换浅色' : '切换深色'}
        </span>
      )}
    </button>
  );
};
