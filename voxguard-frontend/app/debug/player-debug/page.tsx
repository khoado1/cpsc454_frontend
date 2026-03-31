"use client";
import { PlayerControl } from "@/components/PlayerControl";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function PlayerDebugPage() {
  const [scenario, setScenario] = useState<"idle" | "loading" | "playing" | "error">("idle");

  const props = {
    audioUrl: null as string | null,
    fileName: null as string | null,
    isLoading: false,
    error: null as string | null,
  };

  if (scenario === "loading") {
    props.isLoading = true;
  } else if (scenario === "playing") {
    props.audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    props.fileName = "test-audio.mp3";
  } else if (scenario === "error") {
    props.error = "Failed to load audio file";
    props.fileName = "broken-file.mp3";
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">PlayerControl Debug Page</h1>
      
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
          onClick={() => setScenario("loading")}
          size="md"
          className={
            scenario === "loading"
              ? "bg-blue-600 text-white hover:bg-blue-700 dark:text-white"
              : "bg-blue-300 text-black hover:bg-blue-400 dark:text-black"
          }
        >
          Loading
        </Button>
        <Button
          onClick={() => setScenario("playing")}
          size="md"
          className={
            scenario === "playing"
              ? "bg-green-600 text-white hover:bg-green-700 dark:text-white"
              : "bg-green-300 text-black hover:bg-green-400 dark:text-black"
          }
        >
          Playing
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
      
      <div className="mb-6">
        <PlayerControl {...props} />
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <p className="text-xs font-semibold text-gray-600 mb-2">Current Props:</p>
        <pre className="text-xs">{JSON.stringify(props, null, 2)}</pre>
      </div>
    </div>
  );
}
