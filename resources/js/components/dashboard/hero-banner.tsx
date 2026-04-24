interface Props {
    firstName: string;
    greeting: string;
}

export function DashboardHeroBanner({ firstName, greeting }: Props) {
    return (
        <section
            className="relative overflow-hidden rounded-2xl border border-blue-200/20 p-6 text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0d1b6e 0%, #1a56db 55%, #35a0ff 100%)' }}
        >
            <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full border border-white/10" />
            <div className="absolute -bottom-8 right-10 h-32 w-32 rounded-full border border-white/10" />
            <p className="text-sm text-blue-100">{greeting},</p>
            <h1 className="mt-1 text-2xl font-bold">{firstName} 👋</h1>
            <p className="mt-1 text-sm text-blue-100/90">
                Vista ejecutiva de la plataforma con métricas reales de usuarios, cursos, matrículas y pagos.
            </p>
        </section>
    );
}
