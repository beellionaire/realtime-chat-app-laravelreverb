import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { usePage } from "@inertiajs/react";
import { toast } from "sonner";
import { chatApi } from "@/lib/chat-api";
import { echo } from "@laravel/echo-react";
import { Auth } from "@/types";
import { ChatMessage, Conversation } from "@/types/chat";

type PageProps = {
    auth: Auth;
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: ChatMessage[];
};

type TypingUser = {
    id: number;
    name: string;
    expiresAt: number;
};

const PAGE_SIZE = 30;

// Custom Hook untuk membungkus semua logika chat
export function useChatLogic() {
    const { props } = usePage<PageProps>();
    const me = props.auth.user;

    const [conversations, setConversations] = useState<Conversation[]>(
        props.conversations,
    );
    const [messages, setMessages] = useState<ChatMessage[]>(
        props.messages ?? [],
    );

    useEffect(() => {
        setMessages(props.messages ?? []);
    }, [props.messages]);

    const [hasMore, setHasMore] = useState(
        (props.messages?.length ?? 0) >= PAGE_SIZE,
    );
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [sending, setSending] = useState(false);
    const [onlineIds, setOnlineIds] = useState<Set<number>>(new Set());
    const [typing, setTyping] = useState<Record<number, TypingUser[]>>({});

    const activeId = props.activeConversation?.id ?? null;
    const activeConversation = useMemo(
        () =>
            conversations.find((c) => c.id === activeId) ??
            props.activeConversation ??
            null,
        [conversations, activeId, props.activeConversation],
    );

    const activeIdRef = useRef(activeId);
    const conversationsRef = useRef(conversations);

    useEffect(() => {
        activeIdRef.current = activeId;
        conversationsRef.current = conversations;
    });

    const [prevConversationsProp, setPrevConversationsProp] = useState(
        props.conversations,
    );

    if (prevConversationsProp !== props.conversations) {
        setPrevConversationsProp(props.conversations);
        setConversations((current) =>
            props.conversations.map((incoming) => {
                const existing = current.find((c) => c.id === incoming.id);
                if (
                    existing &&
                    (existing.last_message_at ?? "") >
                        (incoming.last_message_at ?? "")
                ) {
                    return existing;
                }
                return incoming;
            }),
        );
    }

    const sortConversations = (list: Conversation[]) =>
        [...list].sort((a, b) =>
            (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""),
        );

    const patchConversation = useCallback(
        (id: number, patch: (c: Conversation) => Conversation) => {
            setConversations((current) =>
                sortConversations(
                    current.map((c) => (c.id === id ? patch(c) : c)),
                ),
            );
        },
        [],
    );

    useEffect(() => {
        if (activeId) {
            patchConversation(activeId, (c) => ({ ...c, unread_count: 0 }));
        }
    }, [activeId, patchConversation]);

    useEffect(() => {
        const channel = echo()
            .join("chat-online")
            .here((users: { id: number }[]) =>
                setOnlineIds(new Set(users.map((u) => u.id))),
            )
            .joining((user: { id: number }) =>
                setOnlineIds((current) => new Set([...current, user.id])),
            )
            .leaving((user: { id: number }) =>
                setOnlineIds((current) => {
                    const next = new Set(current);
                    next.delete(user.id);
                    return next;
                }),
            );
        return () => {
            echo().leave("chat-online");
        };
    }, []);

    const conversationIdsKey = conversations
        .map((c) => c.id)
        .sort((a, b) => a - b)
        .join(",");

    useEffect(() => {
        if (!conversationIdsKey) return;
        const ids = conversationIdsKey.split(",").map(Number);
        for (const id of ids) {
            const channel = echo().private(`conversation.${id}`);
            channel.listen(
                "MessageSent",
                ({ message }: { message: ChatMessage }) => {
                    const isActive =
                        message.conversation_id === activeIdRef.current;
                    if (isActive) {
                        setMessages((current) =>
                            current.some((m) => m.id === message.id)
                                ? current
                                : [...current, message],
                        );
                    }
                    patchConversation(message.conversation_id, (c) => ({
                        ...c,
                        last_message_at: message.created_at,
                        unread_count: isActive ? 0 : (c.unread_count ?? 0) + 1,
                        last_message: {
                            id: message.id,
                            type: message.type,
                            body: message.body,
                            is_deleted: message.is_deleted,
                            attachment_name: message.attachment?.name ?? null,
                            sender_id: message.user_id,
                            sender_name: message.sender?.name ?? null,
                            created_at: message.created_at,
                        },
                    }));
                },
            );
            channel.listenForWhisper(
                "typing",
                ({ id: userId, name }: { id: number; name: string }) => {
                    setTyping((current) => ({
                        ...current,
                        [id]: [
                            ...(current[id] ??
                                [].filter((t: any) => t.id !== userId)),
                            { id: userId, name, expiresAt: Date.now() + 3000 },
                        ],
                    }));
                },
            );
        }
        return () => {
            for (const id of ids) echo().leave(`conversation.${id}`);
        };
    }, [conversationIdsKey]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTyping((current) => {
                const now = Date.now();
                let changed = false;
                const next: Record<number, TypingUser[]> = {};
                for (const [key, users] of Object.entries(current)) {
                    const alive = users.filter((t) => t.expiresAt > now);
                    if (alive.length !== users.length) changed = true;
                    if (alive.length > 0) next[Number(key)] = alive;
                }
                return changed ? next : current;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const typingNamesByConversation = useMemo(() => {
        const map: Record<number, string[]> = {};
        for (const [key, users] of Object.entries(typing)) {
            map[Number(key)] = users.map((t) => t.name);
        }
        return map;
    }, [typing]);

    const lastWhisperRef = useRef(0);
    const sendTypingWhisper = useCallback(() => {
        if (!activeIdRef.current) return;
        const now = Date.now();
        if (now - lastWhisperRef.current < 1200) return;
        lastWhisperRef.current = now;
        echo()
            .private(`conversation.${activeIdRef.current}`)
            .whisper("typing", { id: me.id, name: me.name });
    }, [me.id, me.name]);

    const sendMessage = useCallback(
        (body: string) => {
            if (!activeConversation) return;
            setSending(true);
            chatApi
                .post<{ message: ChatMessage }>(
                    `/conversations/${activeConversation.id}/messages`,
                    { body },
                )
                .then(({ message }) => {
                    setMessages((current) =>
                        current.some((m) => m.id === message.id)
                            ? current
                            : [...current, message],
                    );
                    patchConversation(activeConversation.id, (c) => ({
                        ...c,
                        last_message_at: message.created_at,
                        lastMessage: {
                            id: message.id,
                            type: message.type,
                            body: message.body,
                            is_deleted: false,
                            attachment_name: null,
                            sender_id: me.id,
                            sender_name: me.name,
                            created_at: message.created_at,
                        },
                    }));
                })
                .catch((error: Error) => toast.error(error.message))
                .finally(() => setSending(false));
        },
        [activeConversation, me.id, me.name, patchConversation],
    );

    const loadOlder = useCallback(() => {
        if (!activeConversation || messages.length === 0) return;
        setLoadingOlder(true);
        chatApi
            .get<{ messages: ChatMessage[]; has_more: boolean }>(
                `/conversations/${activeConversation.id}/messages?before=${messages[0].id}`,
            )
            .then((data) => {
                setMessages((current) => [...data.messages, ...current]);
                setHasMore(data.has_more);
            })
            .catch(() => {})
            .finally(() => setLoadingOlder(false));
    }, [activeConversation, messages]);

    // Mengembalikan semua state dan fungsi agar bisa dipakai di UI
    return {
        me,
        conversations,
        messages,
        activeId,
        activeConversation,
        hasMore,
        loadingOlder,
        sending,
        onlineIds,
        typingNamesByConversation,
        sendTypingWhisper,
        sendMessage,
        loadOlder,
    };
}
