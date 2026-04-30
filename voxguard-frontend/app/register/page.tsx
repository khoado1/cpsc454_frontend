"use client";

import { Card } from "@/components/ui/Card";
import { PageSection } from "@/components/ui/PageSection";
import { RegisterControl } from "@/components/RegisterControl";
import { hasRequiredAudioSupport } from "@/lib/audio-codec";
import { registerAndSetupKeys } from "@/lib/key-material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSupportedBrowser, setIsSupportedBrowser] = useState(true);

  useEffect(() => {
    setIsSupportedBrowser(hasRequiredAudioSupport());

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || success) return;

    if (!isSupportedBrowser) {
      setError("Your browser does not support the required audio features. Please use Chrome or Edge.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      await registerAndSetupKeys(username, password);
      setSuccess("Registration successful. Redirecting to login in 5 seconds.");

      redirectTimerRef.current = setTimeout(() => {
        router.push("/login");
      }, 5000);
    } catch (err) {
      setError("Registration failed. Please try a different username or password.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageSection grow centered>
      <main className="w-full max-w-md">
        <Card className="flex flex-col items-center gap-8" padding="xl">
          <RegisterControl
            onSubmit={handleRegister}
            isSubmitting={isSubmitting}
            isDisabled={!isSupportedBrowser || Boolean(success)}
          />
          {!isSupportedBrowser && (
            <p className="text-sm text-amber-600 text-center">
              Unsupported browser for recording. Please use Chrome or Edge for now.
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 text-center dark:text-green-400">{success}</p>
          )}
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" href="/login">
              Back to login
            </Link>
          </p>
        </Card>
      </main>
    </PageSection>
  );
}
