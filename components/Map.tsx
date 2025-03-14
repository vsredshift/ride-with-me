import { useEffect, useState } from "react";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { ActivityIndicator } from "react-native";

const Map = () => {
  const [location, setLocation] = useState({
    latitude: 56.18729,
    longitude: 14.7456,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
    })();
  }, []);

  if (!location) {
    return <ActivityIndicator size="small" />;
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={{ width: "100%", height: 300 }}
        // className="w-full h-full rounded-2xl"
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    />
  );
};

export default Map;
