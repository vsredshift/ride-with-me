import { Driver, MarkerData } from "@/types/type";

const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API;

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  )
    return;

  if (!apiKey) throw new Error("Google Maps API key is missing!");

  try {
    const timesPromises = markers.map(async (marker) => {
      // fetch time from marker to user
      const responseToUser = await fetch(
        `https://routes.googleapis.com/directions/v2:computeRoutes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "routes.duration",
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: {
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: userLatitude,
                  longitude: userLongitude,
                },
              },
            },
            travelMode: "Drive",
          }),
        }
      );

      const dataToUser = await responseToUser.json();
      const timeToUser = dataToUser.routes?.[0]?.duration || 0;

      // Fetch time from user to destination
      const responseToDestination = await fetch(
        `https://routes.googleapis.com/directions/v2:computeRoutes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "routes.duration",
          },
          body: JSON.stringify({
            origin: {
              location: {
                latLng: {
                  latitude: userLatitude,
                  longitude: userLongitude,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: destinationLatitude,
                  longitude: destinationLongitude,
                },
              },
            },
            travelMode: "Drive",
          }),
        }
      );

      const dataToDestination = await responseToDestination.json();
      const timeToDestination = dataToDestination.routes?.[0]?.duration || 0;

      // Calculate total time and price
      const totalTime = (
        (parseInt(timeToUser) + parseInt(timeToDestination)) /
        60
      ).toFixed(2);
      const price = (+totalTime * 12).toFixed(0);

      return {
        ...marker,
        time: +totalTime,
        price,
        timeToUser,
      };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Error calculating driver times:", error);
  }
};

export const fetchRoutePolyline = async (
  originLatitude: number,
  originLongitude: number,
  destinationLatitude: number,
  destinationLongitude: number
) => {
  if (!apiKey) throw new Error("Google maps API key is missing");

  try {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: originLatitude,
                longitude: originLongitude,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destinationLatitude,
                longitude: destinationLongitude,
              },
            },
          },
          travelMode: "DRIVE",
        }),
      }
    );

    const data = await response.json();
    const encodedPolyline = data.routes?.[0]?.polyline?.encodedPolyline;

    if (!encodedPolyline) throw new Error("No polyline found in response");

    return decodePolyline(encodedPolyline);
  } catch (error) {
    console.error("Error fetching polyline, ", error);
    return [];
  }
};

// Decode Google polyline into coordinates
export const decodePolyline = (encoded: string) => {
  let index = 0,
    lat = 0,
    lng = 0,
    coordinates = [],
    shift,
    result,
    byte;

  while (index < encoded.length) {
    shift = result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
};
