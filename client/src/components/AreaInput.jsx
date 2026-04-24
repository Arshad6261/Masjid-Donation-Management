import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useDebounce } from 'use-debounce';
import { MapPin } from 'lucide-react';

export default function AreaInput({ value, onChange, placeholder = "क्षेत्र दर्ज करें...", error }) {
  const [focused, setFocused] = useState(false);
  const [debouncedValue] = useDebounce(value, 300);
  const inputRef = useRef(null);
  const [rect, setRect] = useState(null);

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas', debouncedValue],
    queryFn: async () => {
      const { data } = await api.get(`/donors/areas?q=${debouncedValue || ''}`);
      return data;
    },
  });

  const updateRect = () => {
    if (inputRef.current) {
      setRect(inputRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    if (focused) {
      updateRect();
      window.addEventListener('scroll', updateRect, true);
      window.addEventListener('resize', updateRect);
    }
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [focused]);

  const handleSelect = (areaName) => {
    onChange(areaName);
    setFocused(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-dargah-green/30 ${error ? 'border-red-300' : 'border-slate-200'} bg-white`}
        autoComplete="off"
      />
      {error && <p className="text-sm text-red-500 mt-1">{error.message || error}</p>}

      {focused && rect && createPortal(
        <div 
          className="fixed z-[99999] bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden max-h-56 overflow-y-auto"
          style={{
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          }}
        >
          {isLoading && <div className="p-3 text-sm text-slate-500">खोज रहा है...</div>}
          {!isLoading && areas?.length === 0 && (
             <div 
               onMouseDown={(e) => { e.preventDefault(); handleSelect(value); }}
               className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
             >
               नया क्षेत्र: <strong>{value}</strong>
             </div>
          )}
          {!isLoading && areas?.map((area, i) => (
            <div
              key={i}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(area.name);
              }}
              className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm flex items-center justify-between border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <MapPin className="w-4 h-4 text-slate-400" />
                {area.name}
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                {area.count}
              </span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
