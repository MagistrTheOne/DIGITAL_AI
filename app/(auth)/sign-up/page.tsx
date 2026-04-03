import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  const showGoogleSignIn = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );

  return <SignUpForm showGoogleSignIn={showGoogleSignIn} />;
}
