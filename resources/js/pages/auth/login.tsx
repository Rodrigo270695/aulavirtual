import { Head } from '@inertiajs/react';
import { FlipAuthCard } from '@/components/flip-auth-card';
import { usePlatform } from '@/hooks/use-platform';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const { app_name } = usePlatform();

    return (
        <>
            <Head title={`Iniciar sesión · ${app_name}`} />
            <FlipAuthCard
                initialView="login"
                canResetPassword={canResetPassword}
                canRegister={canRegister}
                status={status}
            />
        </>
    );
}

/** noCard: true — el layout solo pinta el fondo, login.tsx gestiona su propia card con flip */
Login.layout = { noCard: true };
