Add-Type -AssemblyName System.Drawing

$publicDir = "c:\Users\USER\Documents\GitHub\in-house\public"
$logoPath = Join-Path $publicDir "logo.png"
$icon192Path = Join-Path $publicDir "icon-192.png"
$icon512Path = Join-Path $publicDir "icon-512.png"
$logoTempPath = Join-Path $publicDir "logo-temp.png"

Write-Host "Cargando logo original: $logoPath"
if (-not (Test-Path $logoPath)) {
    Write-Error "No se encontró el logo original en $logoPath"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($logoPath)
Write-Host "Dimensiones originales: $($img.Width)x$($img.Height)"

# 1. Guardar como 192x192
Write-Host "Creando icon-192.png..."
$bmp192 = New-Object System.Drawing.Bitmap 192, 192
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$g192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g192.DrawImage($img, 0, 0, 192, 192)
$bmp192.Save($icon192Path, [System.Drawing.Imaging.ImageFormat]::Png)
$g192.Dispose()
$bmp192.Dispose()

# 2. Guardar como 512x512
Write-Host "Creando icon-512.png..."
$bmp512 = New-Object System.Drawing.Bitmap 512, 512
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g512.DrawImage($img, 0, 0, 512, 512)
$bmp512.Save($icon512Path, [System.Drawing.Imaging.ImageFormat]::Png)
$g512.Dispose()
$bmp512.Dispose()

# 3. Guardar logo optimizado a 512x512
Write-Host "Optimizando logo.png a 512x512..."
$bmpLogo = New-Object System.Drawing.Bitmap 512, 512
$gLogo = [System.Drawing.Graphics]::FromImage($bmpLogo)
$gLogo.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gLogo.DrawImage($img, 0, 0, 512, 512)

# Liberar el original antes de sobrescribir
$img.Dispose()

$bmpLogo.Save($logoTempPath, [System.Drawing.Imaging.ImageFormat]::Png)
$gLogo.Dispose()
$bmpLogo.Dispose()

# Reemplazar logo.png
Remove-Item $logoPath -Force
Move-Item $logoTempPath $logoPath -Force

Write-Host "¡Proceso completado exitosamente!"
