<?php

namespace App\Support;

/**
 * Envoltorio HTML del certificado en modo visual (marcadores VISUAL_EDITOR_*).
 * Debe coincidir con {@see buildVisualCertificateHtml} en
 * resources/js/pages/admin/certificate-templates/visual-template-editor.tsx
 * para que alumno y vista previa admin usen el mismo marco y CSS aunque en BD
 * quede guardada una versión antigua del &lt;head&gt;.
 */
final class VisualCertificateHtml
{
    public static function wrap(string $visualBody): string
    {
        return <<<HTML
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Certificado</title>
  <style>
    @page { margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "DejaVu Sans", Arial, sans-serif;
      color: #0f172a;
      background: #fff;
    }
    .cert {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 1123px;
      height: 794px;
      padding: 72px 72px 56px;
      border: 12px solid #2563eb;
      border-radius: 18px;
      background: #fff;
      overflow: hidden;
    }
    .bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 1;
      z-index: 0;
    }
    .content {
      position: relative;
      z-index: 2;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      text-align: center;
      padding-top: 72px;
    }
    .logo-wrap {
      position: absolute;
      top: 28px;
      left: 42px;
      z-index: 3;
    }
    .logo {
      max-height: 64px;
      max-width: 190px;
      object-fit: contain;
      display: block;
    }
    .cert-shelf {
      margin-top: auto;
      padding: 28px 12px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 22px;
      position: relative;
      z-index: 4;
    }
    .signature {
      max-width: 480px;
      width: 100%;
      text-align: center;
      flex: 0 0 auto;
    }
    .signature img {
      max-height: 95px;
      max-width: 260px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
    .signature .line {
      border-top: 2px solid #94a3b8;
      margin-top: 4px;
      padding-top: 8px;
    }
    .signature .line p {
      margin: 0;
      font-size: 19px;
      color: #334155;
    }
    .signature .line p.who {
      font-weight: 700;
      color: #0f172a;
    }
    .verify {
      flex: 0 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      background: rgba(255,255,255,.96);
      padding: 8px;
      text-align: center;
    }
    .verify img {
      width: 92px;
      height: 92px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="cert">
    <img class="bg" src="{{background_image_url}}" alt="" />
    <div class="logo-wrap">
      <img class="logo" src="{{institution_logo_url}}" alt="Logo institución" />
    </div>
    <div class="content">
      <!--VISUAL_EDITOR_BODY_START-->
{$visualBody}
      <!--VISUAL_EDITOR_BODY_END-->
      <div class="cert-shelf">
        <div class="signature">
          <img src="{{signature_image_url}}" alt="Firma" />
          <div class="line">
            <p class="who">{{signatory_name}}</p>
            <p>{{signatory_title}}</p>
          </div>
        </div>
        <div class="verify">
          <img src="{{qr_url}}" alt="QR verificación pública" />
        </div>
      </div>
    </div>
  </div>
</body>
</html>
HTML;
    }
}
