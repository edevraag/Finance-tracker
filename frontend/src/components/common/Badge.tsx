import React from 'react';

interface BadgeProps {
  color?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ color = '#10b981', children }) => {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </span>
  );
};
