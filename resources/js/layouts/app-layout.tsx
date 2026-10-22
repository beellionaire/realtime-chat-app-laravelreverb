import AppLayoutTemplate from "@/layouts/app/app-sidebar-layout";
import type { BreadcrumbItem } from "@/types";
import { usePage } from "@inertiajs/react";

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    // 1. Ambil properti 'url' dari usePage()
    const { url } = usePage();

    // 2. Daftar rute yang ingin dikecualikan dari layout bawaan
    const routesToIgnore = ["/chat", "/admin", "/settings"];

    // 3. Cek apakah URL saat ini diawali dengan salah satu isi dari array
    const isMatch = routesToIgnore.some((route) => url.startsWith(route));

    // 4. Jika cocok, render children secara full screen tanpa layout bawaan
    if (isMatch) {
        return <>{children}</>;
    }

    // 5. Untuk halaman lainnya, gunakan layout bawaan sidebar dashboard
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            {children}
        </AppLayoutTemplate>
    );
}
