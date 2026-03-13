import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

const defaultCenter = [40.7128, -74.006]

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function MapWidget({
  locations = [],
  center = defaultCenter,
  zoom = 11,
  tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution = '&copy; OpenStreetMap contributors',
}) {
  return (
    <div className="relative z-0 h-80 w-full overflow-hidden rounded-2xl border border-border/70 shadow-sm">
      <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom>
        <TileLayer url={tileUrl} attribution={attribution} />

        {locations.map((location, index) => (
          <Marker key={`${location.title}-${index}`} position={[location.lat, location.lng]}>
            <Popup>
              <p className="text-sm font-medium">{location.title}</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default MapWidget