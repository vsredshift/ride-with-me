import { Text, View } from "react-native";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, Redirect } from "expo-router";
import CustomButton from "@/components/CustomButton";

const Home = () => {
  const { user } = useUser();

  return (
    <View>
      <SignedIn>
        <Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
      </SignedIn>
      <SignedOut>
        <Link href="/(auth)/sign-in">
          <Text>Sign in</Text>
        </Link>
        <Link href="/(auth)/sign-up">
          <Text>Sign up</Text>
        </Link>
      </SignedOut>
      <CustomButton
        title="Go Back"
        onPress={() => <Redirect href="/(auth)/sign-in" />}
      />
    </View>
  );
};

export default Home;
