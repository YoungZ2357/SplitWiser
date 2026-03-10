"use client";

import type { Participant } from "@/types";

const AVATAR_COLORS = ["#C05621", "#3B6EBE", "#2D7A4F", "#BE3B3B", "#8C8477"];

interface AvatarProps {
    name: string;
    colorIndex: number;
    size?: number;
}

export function Avatar({ name, colorIndex, size = 32 }: AvatarProps) {
    const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
    return (
        <div
            className="rounded-full flex items-center justify-center font-semibold tracking-tight shrink-0"
            style={{
                width: size,
                height: size,
                background: color,
                color: "#fff",
                fontSize: size * 0.42,
            }}
            title={name}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

interface AvatarStackProps {
    participants: Participant[];
    participantMap: Record<string, number>;
    size?: number;
}

export function AvatarStack({ participants, participantMap, size = 22 }: AvatarStackProps) {
    return (
        <div className="flex items-center">
            {participants.map((p, i) => (
                <div
                    key={p.id}
                    style={{ marginLeft: i > 0 ? -6 : 0, zIndex: participants.length - i }}
                >
                    <Avatar name={p.name} colorIndex={participantMap[p.id]} size={size} />
                </div>
            ))}
        </div>
    );
}
