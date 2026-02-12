"use client";

import { useSession } from "next-auth/react";

export default function DebugSession() {
    const { data: session, status } = useSession();

    if (process.env.NODE_ENV === 'production' && !session) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 p-4 bg-black/90 text-white text-xs rounded shadow-lg max-w-xs overflow-auto border border-red-500">
            <p className="font-bold text-red-400">DEBUG PANEL</p>
            <p>Status: {status}</p>
            <pre className="mt-2 text-[10px] whitespace-pre-wrap">
                {JSON.stringify(session, null, 2)}
            </pre>
        </div>
    );
}
