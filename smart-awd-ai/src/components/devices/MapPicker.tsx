"use client";

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

interface Place {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

export default function MapPicker({ 
  lat, 
  lng, 
  onChange 
}: { 
  lat: number, 
  lng: number, 
  onChange: (lat: number, lng: number) => void 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // To prevent re-fetching when user clicks a suggestion
  const selectedRef = useRef(false);

  // Default to Indonesia center if empty/0
  const validLat = lat || -2.5489;
  const validLng = lng || 118.0149;
  const position: [number, number] = [validLat, validLng];

  // Debounce Search Effect
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`, {
          headers: { 'Accept-Language': 'id' }
        });
        const data = await res.json();
        setSuggestions(data || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Gagal mengambil saran lokasi", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (place: Place) => {
    selectedRef.current = true;
    setSearchQuery(place.display_name);
    setShowDropdown(false);
    onChange(parseFloat(place.lat), parseFloat(place.lon));
  };

  return (
    <div className="space-y-3 relative">
      <div className="relative z-20">
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Cari lokasi (Ketik lalu tunggu sebentar...)"
          className="w-full px-4 py-2 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-lg text-[var(--text-primary)] focus:border-blue-500 outline-none text-sm"
        />
        
        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute right-3 top-2.5">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--bg-glass-border)] rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
            {suggestions.map((place) => (
              <div 
                key={place.place_id}
                onClick={() => handleSelectSuggestion(place)}
                className="px-4 py-3 hover:bg-[var(--bg-card-hover)] cursor-pointer border-b border-[var(--bg-glass-border)] last:border-b-0"
              >
                <div className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">{place.display_name.split(',')[0]}</div>
                <div className="text-xs text-[var(--text-secondary)] line-clamp-1">{place.display_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-[250px] w-full rounded-xl overflow-hidden border border-[var(--bg-glass-border)] z-0 relative">
        <MapContainer center={position} zoom={lat && lng ? 13 : 5} style={{ height: '100%', width: '100%', zIndex: 1 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={(pos) => onChange(pos[0], pos[1])} />
          <MapUpdater center={position} />
        </MapContainer>
      </div>
      <p className="text-xs text-[var(--text-muted)] text-center">
        Klik pada peta untuk mengatur pin koordinat secara manual.
      </p>
    </div>
  );
}
