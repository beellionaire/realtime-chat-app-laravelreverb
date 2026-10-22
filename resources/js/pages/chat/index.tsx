import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { useChatLogic } from "@/hooks/use-chat-logic";
import { cn } from "@/lib/utils";
// ✅ IMPORT ICON BARU UNTUK MINI SIDEBAR
import {
    LayoutDashboard,
    MessageSquare,
    Phone,
    Settings,
    Users,
} from "lucide-react";

export default function ChatIndex() {
    const [dialog, setDialog] = useState<
        "chat" | "group" | "info" | "search" | null
    >(null);
    const chat = useChatLogic();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#FAFAFA]">
            <Head title="Chat" />

            {/* --- 1. MINI SIDEBAR (NAVIGATION RAIL) KHUSUS DESKTOP --- */}
            {/* Sembunyi di mobile (hidden), muncul di layar medium ke atas (md:flex) */}
            <div className="hidden md:flex w-[72px] flex-shrink-0 flex-col items-center justify-between border-r-2 border-black bg-white py-6">
                {/* Menu Atas (Chat, Call, Contact) */}
                <div className="flex flex-col gap-5">
                    <Link
                        href="/chat"
                        title="Chats"
                        className="flex size-12 items-center justify-center rounded-none border-2 border-black bg-[#FFD800] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-[1px]"
                    >
                        <MessageSquare
                            className="size-6 text-black"
                            strokeWidth={2.5}
                        />
                    </Link>

                    <button
                        title="Calls"
                        className="flex size-12 items-center justify-center rounded-none border-2 border-transparent bg-white text-black transition-all hover:border-black hover:bg-[#FAFAFA] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                        <Phone className="size-6" strokeWidth={2.5} />
                    </button>

                    <button
                        title="Contacts"
                        className="flex size-12 items-center justify-center rounded-none border-2 border-transparent bg-white text-black transition-all hover:border-black hover:bg-[#FAFAFA] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                        <Users className="size-6" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Menu Bawah (Dashboard, Settings) */}
                <div className="flex flex-col gap-5">
                    <Link
                        href="/dashboard"
                        title="Back to Dashboard"
                        className="flex size-12 items-center justify-center rounded-none border-2 border-transparent bg-white text-black transition-all hover:border-black hover:bg-[#FAFAFA] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                        <LayoutDashboard className="size-6" strokeWidth={2.5} />
                    </Link>

                    <button
                        title="Settings"
                        className="flex size-12 items-center justify-center rounded-none border-2 border-transparent bg-white text-black transition-all hover:border-black hover:bg-[#FAFAFA] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                        <Settings className="size-6" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* --- 2. BAGIAN TENGAH: SIDEBAR LIST CHAT --- */}
            <div
                className={cn(
                    "h-full w-full flex-shrink-0 border-black md:w-[340px] md:border-r-2 lg:w-[400px]",
                    chat.activeConversation ? "hidden md:block" : "block",
                )}
            >
                <ChatSidebar
                    conversations={chat.conversations}
                    activeId={chat.activeId}
                    meId={chat.me.id}
                    onlineIds={chat.onlineIds}
                    typingByConversation={chat.typingNamesByConversation}
                    onNewChat={() => setDialog("chat")}
                    onNewGroup={() => setDialog("group")}
                    onSearch={() => setDialog("search")}
                />
            </div>

            {/* --- 3. BAGIAN KANAN: PANEL CHAT ATAU LAYAR KOSONG --- */}
            <div
                className={cn(
                    "flex-1 h-full min-w-0 bg-[#FAFAFA]",
                    !chat.activeConversation
                        ? "hidden md:flex flex-col"
                        : "flex flex-col",
                )}
            >
                {chat.activeConversation ? (
                    <ChatPanel
                        conversation={chat.activeConversation}
                        messages={chat.messages}
                        meId={chat.me.id}
                        onlineIds={chat.onlineIds}
                        typingNames={
                            chat.typingNamesByConversation[
                                chat.activeConversation.id
                            ] ?? []
                        }
                        hasMore={chat.hasMore}
                        loadingOlder={chat.loadingOlder}
                        sending={chat.sending}
                        onLoadOlder={chat.loadOlder}
                        onSend={chat.sendMessage}
                        onTyping={chat.sendTypingWhisper}
                    />
                ) : (
                    <ChatEmptyState isActive={!!chat.activeConversation} />
                )}
            </div>

            <NewChatDialog
                open={dialog === "chat"}
                onOpenChange={(o) => setDialog(o ? "chat" : null)}
            />
        </div>
    );
}
