import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';

export default function WishlistIndex() {
    return (
        <MarketplaceShell title="Lista de deseos">
            <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold text-slate-900">Lista de deseos</h1>
                <p className="mt-2 max-w-xl text-slate-600">
                    Guarda cursos para comprarlos o inscribirte más adelante.
                </p>
            </main>
        </MarketplaceShell>
    );
}
