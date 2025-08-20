import { useRef, useState } from 'react';
import {
  X,
  Download,
  Copy,
  ExternalLink,
  Printer,
  FileText,
  Monitor,
  Maximize2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { registrationTokensService } from '../../services/firebase/registration-tokens.service';
import { useToast } from '../../contexts/ToastContext';

interface QRCodeDisplayProps {
  token: string;
  purpose?: string;
  eventDate?: string;
  location?: string;
  onClose: () => void;
}

type DisplayMode = 'normal' | 'digital' | 'fullscreen';

export function QRCodeDisplay({
  token,
  purpose,
  eventDate,
  location,
  onClose,
}: QRCodeDisplayProps) {
  const { showToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('normal');

  const registrationUrl =
    registrationTokensService.createRegistrationUrl(token);
  const shortUrl = `shepherd.church/register/${token}`; // Fallback short URL

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(registrationUrl);
    showToast('Registration URL copied to clipboard', 'success');
  };

  const handleOpenUrl = () => {
    window.open(registrationUrl, '_blank');
  };

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Create a canvas to convert SVG to image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Create download link
      const downloadUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `registration-qr-${token}.png`;
      link.href = downloadUrl;
      link.click();

      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleDownloadPDF = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Create a canvas to convert SVG to image first
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.drawImage(img, 0, 0, 400, 400);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add church branding
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Church Registration', pageWidth / 2, 30, { align: 'center' });

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Visitor & Member Check-In', pageWidth / 2, 40, {
        align: 'center',
      });

      // Add event information if available
      let yPos = 60;
      if (purpose) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Event:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(purpose, 35, yPos);
        yPos += 10;
      }

      if (eventDate) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Date:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(new Date(eventDate).toLocaleDateString(), 35, yPos);
        yPos += 8;
      }

      if (location) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Location:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(location, 40, yPos);
        yPos += 15;
      }

      // Add QR code
      const qrSize = 80;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = yPos + 10;

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        qrX,
        qrY,
        qrSize,
        qrSize
      );

      // Add instructions
      const instructionY = qrY + qrSize + 20;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('How to Register:', pageWidth / 2, instructionY, {
        align: 'center',
      });

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const instructions = [
        '1. Open your smartphone camera',
        '2. Point it at this QR code',
        '3. Tap the notification that appears',
        '4. Fill out the registration form',
        '',
        'Or visit the link below on any device:',
      ];

      instructions.forEach((instruction, index) => {
        pdf.text(instruction, pageWidth / 2, instructionY + 8 + index * 5, {
          align: 'center',
        });
      });

      // Add URLs
      const urlY = instructionY + 50;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Registration URL:', pageWidth / 2, urlY, { align: 'center' });

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      // Split long URL for better display
      const urlText = registrationUrl;
      if (urlText.length > 60) {
        const midPoint = Math.floor(urlText.length / 2);
        const breakPoint = urlText.indexOf('/', midPoint);
        const part1 = urlText.substring(
          0,
          breakPoint > 0 ? breakPoint : midPoint
        );
        const part2 = urlText.substring(breakPoint > 0 ? breakPoint : midPoint);
        pdf.text(part1, pageWidth / 2, urlY + 6, { align: 'center' });
        pdf.text(part2, pageWidth / 2, urlY + 11, { align: 'center' });
      } else {
        pdf.text(urlText, pageWidth / 2, urlY + 6, { align: 'center' });
      }

      // Add short URL fallback
      pdf.setFontSize(10);
      pdf.text('Short URL:', pageWidth / 2, urlY + 20, { align: 'center' });
      pdf.setFont('helvetica', 'bold');
      pdf.text(shortUrl, pageWidth / 2, urlY + 26, { align: 'center' });

      // Add footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        'Generated by Shepherd Church Management System',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Save the PDF
      const fileName = purpose
        ? `qr-registration-${purpose.toLowerCase().replace(/\s+/g, '-')}.pdf`
        : `qr-registration-${token}.pdf`;

      pdf.save(fileName);
      URL.revokeObjectURL(url);
      showToast('PDF downloaded successfully', 'success');
    };

    img.src = url;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrElement = qrRef.current?.querySelector('svg');
    if (!qrElement) return;

    const svgString = new XMLSerializer().serializeToString(qrElement);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Registration</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px; 
              margin: 0;
            }
            .header { 
              margin-bottom: 30px; 
            }
            .church-name { 
              font-size: 32px; 
              font-weight: bold; 
              color: #1f2937;
              margin-bottom: 10px; 
            }
            .title { 
              font-size: 24px; 
              color: #4b5563;
              margin-bottom: 20px; 
            }
            .qr-container { 
              margin: 30px auto; 
              display: inline-block; 
              padding: 20px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              background: white;
            }
            .instructions { 
              font-size: 16px; 
              color: #6b7280;
              margin-top: 30px; 
              line-height: 1.6;
            }
            .url { 
              font-size: 12px; 
              color: #9ca3af;
              margin-top: 20px; 
              word-break: break-all;
            }
            @media print {
              body { 
                padding: 20px; 
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="church-name">Church Registration</div>
            <div class="title">Visitor & Member Check-In</div>
          </div>
          
          <div class="qr-container">
            ${svgString}
          </div>
          
          <div class="instructions">
            <strong>How to Register:</strong><br>
            1. Open your smartphone camera<br>
            2. Point it at this QR code<br>
            3. Tap the notification that appears<br>
            4. Fill out the registration form<br><br>
            <em>Or visit the link below on any device</em>
          </div>
          
          <div class="url">
            ${registrationUrl}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleDigitalDisplay = () => {
    setDisplayMode('digital');
  };

  const handleFullscreen = () => {
    setDisplayMode('fullscreen');
  };

  const handleExitDisplayMode = () => {
    setDisplayMode('normal');
  };

  const handleCopyShortUrl = () => {
    navigator.clipboard.writeText(shortUrl);
    showToast('Short URL copied to clipboard', 'success');
  };

  // Digital Display Mode Component
  if (displayMode === 'digital') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 flex items-center justify-center z-50">
        <button
          onClick={handleExitDisplayMode}
          className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-30 rounded-full p-2"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center text-white max-w-4xl mx-auto px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold mb-4 text-white drop-shadow-lg">
              Welcome to Our Church
            </h1>
            <h2 className="text-3xl font-light mb-6 text-blue-100">
              Quick Registration
            </h2>
            {purpose && (
              <h3 className="text-2xl font-medium text-blue-200 mb-2">
                {purpose}
              </h3>
            )}
            {eventDate && (
              <p className="text-xl text-blue-300">
                {new Date(eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            {location && (
              <p className="text-lg text-blue-300 mt-2">📍 {location}</p>
            )}
          </div>

          {/* QR Code */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-2xl">
              <QRCodeSVG
                value={registrationUrl}
                size={300}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#000000"
                marginSize={2}
                title="Registration QR Code"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-8">
            <h3 className="text-3xl font-semibold mb-6">Scan to Register</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-4xl mb-2">📱</div>
                <p className="text-lg">Open Camera</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-lg">Point at QR Code</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-4xl mb-2">👆</div>
                <p className="text-lg">Tap Notification</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-4xl mb-2">✍️</div>
                <p className="text-lg">Fill Form</p>
              </div>
            </div>
          </div>

          {/* Fallback URL */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <p className="text-lg mb-2">Or visit directly:</p>
            <p className="text-2xl font-bold text-yellow-300">{shortUrl}</p>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen Display Mode Component
  if (displayMode === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <button
          onClick={handleExitDisplayMode}
          className="absolute top-4 right-4 text-white hover:text-gray-300 bg-gray-800 bg-opacity-50 rounded-full p-3"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="text-center text-white w-full h-full flex flex-col justify-center items-center p-8">
          {/* Minimal header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4">Church Registration</h1>
            {purpose && (
              <h2 className="text-3xl font-light text-gray-300">{purpose}</h2>
            )}
          </div>

          {/* Large QR Code */}
          <div className="mb-8">
            <div className="bg-white p-12 rounded-3xl shadow-2xl">
              <QRCodeSVG
                value={registrationUrl}
                size={400}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#000000"
                marginSize={2}
                title="Registration QR Code"
              />
            </div>
          </div>

          {/* Simple instructions */}
          <div className="text-center max-w-2xl">
            <p className="text-2xl font-light mb-4">
              Scan with your phone's camera
            </p>
            <p className="text-xl text-gray-400 mb-8">
              to register for this event
            </p>

            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
              <p className="text-lg mb-2">Direct link:</p>
              <p className="text-xl font-mono text-blue-400">{shortUrl}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Registration QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* QR Code Display */}
        <div className="p-6">
          <div className="text-center">
            <div
              ref={qrRef}
              className="flex justify-center mb-6 p-4 bg-white border-2 border-gray-200 rounded-lg inline-block"
            >
              <QRCodeSVG
                value={registrationUrl}
                size={200}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#000000"
                marginSize={2}
                title="Registration QR Code"
              />
            </div>

            <div className="space-y-3">
              {/* Event Information */}
              {(purpose || eventDate || location) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                  {purpose && (
                    <h3 className="font-semibold text-blue-900 mb-1">
                      {purpose}
                    </h3>
                  )}
                  {eventDate && (
                    <p className="text-sm text-blue-700">
                      📅{' '}
                      {new Date(eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                  {location && (
                    <p className="text-sm text-blue-700 mt-1">📍 {location}</p>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-600">
                Scan this QR code to access the registration form
              </p>

              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-xs font-mono text-gray-500 break-all">
                  {registrationUrl}
                </p>
              </div>

              {/* Short URL */}
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-600 font-medium">
                      Short URL:
                    </p>
                    <p className="text-sm font-mono text-green-800">
                      {shortUrl}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyShortUrl}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {/* Primary Actions */}
          <div className="flex items-center justify-center space-x-2 mb-3">
            <button
              onClick={handleCopyUrl}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Copy className="w-4 h-4" />
              <span>Copy URL</span>
            </button>

            <button
              onClick={handleOpenUrl}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Test</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4" />
              <span>PNG</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>

          {/* Display Mode Actions */}
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={handleDigitalDisplay}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Monitor className="w-4 h-4" />
              <span>Digital Display</span>
            </button>

            <button
              onClick={handleFullscreen}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
