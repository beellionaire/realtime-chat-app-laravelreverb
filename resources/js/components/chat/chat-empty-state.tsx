import { Bell, HelpCircle, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function ChatEmptyState({ isActive }: { isActive: boolean }) {
    return (
        <div
            className={cn(
                "min-w-0 flex-1 flex-col bg-[#FAFAFA]",
                isActive ? "hidden" : "hidden md:flex",
            )}
        >
            {/* HEADER KOSONG: Bersih dengan garis bawah hitam tebal */}
            <div className="flex items-center justify-end gap-3 border-b-2 border-black bg-white px-4 py-3">
                {/* Ikon Responsif: Ikon Help disembunyikan di layar kecil (hidden sm:inline-flex) */}
                <Button
                    variant="ghost"
                    size="icon"
                    title="Help"
                    className="hidden sm:inline-flex rounded-none border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-[#FFD800] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                    <HelpCircle className="size-5" strokeWidth={2.5} />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    title="Settings"
                    className="rounded-none border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-[#FFD800] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                    <Settings className="size-5" strokeWidth={2.5} />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    title="Notifications"
                    className="rounded-none border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-[#FFD800] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                    <Bell className="size-5" strokeWidth={2.5} />
                </Button>
            </div>

            {/* KONTEN TENGAH: Elemen 3D Minimalis */}
            <div className="flex flex-1 flex-col items-center justify-center p-8">
                {/* Aksen Kotak Bertumpuk Clean Neo-Brutalism */}
                <div className="relative mb-8">
                    {/* Kotak Aksen Kuning */}
                    <div className="absolute -right-3 -top-3 size-8 border-2 border-black bg-[#FFD800]" />
                    {/* Kotak Aksen Hitam */}
                    <div className="absolute -bottom-3 -left-3 size-8 bg-black" />

                    {/* Kotak Ikon Utama */}
                    <div className="relative flex h-24 w-24 items-center justify-center border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1">
                        <MessageSquare
                            className="size-10 text-black"
                            strokeWidth={2.5}
                        />
                    </div>
                </div>

                {/* Teks Judul */}
                <h2 className="mt-4 text-2xl font-black uppercase tracking-tight text-black sm:text-3xl">
                    Select a Chat
                </h2>

                {/* Kotak Instruksi Bawah */}
                <p className="mt-5 border-2 border-black bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    Or start a new one from the sidebar
                </p>
            </div>
        </div>
    );
}
