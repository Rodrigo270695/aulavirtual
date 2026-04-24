import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';

export default function AuthLayout({
    title = '',
    description = '',
    noCard = false,
    children,
}: {
    title?: string;
    description?: string;
    noCard?: boolean;
    children: React.ReactNode;
}) {
    return (
        <AuthBrandLayout title={title} description={description} noCard={noCard}>
            {children}
        </AuthBrandLayout>
    );
}
