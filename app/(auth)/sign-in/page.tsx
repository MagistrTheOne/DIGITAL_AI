import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  const showGoogleSignIn = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );

  return <SignInForm showGoogleSignIn={showGoogleSignIn} />;
}
