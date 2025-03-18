import { useEffect, useState } from "react";
import { Alert, Image, View, Text } from "react-native";
import { PaymentSheetError, useStripe } from "@stripe/stripe-react-native";
import CustomButton from "./CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { PaymentProps } from "@/types/type";
import { useLocationStore } from "@/store";
import { useAuth } from "@clerk/clerk-expo";
import ReactNativeModal from "react-native-modal";
import { images } from "@/constants";
import { router } from "expo-router";

const Payment = ({
  fullName,
  email,
  amount,
  driverId,
  rideTime,
}: PaymentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { userId } = useAuth();
  const [success, setSuccess] = useState<boolean>(false);

  const {
    userAddress,
    userLatitude,
    userLongitude,
    destinationAddress,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const openPaymentSheet = async () => {
    await initializePaymentSheet();

    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      setSuccess(true);
    }
  };

  const initializePaymentSheet = async () => {
    const { paymentIntent, ephemeralKey, customer } = await fetchAPI(
      "/(api)/(stripe)/create",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName || email.split("@")[0],
          email,
          amount,
        }),
      }
    );

    const { error } = await initPaymentSheet({
      merchantDisplayName: "Ride With Me Inc.",
      paymentIntentClientSecret: paymentIntent.client_secret,
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey.secret,
      returnURL: "myapp://book-ride",
    });

    if (error) {
      console.error("PaymentSheet Init Error:", error);
    }

    // const { result } = await fetchAPI("/(api)/(stripe)/pay", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     payment_method_id: 
    //     payment_intent_id: paymentIntent.id,
    //     customer_id: customer,
    //     client_secret: paymentIntent.client_secret,
    //   }),
    // });

    if (paymentIntent.client_secret) {
      await fetchAPI("/(api)/ride/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin_address: userAddress,
          destination_address: destinationAddress,
          origin_latitude: userLatitude,
          origin_longitude: userLongitude,
          destination_latitude: destinationLatitude,
          destination_longitude: destinationLongitude,
          ride_time: rideTime.toFixed(0),
          fare_price: parseInt(amount) * 100,
          payment_status: "paid",
          driver_id: driverId,
          user_id: userId,
        }),
      });
    }
  };

  return (
    <View>
      <CustomButton
        title="Confirm Ride"
        className="mt-10"
        onPress={openPaymentSheet}
      />

      <ReactNativeModal
        isVisible={success}
        onBackButtonPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.check} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Ride Booked!
          </Text>

          <Text className="text-md text-general-200 text-center font-JakartaMedium mt-3">
            Thank you for your booking. Your ride has been reserved. Enjoy your
            trip.
          </Text>

          <CustomButton
            title="Back Home"
            onPress={() => {
              setSuccess(false);
              router.push("/(root)/(tabs)/home");
            }}
            className="mt-5"
          />
        </View>
      </ReactNativeModal>
    </View>
  );
};

export default Payment;
