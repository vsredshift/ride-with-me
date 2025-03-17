import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { PaymentSheetError, useStripe } from "@stripe/stripe-react-native";
import CustomButton from "./CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { PaymentProps } from "@/types/type";

const Payment = ({
  fullName,
  email,
  amount,
  driverId,
  rideTime,
}: PaymentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [success, setSuccess] = useState<boolean>(false);

  const initialisePaymentSheet = async () => {
    const { error } = await initPaymentSheet({
      merchantDisplayName: "Ride With Me Inc.",
      intentConfiguration: {
        mode: {
          amount: 1099,
          currencyCode: "USD",
        },
        confirmHandler: async (
          paymentMethod,
          shouldSavePaymentMethod,
          intentCreationCallback
        ) => {
          const { paymentIntent, customer } = await fetchAPI(
            "/(api)/(stripe)/create",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: fullName || email.split("@")[0],
                email,
                amount,
                paymentMethod: paymentMethod.id,
              }),
            }
          );

          if (paymentIntent.client_secret) {
            const { result } = await fetchAPI("/(api)/(stripe)/pay", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                payment_method_id: paymentMethod.id,
                payment_intent_id: paymentIntent.id,
                customer_id: customer,
                client_secret: paymentIntent.client_secret,
              }),
            });

            if (result.client_secret) {
            }
          }
        },
      },
    });
    if (error) {
      console.log(error.message);
    }
  };

  const fetchPublishableKey = async () => {
    // const key = await fetchKey();
    // setPublishableKey(key);
  };

  useEffect(() => {
    fetchPublishableKey();
  }, []);

  const openPaymentSheet = async () => {
    await initialisePaymentSheet();
    const { error } = await presentPaymentSheet();

    if (error) {
      if (error.code === PaymentSheetError.Canceled) {
        Alert.alert(`Error code: ${error.code}`, error.message);
      } else {
        setSuccess(true);
      }
    }
  };

  return (
    <View>
      <CustomButton
        title="Confirm Ride"
        className="mt-10"
        onPress={openPaymentSheet}
      />
    </View>
  );
};

export default Payment;
