import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export default function AreaInput({ value, onChange, placeholder = "क्षेत्र दर्ज करें...", error }) {
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);

  // Fetch unique areas
  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data } = await api.get('/donors/areas');
      return data;
    },
    staleTime: 5 * 60 * 1000, 
  });

  useEffect(() => {
    if (areas && value) {
      setSuggestions(
        areas.filter(a => a.toLowerCase().includes(value.toLowerCase()) && a !== value).slice(0, 5)
      );
    } else {
      setSuggestions(areas ? areas.slice(0, 5) : []);
    }
  }, [value, areas]);

  const handleSelect = (area) => {
    onChange(area);
    setFocused(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-dargah-green/30 ${error ? 'border-red-300' : 'border-slate-300'}`}
        autoComplete="off"
      />
      {error && <p className="text-sm text-red-500 mt-1">{error.message || error}</p>}

      {focused && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden max-h-48 overflow-y-auto">
          {suggestions.map((area, i) => (
            <div
              key={i}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(area);
              }}
              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
            >
              {area}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
