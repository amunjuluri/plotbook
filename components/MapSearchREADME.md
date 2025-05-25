# MapSearch Component - Enhanced with Multiple Pins Support

A powerful, responsive React component for interactive map search with multiple pin management, built with Mapbox GL JS and shadcn/ui components.

## ✨ Features

### 🎯 **Core Functionality**
- **Multiple Pin Support**: Add, manage, and interact with multiple pins on the map
- **Search Integration**: Search for locations using Mapbox Geocoding API
- **Responsive Design**: Optimized for mobile and desktop experiences
- **Programmatic Pin Addition**: Add pins via coordinates programmatically
- **Interactive Markers**: Click markers to select and focus on locations

### 🎨 **User Interface**
- **Dropdown Menus**: Advanced pin management with shadcn dropdown components
- **Pin Management Panel**: View, select, and remove pins with intuitive UI
- **Map Style Toggle**: Switch between satellite and standard map views
- **Smooth Animations**: Framer Motion powered animations for better UX
- **Color-coded Pins**: Custom colors for different pin types

### 📱 **Responsive Features**
- **Mobile-First Design**: Optimized touch interactions and responsive layouts
- **Adaptive UI**: Different layouts for mobile and desktop
- **Touch-Friendly**: Large touch targets and gesture support

## 🚀 Installation

```bash
# Install required dependencies
npm install mapbox-gl framer-motion

# Install shadcn/ui components
npx shadcn@latest add button input select dropdown-menu label
```

## 📋 Props Interface

```typescript
interface MapSearchProps {
  // Location callbacks
  onLocationSelect?: (location: PropertyLocation) => void;
  onLocationsChange?: (locations: PropertyLocation[]) => void;
  
  // Initial data
  initialLocation?: PropertyLocation;
  initialLocations?: PropertyLocation[];
  
  // Configuration
  allowMultiple?: boolean; // Default: true
  maxPins?: number; // Default: 10
  
  // Programmatic control
  onAddPin?: (addPinFunction: (lat: number, lng: number, address?: string, color?: string) => void) => void;
}

interface PropertyLocation {
  id?: string;
  latitude: number;
  longitude: number;
  address?: string;
  color?: string; // Hex color for the pin
}
```

## 🎯 Usage Examples

### 1. Basic Multiple Pins Setup

```tsx
import { MapSearch, PropertyLocation } from './components/MapSearch';

function App() {
  const [locations, setLocations] = useState<PropertyLocation[]>([]);

  return (
    <MapSearch
      onLocationsChange={setLocations}
      allowMultiple={true}
      maxPins={10}
    />
  );
}
```

### 2. Programmatic Pin Addition

```tsx
function ProgrammaticExample() {
  const addPinRef = useRef<((lat: number, lng: number, address?: string, color?: string) => void) | null>(null);

  const addCustomPin = () => {
    if (addPinRef.current) {
      addPinRef.current(40.7128, -74.0060, 'New York City', '#FF6B6B');
    }
  };

  return (
    <div>
      <MapSearch
        onAddPin={(addPinFunction) => { addPinRef.current = addPinFunction; }}
        onLocationsChange={(locations) => console.log('Updated:', locations)}
      />
      <button onClick={addCustomPin}>Add NYC Pin</button>
    </div>
  );
}
```

### 3. With Initial Locations

```tsx
const initialPins: PropertyLocation[] = [
  {
    id: 'nyc',
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'New York City',
    color: '#FF6B6B'
  },
  {
    id: 'la',
    latitude: 34.0522,
    longitude: -118.2437,
    address: 'Los Angeles',
    color: '#4ECDC4'
  }
];

<MapSearch
  initialLocations={initialPins}
  onLocationsChange={(locations) => console.log('Updated:', locations)}
  maxPins={5}
/>
```

### 4. Single Pin Mode (Original Behavior)

```tsx
<MapSearch
  onLocationSelect={(location) => console.log('Selected:', location)}
  allowMultiple={false}
/>
```

## 🎮 Interactive Features

### Pin Management Dropdown
- **Fit All Pins**: Automatically adjust map view to show all pins
- **Remove All Pins**: Clear all pins from the map
- **Individual Pin Actions**: Focus on specific pins or remove them

### Pin Panel Features
- **Click to Focus**: Click any pin in the list to center the map on it
- **Visual Indicators**: Color-coded pins with selection states
- **Responsive Layout**: Adapts to screen size and pin count

### Search Functionality
- **Address Search**: Search by street address, city, or landmark
- **Owner Search**: Search by property owner (placeholder for future implementation)
- **Property Characteristics**: Search by property features (placeholder)

## 🎨 Customization

### Pin Colors
```tsx
// Add pins with custom colors
addPin(lat, lng, address, '#FF6B6B'); // Red pin
addPin(lat, lng, address, '#4ECDC4'); // Teal pin
addPin(lat, lng, address, '#45B7D1'); // Blue pin
```

### Map Styles
- **Satellite View**: High-resolution satellite imagery
- **Standard View**: Clean street map with labels
- **Toggle Button**: Easy switching between views

### Responsive Breakpoints
- **Mobile**: Optimized for touch interactions
- **Tablet**: Balanced layout for medium screens
- **Desktop**: Full feature set with hover states

## 🔧 Advanced Configuration

### Maximum Pins Limit
```tsx
<MapSearch maxPins={5} /> // Limit to 5 pins
```

### Custom Pin Validation
```tsx
const addPinWithValidation = (lat: number, lng: number) => {
  if (lat < -90 || lat > 90) {
    alert('Invalid latitude');
    return;
  }
  if (lng < -180 || lng > 180) {
    alert('Invalid longitude');
    return;
  }
  addPin(lat, lng);
};
```

## 🎯 Best Practices

### Performance
- **Efficient Rendering**: Uses React refs for map instance management
- **Optimized Updates**: Minimal re-renders with proper dependency arrays
- **Memory Management**: Proper cleanup of map resources

### User Experience
- **Loading States**: Visual feedback during search operations
- **Error Handling**: Graceful handling of geocoding failures
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Data Management
- **Unique IDs**: Automatic generation of unique pin identifiers
- **State Synchronization**: Consistent state between map and UI components
- **Callback Patterns**: Clear separation of concerns with callback props

## 🐛 Troubleshooting

### Common Issues

1. **Map not loading**: Check Mapbox access token
2. **Pins not appearing**: Verify latitude/longitude values are valid
3. **Dropdown not working**: Ensure shadcn dropdown-menu is installed
4. **Responsive issues**: Check CSS classes and viewport meta tag

### Debug Mode
```tsx
// Enable console logging for debugging
<MapSearch
  onLocationsChange={(locations) => {
    console.log('Locations updated:', locations);
    setLocations(locations);
  }}
/>
```

## 🔮 Future Enhancements

- **Clustering**: Group nearby pins for better performance
- **Custom Pin Icons**: Support for custom marker designs
- **Drawing Tools**: Add shapes and polygons to the map
- **Export/Import**: Save and load pin configurations
- **Real-time Updates**: WebSocket support for live pin updates

## 📄 License

This component is part of the PlotBook project and follows the project's licensing terms. 