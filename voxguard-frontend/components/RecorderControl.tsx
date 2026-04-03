"use client";

import { useRef, useState } from "react";
import { requiredMimeType as RequiredMimeType } from "@/lib/audio-codec";
import { type RecordingReadyOptions } from "@/lib/audio-processing";

type RecorderControlProps = RecordingReadyOptions;

export function RecorderControl({ onRecordingReady }: RecorderControlProps) {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    if (!MediaRecorder.isTypeSupported(RequiredMimeType)) {
      throw new Error(`Browser does not support required recording format: ${RequiredMimeType}`);
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream, { mimeType: RequiredMimeType });
    const actualMimeType = mediaRecorder.current.mimeType || RequiredMimeType;

    if (!actualMimeType.includes("webm") || !actualMimeType.includes("opus")) {
      mediaRecorder.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorder.current = null;
      throw new Error(`Unexpected recording MIME type: ${actualMimeType}`);
    }

    mediaRecorder.current.ondataavailable = (e) => {
      chunks.current.push(e.data);
    };

    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: actualMimeType });
      const arrayBuffer = await blob.arrayBuffer();
      // TODO: pass arrayBuffer to your WASM Opus converter
      console.log("Audio ready for WASM:", arrayBuffer);
      chunks.current = [];
      if (onRecordingReady) {
        await onRecordingReady({ data: arrayBuffer, mimeType: actualMimeType });
      }
    };

    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full pt-4 border-t border-black/[.08] dark:border-white/[.1]">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Voice Input</p>
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className={`flex h-12 w-full items-center justify-center rounded-full px-5 font-medium transition-colors ${
          isRecording
            ? "bg-red-500 text-white hover:bg-red-600"
            : "border border-black/[.1] dark:border-white/[.1] hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] text-black dark:text-white"
        }`}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      {isRecording && <p className="text-sm text-red-500 animate-pulse">Recording...</p>}
    </div>
  );
}
