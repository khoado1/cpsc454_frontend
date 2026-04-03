"use client";

import { Card } from "@/components/ui/Card";
import { PageSection } from "@/components/ui/PageSection";
import { LoginControl } from "@/components/LoginControl";
import { getSubFromJwt, login } from "@/lib/api";
import { fetchStoredPrivateKeyPackage, decryptStoredPrivateKey } from "@/lib/crypto";
import { useAuthCryptoContext } from "@/lib/auth-crypto-context";
import { hasRequiredAudioSupport } from "@/lib/audio-codec";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setAuthCryptoContext } = useAuthCryptoContext();
  const [isSupportedBrowser, setIsSupportedBrowser] = useState(true);

  useEffect(() =>{
    setIsSupportedBrowser(hasRequiredAudioSupport());
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isSupportedBrowser){
      setError("Your browser does not support the required audio features. Please use Chrome or Edge.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const token = await login(username, password);

      const userKeyMaterial = await fetchStoredPrivateKeyPackage(token);
      const privateKey = await decryptStoredPrivateKey(password, userKeyMaterial);

      setAuthCryptoContext({
        accessToken : token,
        userId: getSubFromJwt(token),
        privateKey: privateKey,
        userKeyMaterial: userKeyMaterial,
      });

      router.push("/dashboard");
    } catch (err) {
      setError("Login failed. Please check your username and password.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageSection grow centered>
      <main className="w-full max-w-md">
        <Card className="flex flex-col items-center gap-8" padding="xl">
          <LoginControl 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
            isDisabled={!isSupportedBrowser} 
          />
          {!isSupportedBrowser && (
            <p className="text-sm text-amber-600 text-center">
              Unsupported browser for recording.  Please use Chrome or Edge for now.
            </p>
          )}
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </Card>
      </main>
    </PageSection>
  );
}
