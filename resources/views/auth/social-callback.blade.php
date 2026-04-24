<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Autenticando…</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            min-height: 100dvh;
            background: #f8fafc; color: #334155;
            gap: 1rem;
        }
        .spinner {
            width: 36px; height: 36px;
            border: 3px solid #e2e8f0;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        p { font-size: .875rem; color: #64748b; }
    </style>
</head>
<body>
    <div class="spinner" aria-hidden="true"></div>
    <p>Autenticando, por favor espera…</p>

    <script>
        (function () {
            var redirectTo = @json($redirectTo);
            var error      = @json($error ?? null);

            if (!window.opener) {
                // Si por alguna razón no hay ventana padre, redirigir directamente
                window.location.href = redirectTo;
                return;
            }

            try {
                if (error) {
                    window.opener.postMessage({ type: 'oauth-error', message: error }, window.location.origin);
                } else {
                    window.opener.postMessage({ type: 'oauth-success', redirectTo: redirectTo }, window.location.origin);
                }
            } catch (e) {
                window.location.href = redirectTo;
            }
            // Dejar tiempo a la ventana padre para procesar postMessage antes de cerrar (evita carrera).
            setTimeout(function () { window.close(); }, 200);
        })();
    </script>
</body>
</html>
