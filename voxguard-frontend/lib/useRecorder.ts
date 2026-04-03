"use client";

import { requiredMimeType as RequiredMimeType } from "./audio-codec";

import { RecordingReadyOptions } from "./audio-processing";

import { useRef, useState } from "react";

export function useRecorder(options?: RecordingReadyOptions) {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);


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
      if (options?.onRecordingReady) {
        await options.onRecordingReady({
          data: arrayBuffer,
          mimeType: actualMimeType
        });
      }
    };

    mediaRecorder.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };

  return { recording, startRecording, stopRecording };
}
