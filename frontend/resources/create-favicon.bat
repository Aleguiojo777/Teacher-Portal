@echo off
REM Favicon Creation Script for Teacher Portal
REM This script helps convert your logo to favicon format
REM Requirements: ImageMagick or online tool

echo.
echo ========================================
echo     Teacher Portal Favicon Generator
echo ========================================
echo.
echo This script will help you create favicons from your logo.
echo.
echo Option 1: Using ImageMagick (Command Line)
echo Option 2: Using Online Tool (Recommended for Beginners)
echo.
echo Choose an option:
echo 1 - Install ImageMagick and convert logo
echo 2 - Get online tool link
echo 3 - Exit
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Checking for ImageMagick...
    where magick >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ImageMagick not found!
        echo.
        echo Please download and install from:
        echo https://imagemagick.org/script/download.php-windows.php
        echo.
        echo After installing, run this script again.
        pause
        exit /b 1
    )
    
    echo Found ImageMagick!
    echo.
    echo Your logos are located in:
    echo - frontend\resources\techvision.png
    echo - frontend\resources\transparentlogo.png
    echo.
    echo Converting techvision.png to favicon.ico...
    cd frontend\resources
    magick convert techvision.png -define icon:auto-resize=256,128,96,64,48,32,16 favicon.ico
    echo Converting to Apple touch icon...
    magick convert techvision.png -resize 180x180 favicon-apple.png
    cd ..\..
    
    echo.
    echo DONE! Favicon files created:
    echo - favicon.ico
    echo - favicon-apple.png
    echo.
    echo Files location: frontend\resources\
    echo These will automatically be picked up by your HTML files.
    echo Restart your browser (Ctrl+Shift+R) to see changes.
    pause
    
) else if "%choice%"=="2" (
    echo.
    echo ONLINE FAVICON GENERATOR - Easiest Method
    echo ==========================================
    echo.
    echo Here are the recommended online tools:
    echo.
    echo 1. Real Favicon Generator (Best)
    echo    https://realfavicongenerator.net/
    echo.
    echo 2. Favicon Generator
    echo    https://favicon-generator.org/
    echo.
    echo 3. ConvertIO (PNG to ICO converter)
    echo    https://convertio.co/png-ico/
    echo.
    echo Steps:
    echo 1. Open one of the links above
    echo 2. Upload frontend\resources\techvision.png
    echo 3. Download the favicon files
    echo 4. Extract favicon.ico to frontend\resources\
    echo 5. Extract favicon-apple.png to frontend\resources\
    echo 6. Restart browser with Ctrl+Shift+R
    echo.
    pause
    
) else if "%choice%"=="3" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice!
    pause
    exit /b 1
)
