import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
  reverseGeocodeAsync,
} from "expo-location";
import { useUser } from "@clerk/clerk-expo";
import RideCard from "@/components/RideCard";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Map from "@/components/Map";
import MapV2 from "@/components/MapV2";
import GoogleTextInput from "@/components/GoogleTextInput";
import { icons, images } from "@/constants";
import { recentRides } from "@/lib/data";
import { useLocationStore } from "@/store";

const Home = () => {
  const { setUserLocation, setDestinationLocation } = useLocationStore();
  const [hasPermissions, setHasPermissions] = useState(false);
  const { user } = useUser();
  const loading = false;

  useEffect(() => {
    const requestLocation = async () => {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasPermissions(false);
        return;
      }

      const location = await getCurrentPositionAsync({});
      console.log(location);

      const address = await reverseGeocodeAsync({
        latitude: location.coords?.latitude,
        longitude: location.coords?.longitude,
      });

      setUserLocation({
        latitude: location.coords?.latitude,
        longitude: location.coords?.longitude,
        address: `${address[0].name}, ${address[0].region}`,
      });
    };

    requestLocation();
  }, []);

  const handleSignOut = () => {};
  const handleDestinationPress = () => {};

  return (
    <SafeAreaView className="bg-general-500">
      <FlatList
        data={recentRides?.slice(0, 5)}
        renderItem={({ item }) => <RideCard ride={item} />}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  alt="No recent rides found"
                  resizeMode="contain"
                />
                <Text className="text-sm">No recent rides found</Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#000" />
            )}
          </View>
        )}
        ListHeaderComponent={() => (
          <>
            <View className="flex flex-row items-center justify-between my-5">
              <Text className="text-xl font-JakartaExtraBold">
                Welcome{" "}
                {user?.firstName || user?.emailAddresses[0].emailAddress}
              </Text>

              <TouchableOpacity onPress={handleSignOut}>
                <Image source={icons.out} className="w-4 h-4" />
              </TouchableOpacity>
            </View>

            <GoogleTextInput
              icon={icons.search}
              containerStyle="bg-white shadow-md shadow-neutral-300"
              handlePress={handleDestinationPress}
            />

            <>
              <Text className="text-xl font-JakartaBold mt-5 mb-3">
                Your Current Location
              </Text>

              <View className="flex flex-row items-center bg-transparent h-[300px]">
                {/* <Map /> */}
                <MapV2 />
              </View>
            </>

            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              Recent Rides
            </Text>
          </>
        )}
      />
    </SafeAreaView>
  );
};

export default Home;
