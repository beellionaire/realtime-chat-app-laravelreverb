import { Check, CheckCheck } from "lucide-react";
import { ChatAvatar } from "./chat-avatar";
import { formatClock } from "@/lib/chat-utils";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
    message: ChatMessage & { read_at?: string | null };
    isMine: boolean;
    isGroup: boolean;
    showSender: boolean;
    otherOnline: boolean;
}

export function MessageBubble({
    message,
    isMine,
    isGroup,
    showSender,
    otherOnline,
}: MessageBubbleProps) {
    if (message.type === "system") {
        return (
            <div className="my-4 flex justify-center">
                <span className="border-2 border-black bg-white px-4 py-1.5 text-xs font-bold uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {message.body}
                </span>
            </div>
        );
    }

    // Logika Status Centang
    const renderTicks = () => {
        if (!isMine) return null;

        if (message.read_at) {
            return (
                <CheckCheck
                    className="size-3.5 text-[#2563EB]"
                    strokeWidth={3}
                />
            ); // Centang 2 Biru (Sudah dibaca)
        }
        if (otherOnline) {
            return (
                <CheckCheck
                    className="size-3.5 text-black/60"
                    strokeWidth={3}
                />
            ); // Centang 2 Abu/Hitam (Online tapi belum dibuka)
        }
        return <Check className="size-3.5 text-black/60" strokeWidth={3} />; // Centang 1 (Belum online)
    };

    return (
        <div
            id={`message-${message.id}`}
            className={cn(
                "group flex w-full gap-3",
                isMine ? "justify-end" : "justify-start",
            )}
        >
            {isGroup && !isMine && (
                <div className="flex shrink-0 items-end pb-2">
                    {showSender ? (
                        <ChatAvatar
                            name={message.sender?.name ?? "?"}
                            avatarUrl={message.sender?.avatar_url}
                            className="size-8 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        />
                    ) : (
                        <div className="size-8" />
                    )}
                </div>
            )}

            <div
                className={cn(
                    "relative flex flex-col max-w-[75%] sm:max-w-[65%]",
                    isMine ? "items-end" : "items-start",
                )}
            >
                {showSender && isGroup && !isMine && message.sender && (
                    <span className="mb-1 ml-1 text-[11px] font-bold uppercase text-black/50">
                        {message.sender.name}
                    </span>
                )}

                {/* BUBBLE PESAN */}
                <div
                    className={cn(
                        // Menggunakan relative dan padding bawah yang sedikit lebih longgar untuk menampung waktu & centang di dalam
                        "relative px-4 pt-3 pb-6 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                        isMine
                            ? "bg-[#FFD800] text-black rounded-l-xl rounded-tr-xl rounded-br-sm"
                            : "bg-white text-black rounded-r-xl rounded-tl-xl rounded-bl-sm",
                    )}
                >
                    <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed pr-12">
                        {message.body}
                    </p>

                    {/* WAKTU & CENTANG DIMASUKKAN DI DALAM SUDUT KANAN BAWAH BUBBLE */}
                    <div className="absolute bottom-1.5 right-3 flex items-center gap-1 text-[10px] font-bold text-black/60">
                        <span>{formatClock(message.created_at)}</span>
                        {renderTicks()}
                    </div>
                </div>
            </div>
        </div>
    );
}
