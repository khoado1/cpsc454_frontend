"use client";

export const requiredMimeType = "audio/webm;codecs=opus";

export type CodecEncoderOptions = {
    sampleRateHz?: number;
    channels?: number;
    bitrate?: number;
};

export function hasRequiredAudioSupport() : boolean {
    if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
        return false;
    }

    if (typeof window.MediaRecorder.isTypeSupported !== 'function') {
        return false;
    }

    return typeof window !== 'undefined'
        && window.MediaRecorder.isTypeSupported(requiredMimeType);
}

export async function initAudioCodec() : Promise<void> {
    checkWasmLoaded();

    // TODO: WASM call setup and initialization logic here

    wasmInitialized = true;
}

export async function encodeToOpus(
    pcmData: ArrayBuffer,
    options?: CodecEncoderOptions
) : Promise<ArrayBuffer> {
    
    checkWasmLoaded();

    if (!wasmInitialized) await initAudioCodec();

    return pcmData;
}
        
function checkWasmLoaded() : void {
    if (typeof(WebAssembly) === 'undefined')
        throw new Error("WebAssembly is not supported in this environment.");
}

let wasmInitialized = false;