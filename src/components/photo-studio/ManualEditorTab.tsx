import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  PenTool, 
  Upload, 
  Download, 
  RotateCw, 
  RotateCcw,
  Type,
  Square,
  ZoomIn,
  ZoomOut,
  Trash2,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { Canvas as FabricCanvas, FabricImage, Rect, IText } from 'fabric';
import { SaveToPropertyDialog } from './SaveToPropertyDialog';

export const ManualEditorTab: React.FC = () => {
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('טקסט');
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [exportedImageUrl, setExportedImageUrl] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate responsive canvas size
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth - 32; // Subtract padding
    const isMobile = window.innerWidth < 768;
    const maxWidth = Math.min(containerWidth, isMobile ? 400 : 600);
    const aspectRatio = 4 / 3;
    const height = Math.min(maxWidth / aspectRatio, isMobile ? 300 : 400);
    
    setCanvasSize({ width: maxWidth, height });
  }, []);

  // Initialize canvas and handle resize
  useEffect(() => {
    updateCanvasSize();
    
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [updateCanvasSize]);

  // Create/update fabric canvas when size changes
  useEffect(() => {
    if (!canvasRef.current) return;

    // Dispose existing canvas
    if (fabricCanvas) {
      fabricCanvas.dispose();
    }

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#f0f0f0',
    });

    // Enable touch support
    canvas.allowTouchScrolling = false;

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [canvasSize]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && fabricCanvas) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      
      try {
        const img = await FabricImage.fromURL(url);
        
        // Scale image to fit canvas
        const scaleX = canvasSize.width / (img.width || 1);
        const scaleY = canvasSize.height / (img.height || 1);
        const scale = Math.min(scaleX, scaleY, 1);
        
        img.scale(scale);
        img.set({
          left: (canvasSize.width - (img.width || 0) * scale) / 2,
          top: (canvasSize.height - (img.height || 0) * scale) / 2,
        });
        
        fabricCanvas.clear();
        fabricCanvas.add(img);
        fabricCanvas.renderAll();
      } catch (error) {
        console.error('Error loading image:', error);
        toast.error('שגיאה בטעינת התמונה');
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/') && fabricCanvas) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      
      try {
        const img = await FabricImage.fromURL(url);
        
        const scaleX = canvasSize.width / (img.width || 1);
        const scaleY = canvasSize.height / (img.height || 1);
        const scale = Math.min(scaleX, scaleY, 1);
        
        img.scale(scale);
        img.set({
          left: (canvasSize.width - (img.width || 0) * scale) / 2,
          top: (canvasSize.height - (img.height || 0) * scale) / 2,
        });
        
        fabricCanvas.clear();
        fabricCanvas.add(img);
        fabricCanvas.renderAll();
      } catch (error) {
        console.error('Error loading image:', error);
        toast.error('שגיאה בטעינת התמונה');
      }
    }
  };

  const handleRotate = (degrees: number) => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      activeObject.rotate((activeObject.angle || 0) + degrees);
      fabricCanvas.renderAll();
    }
  };

  const handleAddText = () => {
    if (!fabricCanvas) return;
    const text = new IText(textInput || 'טקסט', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 24,
      fill: '#000000',
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
  };

  const handleAddRectangle = () => {
    if (!fabricCanvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 2,
    });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
  };

  const handleDeleteSelected = () => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
    }
  };

  const handleDownload = (format: 'png' | 'jpeg') => {
    if (!fabricCanvas) return;
    
    const dataUrl = fabricCanvas.toDataURL({
      format,
      quality: 1,
      multiplier: 2,
    });
    
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `edited-property-image.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('התמונה הורדה בהצלחה');
  };

  const handleSaveToProperty = () => {
    if (!fabricCanvas) return;
    
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    setExportedImageUrl(dataUrl);
    setSaveDialogOpen(true);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!fabricCanvas) return;
    const zoom = fabricCanvas.getZoom();
    const newZoom = direction === 'in' ? zoom * 1.1 : zoom / 1.1;
    fabricCanvas.setZoom(Math.min(Math.max(newZoom, 0.5), 3));
    fabricCanvas.renderAll();
  };

  return (
    <>
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Canvas - Show first on mobile */}
        <Card className="lg:col-span-2 order-1 lg:order-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">אזור עריכה</CardTitle>
            <CardDescription className="text-sm">
              גרור אלמנטים או שנה את גודלם
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div 
              ref={containerRef}
              className="border rounded-lg overflow-hidden bg-muted flex items-center justify-center"
              style={{ minHeight: canvasSize.height, touchAction: 'none' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <canvas ref={canvasRef} />
            </div>
            {!selectedFile && (
              <p className="text-center text-muted-foreground mt-4 text-sm">
                גרור תמונה לכאן או לחץ על "העלה תמונה"
              </p>
            )}
          </CardContent>
        </Card>

        {/* Toolbar */}
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <PenTool className="h-5 w-5 text-primary" />
              כלי עריכה
            </CardTitle>
            <CardDescription className="text-sm">
              עריכה ידנית של תמונות נדל"ן
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0 md:pt-0">
            {/* Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                variant="outline" 
                className="w-full min-h-[44px]"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 ml-2" />
                העלה תמונה
              </Button>
            </div>

            {/* Transform Tools */}
            <div className="space-y-2">
              <Label>טרנספורמציות</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="icon" onClick={() => handleRotate(-90)} title="סובב שמאלה" className="min-h-[44px]">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleRotate(90)} title="סובב ימינה" className="min-h-[44px]">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleZoom('in')} title="הגדל" className="min-h-[44px]">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleZoom('out')} title="הקטן" className="min-h-[44px]">
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add Elements */}
            <div className="space-y-2">
              <Label>הוסף אלמנטים</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="טקסט"
                    className="flex-1 min-h-[44px]"
                  />
                  <Button variant="outline" size="icon" onClick={handleAddText} className="min-h-[44px] min-w-[44px]">
                    <Type className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" className="w-full min-h-[44px]" onClick={handleAddRectangle}>
                  <Square className="h-4 w-4 ml-2" />
                  הוסף מסגרת
                </Button>
              </div>
            </div>

            {/* Delete */}
            <Button variant="destructive" className="w-full min-h-[44px]" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 ml-2" />
              מחק נבחר
            </Button>

            {/* Save to Property */}
            <Button variant="secondary" className="w-full min-h-[44px]" onClick={handleSaveToProperty}>
              <Save className="h-4 w-4 ml-2" />
              שמור לנכס
            </Button>

            {/* Export */}
            <div className="space-y-2">
              <Label>ייצוא</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleDownload('png')} className="min-h-[44px]">
                  <Download className="h-4 w-4 ml-1" />
                  PNG
                </Button>
                <Button variant="outline" onClick={() => handleDownload('jpeg')} className="min-h-[44px]">
                  <Download className="h-4 w-4 ml-1" />
                  JPG
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Dialog */}
      <SaveToPropertyDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        imageUrl={exportedImageUrl}
      />
    </>
  );
};
