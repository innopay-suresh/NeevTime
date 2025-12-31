import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
    const { theme, toggleTheme, isDark } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${className}`}
            style={{
                backgroundColor: isDark ? '#1E293B' : '#FFF7ED',
                color: isDark ? '#FBBF24' : '#F97316'
            }}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {isDark ? (
                <Sun size={20} className="animate-spin-slow" />
            ) : (
                <Moon size={20} />
            )}
        </button>
    );
}

