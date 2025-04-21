import math
import json

def generate_ring(center_lat, center_lng, radius_meters, num_points):
  earth_radius = 6371000
  coords = []
  for i in range(num_points):
    angle = (i / num_points) * 2 * math.pi
    dx = radius_meters * math.cos(angle)
    dy = radius_meters * math.sin(angle)
    lat = center_lat + (dy / earth_radius) * (180 / math.pi)
    lng = center_lng + (dx / (earth_radius * math.cos(math.radians(center_lat)))) * (180 / math.pi)
    coords.append([lng, lat])
  coords.append(coords[0])
  return coords

center = (51.5074, -0.1278)
print(json.dumps({
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
          "type": "Polygon",
          "coordinates": [
            generate_ring(*center, 50, 10),
            list(reversed(generate_ring(*center, 40, 9)))
          ]
      }
    },
    {
      "type": "Feature",
      "geometry": {
          "type": "Polygon",
          "coordinates": [
            generate_ring(*center, 40, 9),
            list(reversed(generate_ring(*center, 30, 8)))
          ]
      }
    },
    {
      "type": "Feature",
      "geometry": {
          "type": "Polygon",
          "coordinates": [
            generate_ring(*center, 30, 8)
          ]
      }
    }
  ]
}))