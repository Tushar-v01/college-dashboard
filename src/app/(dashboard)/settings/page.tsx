import ChangePasswordForm from "@/components/ChangePasswordForm";
import { currentUser } from "@/lib/auth-compat";

const SettingsPage = async () => {
  const user = await currentUser();

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Settings</h1>
      <p className="text-sm text-gray-500">
        Signed in as{" "}
        <span className="font-medium">
          {(user?.publicMetadata?.role as string) || "user"}
        </span>
        . You can change your password below.
      </p>
      <ChangePasswordForm />
    </div>
  );
};

export default SettingsPage;
