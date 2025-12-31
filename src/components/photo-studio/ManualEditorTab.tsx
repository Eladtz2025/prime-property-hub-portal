import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { 
  PenTool, 
  Upload, 
  Download, 
  RotateCw, 
  RotateCcw,
  Type,
  Square,
  Crop,
  Sun,
  Contrast,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { toast } from 'sonner';
import { Canvas as FabricCanvas, FabricImage, Rect, IText, FabricObject } from 'fabric';

export const ManualEditorTab: React.FC = () => {
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [textInput, setTextInput] = useState('טקסט');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 600,
      height: 400,
      backgroundColor: '#f0f0f0',
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && fabricCanvas) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      
      try {
        const img = await FabricImage.fromURL(url);
        
        // Scale image to fit canvas
        const canvasWidth = 600;
        const canvasHeight = 400;
        const scaleX = canvasWidth / (img.width || 1);
        const scaleY = canvasHeight / (img.height || 1);
        const scale = Math.min(scaleX, scaleY, 1);
        
        img.scale(scale);
        img.set({
          left: (canvasWidth - (img.width || 0) * scale) / 2,
          top: (canvasHeight - (img.height || 0) * scale) / 2,
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
        
        const canvasWidth = 600;
        const canvasHeight = 400;
        const scaleX = canvasWidth / (img.width || 1);
        const scaleY = canvasHeight / (img.height || 1);
        const scale = Math.min(scaleX, scaleY, 1);
        
        img.scale(scale);
        img.set({
          left: (canvasWidth - (img.width || 0) * scale) / 2,
          top: (canvasHeight - (img.height || 0) * scale) / 2,
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

  const handleZoom = (direction: 'in' | 'out') => {
    if (!fabricCanvas) return;
    const zoom = fabricCanvas.getZoom();
    const newZoom = direction === 'in' ? zoom * 1.1 : zoom / 1.1;
    fabricCanvas.setZoom(Math.min(Math.max(newZoom, 0.5), 3));
    fabricCanvas.renderAll();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Toolbar */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            כלי עריכה
          </CardTitle>
          <CardDescription>
            עריכה ידנית של תמונות נדל"ן
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
              className="w-full"
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
              <Button variant="outline" size="icon" onClick={() => handleRotate(-90)} title="סובב שמאלה">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleRotate(90)} title="סובב ימינה">
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleZoom('in')} title="הגדל">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleZoom('out')} title="הקטן">
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
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleAddText}>
                  <Type className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" className="w-full" onClick={handleAddRectangle}>
                <Square className="h-4 w-4 ml-2" />
                הוסף מסגרת
              </Button>
            </div>
          </div>

          {/* Delete */}
          <Button variant="destructive" className="w-full" onClick={handleDeleteSelected}>
            מחק נבחר
          </Button>

          {/* Export */}
          <div className="space-y-2">
            <Label>ייצוא</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => handleDownload('png')}>
                <Download className="h-4 w-4 ml-1" />
                PNG
              </Button>
              <Button variant="outline" onClick={() => handleDownload('jpeg')}>
                <Download className="h-4 w-4 ml-1" />
                JPG
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>אזור עריכה</CardTitle>
          <CardDescription>
            גרור אלמנטים או שנה את גודלם
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            ref={containerRef}
            className="border rounded-lg overflow-hidden bg-muted flex items-center justify-center min-h-[400px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <canvas ref={canvasRef} />
          </div>
          {!selectedFile && (
            <p className="text-center text-muted-foreground mt-4">
              גרור תמונה לכאן או לחץ על "העלה תמונה"
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
