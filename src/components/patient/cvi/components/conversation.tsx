
"use client";

import { useEffect, useRef } from 'react';

interface ConversationProps {
    conversationUrl: string;
    onLeave: () => void;
}

export function Conversation({ conversationUrl, onLeave }: ConversationProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // Listen for conversation end events
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'conversation-ended') {
                onLeave();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onLeave]);

    return (
        <iframe
            ref={iframeRef}
            src={conversationUrl}
            className="w-full h-full border-0 rounded-lg"
            allow="camera; microphone; autoplay; display-capture"
            title="Tavus Conversation"
        />
    );
}
