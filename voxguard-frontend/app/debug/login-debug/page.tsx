"use client";

import { LoginControl } from "@/components/LoginControl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useState } from "react";

export default function LoginDebugPage() {
  const [scenario, setScenario] = useState<"idle" | "error">("idle");

  const props = {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const userName: string = e.currentTarget.username.value;
      const password: string = e.currentTarget.password.value;

      if (scenario === "error") {
        alert(`Login failed: Invalid username: ${userName} or password: ${password}`);
        alert(`Error: ${props.error}`);
      }else {   
        alert(`Form submitted username: ${userName} and password: ${password}`);
      }
    },
    error: null as string | null,
  };

  if (scenario === "error") {
    props.error = "Invalid username or password";
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">LoginControl Debug Page</h1>
      
      <div className="mb-6 flex gap-2">
        <Button
          onClick={() => setScenario("idle")}
          size="md"
          className={
            scenario === "idle"
              ? "bg-gray-600 text-white hover:bg-gray-700 dark:text-white"
              : "bg-gray-300 text-black hover:bg-gray-400 dark:text-black"
          }
        >
          Idle
        </Button>
        <Button
          onClick={() => setScenario("error")}
          size="md"
          className={
            scenario === "error"
              ? "bg-red-600 text-white hover:bg-red-700 dark:text-white"
              : "bg-red-300 text-black hover:bg-red-400 dark:text-black"
          }
        >
          Error
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <LoginControl {...props} />
      </Card>
    </div>
  );
}   