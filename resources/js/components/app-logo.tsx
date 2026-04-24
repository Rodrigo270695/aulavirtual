import { usePlatform } from '@/hooks/use-platform';

type Props = {
    /** Fuerza el modo ícono sin importar el estado del sidebar */
    iconOnly?: boolean;
};

/**
 * Logo adaptable:
 *   - iconOnly / colapsado → solo ícono (icon_url)
 *   - expandido            → logo completo (logo_url)
 *
 * Detecta el estado del sidebar via CSS data-attributes del ancestro
 * para no depender del contexto de SidebarProvider.
 */
export default function AppLogo({ iconOnly = false }: Props) {
    const { app_name, logo_url, icon_url } = usePlatform();

    if (iconOnly) {
        return (
            <img
                src={icon_url}
                alt={app_name}
                className="size-8 shrink-0 object-contain"
            />
        );
    }

    return (
        <div className="flex items-center overflow-hidden">
            {/* Logo completo: visible cuando el sidebar está expandido */}
            <img
                src={logo_url}
                alt={app_name}
                className="h-8 max-w-[160px] object-contain object-left
                           group-data-[state=collapsed]:hidden
                           group-data-[collapsible=icon]:hidden"
            />
            {/* Ícono solo: visible cuando el sidebar está colapsado */}
            <img
                src={icon_url}
                alt={app_name}
                className="hidden size-8 shrink-0 object-contain
                           group-data-[state=collapsed]:block
                           group-data-[collapsible=icon]:block"
            />
        </div>
    );
}
