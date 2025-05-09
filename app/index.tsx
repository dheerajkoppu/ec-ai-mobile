import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

const Page = () => {
  const { isSignedIn } = useAuth();

  if (isSignedIn) return <Redirect href="/(root)/(tabs)/new_opportunities" />;

  return <Redirect href="/(auth)/welcome" />;
};

export default Page;
