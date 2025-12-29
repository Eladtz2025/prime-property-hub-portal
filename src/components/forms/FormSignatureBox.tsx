import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface FormSignatureBoxProps {
  label: string;
  signatureData: string;
  onSignatureChange: (data: string) => void;
  onClear: () => void;
  clearText: string;
  signedText: string;
  disabled?: boolean;
  isRTL?: boolean;
}

export const FormSignatureBox: React.FC<FormSignatureBoxProps> = ({
  label,
  signatureData,
  onSignatureChange,
  onClear,
  clearText,
  signedText,
  disabled = false,
  isRTL = true,
}) => {
  const signatureRef = useRef<SignatureCanvas | null>(null);

  // Restore signature from data if canvas is empty
  useEffect(() => {
    if (signatureRef.current && signatureData && signatureRef.current.isEmpty()) {
      // Create an image and draw it on the canvas
      const canvas = signatureRef.current.getCanvas();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = signatureData;
      }
    }
  }, [signatureData]);

  const handleSignatureEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const data = signatureRef.current.toDataURL('image/png');
      onSignatureChange(data);
    }
  };

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    onClear();
  };

  const isSigned = !!signatureData;

  return (
    <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {isSigned && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            {signedText}
          </span>
        )}
      </div>
      
      <div className={`border-2 rounded-lg bg-white ${isSigned ? 'border-green-300' : 'border-muted'}`}>
        <SignatureCanvas
          ref={signatureRef}
          canvasProps={{
            className: 'w-full h-32 rounded-lg touch-none',
            style: { 
              width: '100%', 
              height: '128px',
              touchAction: 'none',
              cursor: disabled ? 'not-allowed' : 'crosshair'
            }
          }}
          onEnd={handleSignatureEnd}
          backgroundColor="white"
          penColor="#1e3a5f"
        />
      </div>
      
      {!disabled && (
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3 mr-1" />
          {clearText}
        </Button>
      )}
    </div>
  );
};
