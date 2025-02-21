/**
 * Map utility functions
 */

/**
 * Opens a location in Google Maps
 * @param name - The name or description of the location
 * @param coordinates - The coordinates in "latitude,longitude" format
 * @param zoom - Optional zoom level (default: 17)
 */
export const openMapUrl = (
  name: string,
  coordinates: string,
  zoom: number = 17
) => {
  if (!coordinates) return;

  const [lat, lng] = coordinates.split(",");
  if (!lat || !lng) {
    console.error("Invalid coordinates format. Expected 'latitude,longitude'");
    return;
  }

  const encodedName = encodeURIComponent(name);
  const mapsUrl = `https://www.google.com/maps/search/${encodedName}/@${lat},${lng},${zoom}z`;

  window.open(mapsUrl, "_blank");
};

export const mapUtils = {
  openMapUrl,
};

export default mapUtils;
