"use client";

import { login } from "@/lib/api";
import { useRecorder } from "@/lib/useRecorder";

export default function Home() {
  const { recording, startRecording, stopRecording } = useRecorder();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const token = await login(username, password);
      console.log("Login successful, token:", token);
      // Store token or redirect here
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-md flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Login
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-sm font-medium text-black dark:text-zinc-50">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="px-4 py-2 rounded-lg border border-black/[.1] dark:border-white/[.1] bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-black dark:text-zinc-50">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="px-4 py-2 rounded-lg border border-black/[.1] dark:border-white/[.1] bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background font-medium transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] mt-4"
            >
              Login
            </button>
          </form>

          <div className="flex flex-col items-center gap-3 w-full pt-4 border-t border-black/[.08] dark:border-white/[.1]">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Voice Input</p>
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              className={`flex h-12 w-full items-center justify-center rounded-full px-5 font-medium transition-colors ${
                recording
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "border border-black/[.1] dark:border-white/[.1] hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] text-black dark:text-white"
              }`}
            >
              {recording ? "Stop Recording" : "Start Recording"}
            </button>
            {recording && (
              <p className="text-sm text-red-500 animate-pulse">Recording...</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
