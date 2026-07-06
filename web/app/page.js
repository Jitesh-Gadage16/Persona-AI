"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const PERSONAS = [
    {
        id: "hitesh",
        name: "Hitesh Choudhary",
        initials: "HC",
        tagline: "Chai aur Code",
        starters: [
            "DSA pehle karu ya development?",
            "SQL vs NoSQL — konsa seekhu?",
            "Job ready hone mein kitna time lagega?",
        ],
    },
    {
        id: "piyush",
        name: "Piyush Garg",
        initials: "PG",
        tagline: "Full-stack & system design",
        starters: [
            "Best way to learn system design?",
            "Node.js vs Next.js API routes?",
            "How do I scale a side project?",
        ],
    },
];

function ChatMessage({ message, persona }) {
    const isUser = message.role === "user";
    return (
        <div className={`msg ${isUser ? "user" : "assistant"}`}>
            <span className="avatar">{isUser ? "You" : persona.initials}</span>
            <div className="bubble">
                <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
        </div>
    );
}

export default function ChatPage() {
    const [personaId, setPersonaId] = useState("hitesh");
    const [messages, setMessages] = useState([]); // { role: "user" | "assistant", content: string }
    const [input, setInput] = useState("");
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState(null);
    const chatRef = useRef(null);

    const persona = PERSONAS.find((p) => p.id === personaId);

    useEffect(() => {
        const el = chatRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, streaming]);

    function switchPersona(id) {
        if (id === personaId || streaming) return;
        setPersonaId(id);
        setMessages([]); // switching persona starts a fresh conversation
        setError(null);
    }

    async function send(overrideText) {
        const text = (overrideText ?? input).trim();
        if (!text || streaming) return;

        const nextMessages = [...messages, { role: "user", content: text }];
        setMessages(nextMessages);
        setInput("");
        setStreaming(true);
        setError(null);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    persona: personaId,
                    history: messages,
                    message: text,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Something went wrong.");
            }

            setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
        } catch (err) {
            setError(err.message);
        } finally {
            setStreaming(false);
        }
    }

    function onKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }

    return (
        <main className="app" data-persona={personaId}>
            <header className="header">
                <div className="brand">
                    Chai <span className="amp">&amp;</span> Charcha
                </div>
                <div className="disclaimer">
                    AI simulation · not affiliated with the real creators
                </div>
            </header>

            <div className="switcher" role="tablist" aria-label="Choose a persona">
                {PERSONAS.map((p) => (
                    <button
                        key={p.id}
                        role="tab"
                        aria-selected={p.id === personaId}
                        className={`persona-card ${p.id === personaId ? "active" : ""}`}
                        onClick={() => switchPersona(p.id)}
                        disabled={streaming}
                    >
                        <span className="avatar">{p.initials}</span>
                        <span className="persona-meta">
                            <strong>{p.name}</strong>
                            <span>{p.tagline}</span>
                        </span>
                    </button>
                ))}
            </div>

            <div className="chat" ref={chatRef}>
                {messages.length === 0 ? (
                    <div className="empty">
                        <h2>
                            {persona.id === "hitesh"
                                ? "Haanji! Chai leke baithiye ☕"
                                : "Hey everyone! Let's build something 🚀"}
                        </h2>
                        <p>
                            Ask {persona.name.split(" ")[0]} anything about coding, careers,
                            or tech — the AI persona answers in his public teaching style.
                        </p>
                        <div className="starters">
                            {persona.starters.map((s) => (
                                <button key={s} className="starter" onClick={() => send(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((m, i) => (
                        <ChatMessage key={i} message={m} persona={persona} />
                    ))
                )}
                {streaming && <div className="typing">{persona.initials} is typing</div>}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="composer">
                <div className="composer-inner">
                    <textarea
                        rows={1}
                        value={input}
                        placeholder={`Message ${persona.name.split(" ")[0]}…`}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        disabled={streaming}
                        aria-label="Message"
                    />
                    <button
                        className="send"
                        onClick={() => send()}
                        disabled={streaming || !input.trim()}
                    >
                        Send
                    </button>
                </div>
                <div className="footer-note">
                    Educational project. Responses are AI-generated recreations of public
                    teaching styles and may be inaccurate.
                </div>
            </div>
        </main>
    );
}
