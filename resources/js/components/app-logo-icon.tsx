import { usePlatform } from '@/hooks/use-platform';

type Props = {
    className?: string;
};

/**
 * Muestra solo el ícono de la plataforma (cuadrado).
 * Se usa en: sidebar colapsado, favicon inline, pantallas pequeñas.
 */
export default function AppLogoIcon({ className }: Props) {
    const { icon_url, app_name } = usePlatform();

    return (
        <img
            src={icon_url}
            alt={`${app_name} ícono`}
            className={className}
            style={{ objectFit: 'contain' }}
        />
    );
}
