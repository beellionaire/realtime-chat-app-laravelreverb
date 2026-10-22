import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { ChatAvatar } from "./chat-avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogHeader,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";
import { chatApi } from "@/lib/chat-api";
import type { ChatUser } from "@/types/chat";

export function useUserDirectory(open: boolean) {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        const timeout = setTimeout(() => {
            setLoading(true);
            chatApi
                .get<ChatUser[]>(`/chat/users/?q=${encodeURIComponent(query)}`)
                .then(setUsers)
                .catch(() => setUsers([]))
                .finally(() => setLoading(false));
        }, 250);
        return () => clearTimeout(timeout);
    }, [open, query]);

    return { query, setQuery, loading, users };
}

export function NewChatDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { query, setQuery, users, loading } = useUserDirectory(open);

    const startChat = (user: ChatUser) => {
        onOpenChange(false);
        router.post(
            "/conversations",
            { user_id: user.id },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Modal bergaya Brutalism */}
            <DialogContent className="sm:max-w-md rounded-none border-4 border-black bg-white p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <DialogHeader className="border-b-4 border-black bg-yellow-400 p-6">
                    <DialogTitle className="text-3xl font-black uppercase tracking-tight text-black">
                        New Chat
                    </DialogTitle>
                    <DialogDescription className="font-bold text-black/70 uppercase">
                        Pick someone to start a conversation
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                    <Input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="SEARCH BY NAME OR EMAIL..."
                        className="h-14 rounded-none border-2 border-black bg-purple-100 p-4 font-bold uppercase placeholder:text-black/50 focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                    />

                    <div className="mt-6 max-h-72 space-y-3 overflow-y-auto">
                        {loading && (
                            <div className="flex justify-center py-6">
                                <Spinner className="size-8 text-black" />
                            </div>
                        )}

                        {!loading && users.length === 0 && (
                            <p className="py-8 text-center font-black uppercase text-black/40 border-2 border-dashed border-black">
                                NO USERS FOUND
                            </p>
                        )}

                        {!loading &&
                            users.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => startChat(user)}
                                    className="flex w-full items-center gap-4 rounded-none border-2 border-black bg-white p-3 text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-orange-500 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                                >
                                    <ChatAvatar
                                        name={user.name}
                                        avatarUrl={user.avatar_url}
                                        className="rounded-none border-2 border-black"
                                    />
                                    <span className="min-w-0">
                                        <span className="block truncate text-lg font-black uppercase text-black">
                                            {user.name}
                                        </span>
                                        <span className="block truncate text-xs font-bold text-black/70">
                                            {user.about ?? user.email}
                                        </span>
                                    </span>
                                </button>
                            ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
