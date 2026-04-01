"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import { StoredPrivateKeyPackage } from "@/lib/crypto";

type AuthCryptoState = {
    accessToken: string | null;
    userId: string | null;
    privateKey: CryptoKey | null;
    userKeyMaterial: StoredPrivateKeyPackage | null;
};

export type AuthCryptoContextType = AuthCryptoState & {
    setAuthCryptoContext: (params: Partial<AuthCryptoState>) => void;
};

const defaultState: AuthCryptoState = {
    accessToken: null,
    userId: null,
    privateKey: null,
    userKeyMaterial: null,
};

const AuthCryptoContext = createContext<AuthCryptoContextType | undefined>(undefined);

// custom hook to get the AuthCryptoContext
export const useAuthCryptoContext = () => {
    const context = useContext(AuthCryptoContext);

    if (!context) {
        throw new Error("useAuthCryptoContext must be used within an AuthCryptoProvider");
    }

    return context;
};

// create the provider component to manage the state and provide it to the children
export const AuthCryptoProvider = ({ children }: { children: React.ReactNode }) => {
    const [authState, setAuthCryptoState] = useState<AuthCryptoState>(defaultState);

    const value = useMemo<AuthCryptoContextType>(
        () => ({
            ...authState,
            setAuthCryptoContext: (params: Partial<AuthCryptoState>) => {
                setAuthCryptoState((currentState) => ({
                    ...currentState,
                    ...params,
                }));
            },
        }),
        [authState],
    );

    return (
        <AuthCryptoContext.Provider value={value}>
            {children}
        </AuthCryptoContext.Provider>
    );
};
