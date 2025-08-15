import React, { useRef } from 'react';
import { X, Download, Copy, ExternalLink, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { registrationTokensService } from '../../services/firebase/registration-tokens.service';
import { useToast } from '../../contexts/ToastContext';

interface QRCodeDisplayProps {
  token: string;
  onClose: () => void;
}

export function QRCodeDisplay({ token, onClose }: QRCodeDisplayProps) {
  const { showToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  
  const registrationUrl = registrationTokensService.createRegistrationUrl(token);

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
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Registration QR Code</h2>
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
              <p className="text-sm text-gray-600">
                Scan this QR code to access the registration form
              </p>
              
              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-xs font-mono text-gray-500 break-all">
                  {registrationUrl}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleCopyUrl}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Copy className="w-4 h-4" />
            <span>Copy URL</span>
          </button>

          <button
            onClick={handleOpenUrl}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Test</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
}