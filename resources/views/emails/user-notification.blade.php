<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
                    <tr>
                        <td style="padding:20px 22px;border-bottom:1px solid #e2e8f0;">
                            <h1 style="margin:0;font-size:20px;line-height:1.3;">{{ $title }}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 22px;">
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                                {{ $body }}
                            </p>
                            @if($actionUrl)
                                <p style="margin:0;">
                                    <a href="{{ $actionUrl }}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;padding:10px 16px;font-size:14px;font-weight:700;">
                                        {{ $actionText ?: 'Ver detalle' }}
                                    </a>
                                </p>
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
