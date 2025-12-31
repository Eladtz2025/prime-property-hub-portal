import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Eraser, Upload, Download, Loader2, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImageLightbox } from './ImageLightbox';
import { SaveToPropertyDialog } from './SaveToPropertyDialog';

// Calculate initial brush size based on screen
const getInitialBrushSize = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return 40; // Larger brush for mobile
  }
  return 30;
};

export const ElementRemovalTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [brushSize, setBrushSize] = useState(getInitialBrushSize);
  const [hasMask, setHasMask] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
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
    setHasMask(false);
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
    const maxHeight = window.innerWidth < 768 ? 300 : 400;
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

  const getTouchPos = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }, []);

  const drawAt = useCallback((x: number, y: number) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Mark that we have drawn something
    setHasMask(true);
  }, [brushSize]);

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    drawAt(pos.x, pos.y);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getTouchPos(e);
    drawAt(pos.x, pos.y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getTouchPos(e);
    drawAt(pos.x, pos.y);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleClearMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }
    setHasMask(false);
  };

  const handleRemove = async () => {
    if (!selectedFile || !maskCanvasRef.current) {
      toast.error('יש להעלות תמונה ולסמן את האזור להסרה');
      return;
    }

    if (!hasMask) {
      toast.error('יש לסמן את האזור להסרה לפני הלחיצה');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('מכין את התמונה...');
    
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

      setProcessingStatus('שולח ל-AI לעיבוד...');

      const { data, error } = await supabase.functions.invoke('generate-property-image', {
        body: {
          prompt: 'Remove the masked elements from this image naturally, fill the area with appropriate background',
          image: base64Image,
          mask: maskBase64,
          type: 'inpaint'
        }
      });

      if (error) throw error;

      setProcessingStatus('מסיים עיבוד...');

      if (data?.imageUrl) {
        setResultUrl(data.imageUrl);
        toast.success('האלמנטים הוסרו בהצלחה!');
        setHasMask(false);
      }
    } catch (error: any) {
      console.error('Error removing elements:', error);
      toast.error(error.message || 'שגיאה בהסרת האלמנטים');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
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
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Result - Show first on mobile */}
        <Card className="order-1 lg:order-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center justify-between text-lg md:text-xl">
              <span>תוצאה</span>
              {resultUrl && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)} className="min-h-[44px]">
                    <Save className="h-4 w-4 ml-1" />
                    <span className="hidden sm:inline">שמור לנכס</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} className="min-h-[44px]">
                    <Download className="h-4 w-4 ml-1" />
                    <span className="hidden sm:inline">הורד</span>
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              התמונה המעובדת תופיע כאן
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            {resultUrl ? (
              <img 
                src={resultUrl} 
                alt="Result" 
                className="w-full rounded-lg cursor-pointer"
                onClick={() => setLightboxOpen(true)}
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 md:h-64 bg-muted/30 rounded-lg border-2 border-dashed">
                <Eraser className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center text-sm md:text-base px-4">
                  העלה תמונה וסמן אלמנטים להסרה
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="order-2 lg:order-1">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Eraser className="h-5 w-5 text-primary" />
              הסרת אלמנטים
            </CardTitle>
            <CardDescription className="text-sm">
              סמן את האזורים להסרה באמצעות המברשת
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
            {!imageUrl ? (
              <div 
                className="border-2 border-dashed rounded-lg p-4 md:p-6 text-center cursor-pointer hover:border-primary transition-colors min-h-[200px] md:min-h-[300px] flex flex-col items-center justify-center"
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
                <Upload className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm md:text-base">
                  גרור תמונה לכאן או לחץ לבחירה
                </p>
              </div>
            ) : (
              <>
                {/* Canvas Container */}
                <div 
                  ref={containerRef} 
                  className="relative rounded-lg overflow-hidden bg-muted"
                  style={{ touchAction: 'none' }}
                >
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
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
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
                    min={10}
                    max={100}
                    step={5}
                    className="touch-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClearMask} className="flex-1 min-h-[44px]">
                    <Trash2 className="h-4 w-4 ml-1" />
                    נקה סימון
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 min-h-[44px]">
                    <Upload className="h-4 w-4 ml-1" />
                    <span className="hidden sm:inline">העלה אחרת</span>
                    <span className="sm:hidden">העלה</span>
                  </Button>
                </div>

                <Button 
                  onClick={handleRemove} 
                  className="w-full min-h-[44px]"
                  disabled={isProcessing || !hasMask}
                  aria-label="הסר אלמנטים מסומנים"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      {processingStatus || 'מעבד...'}
                    </>
                  ) : (
                    <>
                      <Eraser className="h-4 w-4 ml-2" />
                      {hasMask ? 'הסר אלמנטים מסומנים' : 'סמן אזור להסרה'}
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={resultUrl ? [resultUrl] : []}
        currentIndex={0}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={() => {}}
      />

      {/* Save Dialog */}
      <SaveToPropertyDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        imageUrl={resultUrl}
      />
    </>
  );
};
