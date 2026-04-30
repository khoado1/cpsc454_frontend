"use client";

import { Card } from "@/components/ui/Card";
import { PageSection } from "@/components/ui/PageSection";
import { LoginControl } from "@/components/LoginControl";
import Link from "next/link";
import { getSubFromJwt, login } from "@/lib/api";
import { decryptStoredPrivateKey } from "@/lib/crypto";
import { fetchStoredPrivateKeyPackage } from "@/lib/key-material";
import { useAuthCryptoContext } from "@/lib/auth-crypto-context";
import { hasRequiredAudioSupport } from "@/lib/audio-codec";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { setAuthCryptoContext } = useAuthCryptoContext();
  const [isSupportedBrowser, setIsSupportedBrowser] = useState(true);

  useEffect(() =>{
    setIsSupportedBrowser(hasRequiredAudioSupport());
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoggingIn) return;

    if (!isSupportedBrowser){
      setLoginError("Your browser does not support the required audio features. Please use Chrome or Edge.");
      return;
    }

    setLoginError(null);
    setIsLoggingIn(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const token = await login(username, password);

      const userKeyMaterial = await fetchStoredPrivateKeyPackage(token);
      const privateKey = await decryptStoredPrivateKey(password, userKeyMaterial);

      setAuthCryptoContext({
        accessToken: token,
        userId: getSubFromJwt(token),
        privateKey: privateKey,
        userKeyMaterial: userKeyMaterial,
      });

      router.push("/dashboard");
    } catch (err) {
      setLoginError("Login failed. Please check your username and password.");
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <PageSection grow centered>
      <main className="w-full max-w-md">
        <Card className="flex flex-col items-center gap-8" padding="xl">
          <LoginControl 
            onSubmit={handleLogin}
            isSubmitting={isLoggingIn}
            isDisabled={!isSupportedBrowser} 
          />
          {!isSupportedBrowser && (
            <p className="text-sm text-amber-600 text-center">
              Unsupported browser for recording.  Please use Chrome or Edge for now.
            </p>
          )}
          {loginError && (
            <p className="text-sm text-red-500 text-center">{loginError}</p>
          )}
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Need an account?{" "}
            <Link className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" href="/register">
              Register
            </Link>
          </p>
        </Card>
      </main>
    </PageSection>
  );
}
