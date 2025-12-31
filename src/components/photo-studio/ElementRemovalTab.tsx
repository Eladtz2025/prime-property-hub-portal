import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Eraser, Upload, Download, Loader2, Undo, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ElementRemovalTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [brushSize, setBrushSize] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  };

  const loadImage = (file: File) => {
    setSelectedFile(file);
    setResultUrl('');
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      initializeCanvases(img);
    };
    img.src = url;
  };

  const initializeCanvases = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    // Calculate display size maintaining aspect ratio
    const maxWidth = containerRef.current?.clientWidth || 600;
    const maxHeight = 400;
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = (maxWidth / width) * height;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (maxHeight / height) * width;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;
    maskCanvas.width = width;
    maskCanvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
    }

    // Clear mask
    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
      maskCtx.clearRect(0, 0, width, height);
    }
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleClearMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }
  };

  const handleRemove = async () => {
    if (!selectedFile || !maskCanvasRef.current) {
      toast.error('יש להעלות תמונה ולסמן את האזור להסרה');
      return;
    }

    setIsProcessing(true);
    try {
      // Convert original image to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });
      const base64Image = await base64Promise;

      // Convert mask to base64
      const maskCanvas = maskCanvasRef.current;
      
      // Create a proper mask (white on black)
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maskCanvas.width;
      tempCanvas.height = maskCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Black background
        tempCtx.fillStyle = 'black';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Get mask data and convert red areas to white
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) {
          const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
          const tempData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          
          for (let i = 0; i < maskData.data.length; i += 4) {
            if (maskData.data[i + 3] > 0) { // If there's any alpha
              tempData.data[i] = 255;     // R
              tempData.data[i + 1] = 255; // G
              tempData.data[i + 2] = 255; // B
              tempData.data[i + 3] = 255; // A
            }
          }
          tempCtx.putImageData(tempData, 0, 0);
        }
      }
      
      const maskBase64 = tempCanvas.toDataURL('image/png');

      const { data, error } = await supabase.functions.invoke('generate-property-image', {
        body: { 
          type: 'inpaint',
          image: base64Image,
          mask: maskBase64
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setResultUrl(data.imageUrl);
        toast.success('האלמנטים הוסרו בהצלחה!');
      }
    } catch (error: any) {
      console.error('Error removing elements:', error);
      toast.error(error.message || 'שגיאה בהסרת האלמנטים');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaned-property-image.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('שגיאה בהורדת התמונה');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eraser className="h-5 w-5 text-primary" />
            הסרת אלמנטים
          </CardTitle>
          <CardDescription>
            סמן את האזורים להסרה באמצעות המברשת
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!imageUrl ? (
            <div 
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors min-h-[300px] flex flex-col items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                גרור תמונה לכאן או לחץ לבחירה
              </p>
            </div>
          ) : (
            <>
              {/* Canvas Container */}
              <div ref={containerRef} className="relative rounded-lg overflow-hidden bg-muted">
                <canvas
                  ref={canvasRef}
                  className="block"
                />
                <canvas
                  ref={maskCanvasRef}
                  className="absolute top-0 left-0 cursor-crosshair"
                  onMouseDown={() => setIsDrawing(true)}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                  onMouseMove={draw}
                />
              </div>

              {/* Brush Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>גודל מברשת</Label>
                  <span className="text-sm text-muted-foreground">{brushSize}px</span>
                </div>
                <Slider
                  value={[brushSize]}
                  onValueChange={([value]) => setBrushSize(value)}
                  min={5}
                  max={100}
                  step={5}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClearMask} className="flex-1">
                  <Trash2 className="h-4 w-4 ml-1" />
                  נקה סימון
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                  <Upload className="h-4 w-4 ml-1" />
                  העלה תמונה אחרת
                </Button>
              </div>

              <Button 
                onClick={handleRemove} 
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    מסיר אלמנטים...
                  </>
                ) : (
                  <>
                    <Eraser className="h-4 w-4 ml-2" />
                    הסר אלמנטים מסומנים
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>תוצאה</span>
            {resultUrl && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 ml-1" />
                הורד
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            התמונה המעובדת תופיע כאן
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resultUrl ? (
            <img 
              src={resultUrl} 
              alt="Result" 
              className="w-full rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-muted/30 rounded-lg border-2 border-dashed">
              <Eraser className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                העלה תמונה וסמן אלמנטים להסרה
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
