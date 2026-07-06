import { NextResponse } from "next/server";
import { generateReply, PERSONAS } from "../../../lib/personas.js";

export async function POST(request) {
    const body = await request.json();
    const { persona, history, message } = body ?? {};

    if (!persona || !PERSONAS[persona]) {
        return NextResponse.json(
            { error: `Unknown persona "${persona}". Available: ${Object.keys(PERSONAS).join(", ")}` },
            { status: 400 }
        );
    }

    if (!message || typeof message !== "string") {
        return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    try {
        const reply = await generateReply(persona, Array.isArray(history) ? history : [], message);
        return NextResponse.json({ reply });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to generate a response." }, { status: 500 });
    }
}
