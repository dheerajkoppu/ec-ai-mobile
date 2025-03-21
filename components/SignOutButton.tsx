import { useClerk } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import CustomButton from "@/components/CustomButton";

export const SignOutButton = () => {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to home page
      Linking.openURL(Linking.createURL("/"));
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <CustomButton
      title="Log Out"
      onPress={handleSignOut}
      bgVariant="danger"
      className="mt-4"
    />
  );
};
