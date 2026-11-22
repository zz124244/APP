Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase
Add-Type -AssemblyName System.Xaml

$src  = 'C:\Users\Lenovo\Desktop\IMG_0305.MP4'
$outDir = 'C:\Users\Lenovo\Documents\ChatGPT\APP\client-ios-codemagic\.cache\video'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

function Pump {
    param([int]$ms = 400)
    $frame  = New-Object System.Windows.Threading.DispatcherFrame
    $timer  = New-Object System.Windows.Threading.DispatcherTimer
    $timer.Interval = [TimeSpan]::FromMilliseconds($ms)
    $timer.Add_Tick({ $timer.Stop(); $frame.Continue = $false })
    $timer.Start()
    [System.Windows.Threading.Dispatcher]::PushFrame($frame)
}

$player = New-Object System.Windows.Media.MediaPlayer
$player.ScrubbingEnabled = $true
$player.Volume = 0
$player.Open([uri]$src)

$deadline = (Get-Date).AddSeconds(20)
while ($player.NaturalVideoWidth -eq 0 -and (Get-Date) -lt $deadline) { Pump -ms 250 }

$w = $player.NaturalVideoWidth
$h = $player.NaturalVideoHeight
$dur = if ($player.NaturalDuration.HasTimeSpan) { $player.NaturalDuration.TimeSpan.TotalSeconds } else { 0 }
Write-Output ("video  {0}x{1}  duration={2:n2}s" -f $w, $h, $dur)
if ($w -eq 0) { Write-Output 'FAILED to open media'; exit 1 }

$player.Play()
Pump -ms 500
$player.Pause()

$plan = @()
if ($dur -gt 0) {
    $n = 41
    for ($i = 0; $i -lt $n; $i++) { $plan += [math]::Round($dur * $i * 0.5, 2) }
} else { $plan = @(0,1,2,3,4,5) }

foreach ($t in $plan) {
    $player.Position = [TimeSpan]::FromSeconds($t)
    Pump -ms 450
    $dv = New-Object System.Windows.Media.DrawingVisual
    $dc = $dv.RenderOpen()
    $dc.DrawVideo($player, (New-Object System.Windows.Rect(0, 0, $w, $h)))
    $dc.Close()
    $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap($w, $h, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
    $rtb.Render($dv)
    $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
    $name = Join-Path $outDir ('frame-{0:n2}.png' -f $t).Replace(',', '.')
    $fs = [System.IO.File]::Create($name)
    $enc.Save($fs)
    $fs.Close()
    Write-Output ("saved {0}" -f $name)
}

# crude "is the frame black" check so we notice a decode failure instead of guessing
Get-ChildItem $outDir -Filter 'frame-*.png' | ForEach-Object {
    $bmp = [System.Windows.Media.Imaging.BitmapFrame]::Create([uri]$_.FullName)
    $conv = New-Object System.Windows.Media.Imaging.FormatConvertedBitmap($bmp, [System.Windows.Media.PixelFormats]::Bgr24, $null, 0)
    $stride = $conv.PixelWidth * 3
    $buf = New-Object byte[] ($stride * $conv.PixelHeight)
    $conv.CopyPixels($buf, $stride, 0)
    $sum = 0; $step = 997
    for ($i = 0; $i -lt $buf.Length; $i += $step) { $sum += $buf[$i] }
    $avg = [math]::Round($sum / [math]::Ceiling($buf.Length / $step), 1)
    Write-Output ("{0}  size={1}x{2}  avgSample={3}" -f $_.Name, $conv.PixelWidth, $conv.PixelHeight, $avg)
}

