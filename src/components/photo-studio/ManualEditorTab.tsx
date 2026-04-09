import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  PenTool, 
  Upload, 
  Download, 
  RotateCw, 
  RotateCcw,
  Type,
  Square,
  Circle,
  ZoomIn,
  ZoomOut,
  Trash2,
  Save,
  Undo,
  Redo,
  Palette
} from 'lucide-react';
import { toast } from 'sonner';
import { Canvas as FabricCanvas, FabricImage, Rect, IText, Circle as FabricCircle } from 'fabric';
import { SaveToPropertyDialog } from './SaveToPropertyDialog';
import { validateFileSize } from './utils';
import { logger } from '@/utils/logger';

export const ManualEditorTab: React.FC = () => {
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('טקסט');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [exportedImageUrl, setExportedImageUrl] = useState('');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isRestoringRef = useRef(false);

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

  // Save state to history
  const saveToHistory = useCallback(() => {
    if (!fabricCanvas || isRestoringRef.current) return;
    
    const json = JSON.stringify(fabricCanvas.toJSON());
    
    // Remove any states after current index (when we add new action after undo)
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    
    // Add new state
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    
    // Limit history to 20 states
    if (historyRef.current.length > 20) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
    
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, [fabricCanvas]);

  // Create/update fabric canvas when size changes - with proper state preservation
  useEffect(() => {
    if (!canvasRef.current || canvasSize.width === 0) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#f0f0f0',
    });

    // Enable touch support
    canvas.allowTouchScrolling = false;

    // Listen for object changes to save history
    const handleModification = () => saveToHistory();
    canvas.on('object:added', handleModification);
    canvas.on('object:modified', handleModification);
    canvas.on('object:removed', handleModification);

    setFabricCanvas(canvas);

    return () => {
      canvas.off('object:added', handleModification);
      canvas.off('object:modified', handleModification);
      canvas.off('object:removed', handleModification);
      canvas.dispose();
      setFabricCanvas(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.width, canvasSize.height]);

  const handleUndo = useCallback(() => {
    if (!fabricCanvas || historyIndexRef.current <= 0) return;
    
    isRestoringRef.current = true;
    historyIndexRef.current--;
    
    fabricCanvas.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current]), () => {
      fabricCanvas.renderAll();
      isRestoringRef.current = false;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, [fabricCanvas]);

  const handleRedo = useCallback(() => {
    if (!fabricCanvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    
    isRestoringRef.current = true;
    historyIndexRef.current++;
    
    fabricCanvas.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current]), () => {
      fabricCanvas.renderAll();
      isRestoringRef.current = false;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    });
  }, [fabricCanvas]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvas) return;
      
      // Check if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Ctrl/Cmd + Z = Undo
      if (ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z = Redo
      else if ((ctrlKey && e.key === 'y') || (ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
      // Delete or Backspace = Delete selected
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects.length > 0) {
          activeObjects.forEach(obj => fabricCanvas.remove(obj));
          fabricCanvas.discardActiveObject();
          fabricCanvas.renderAll();
        }
      }
      // Escape = Deselect all
      else if (e.key === 'Escape') {
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas, handleUndo, handleRedo]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && fabricCanvas) {
      if (!validateFileSize(file)) return;
      
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
        
        // Reset history
        historyRef.current = [];
        historyIndexRef.current = -1;
        saveToHistory();
        
        URL.revokeObjectURL(url);
      } catch (error) {
        logger.error('Error loading image:', error);
        toast.error('שגיאה בטעינת התמונה');
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/') && fabricCanvas) {
      if (!validateFileSize(file)) return;
      
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
        
        // Reset history
        historyRef.current = [];
        historyIndexRef.current = -1;
        saveToHistory();
        
        URL.revokeObjectURL(url);
      } catch (error) {
        logger.error('Error loading image:', error);
        toast.error('שגיאה בטעינת התמונה');
        URL.revokeObjectURL(url);
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
      fontSize: fontSize,
      fill: textColor,
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
      stroke: strokeColor,
      strokeWidth: 2,
    });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
  };

  const handleAddCircle = () => {
    if (!fabricCanvas) return;
    const circle = new FabricCircle({
      left: 100,
      top: 100,
      radius: 50,
      fill: 'transparent',
      stroke: strokeColor,
      strokeWidth: 2,
    });
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
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
                aria-label="בחר קובץ תמונה"
              />
              <Button 
                variant="outline" 
                className="w-full min-h-[44px]"
                onClick={() => fileInputRef.current?.click()}
                aria-label="העלה תמונה לעריכה"
              >
                <Upload className="h-4 w-4 ml-2" />
                העלה תמונה
              </Button>
            </div>

            {/* Undo/Redo */}
            <div className="space-y-2">
              <Label>היסטוריה</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="min-h-[44px]"
                  aria-label="בטל פעולה אחרונה"
                >
                  <Undo className="h-4 w-4 ml-1" />
                  בטל
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className="min-h-[44px]"
                  aria-label="בצע מחדש"
                >
                  <Redo className="h-4 w-4 ml-1" />
                  חזור
                </Button>
              </div>
            </div>

            {/* Transform Tools */}
            <div className="space-y-2">
              <Label>טרנספורמציות</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleRotate(-90)} 
                  className="min-h-[44px]"
                  aria-label="סובב שמאלה"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleRotate(90)} 
                  className="min-h-[44px]"
                  aria-label="סובב ימינה"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleZoom('in')} 
                  className="min-h-[44px]"
                  aria-label="הגדל"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleZoom('out')} 
                  className="min-h-[44px]"
                  aria-label="הקטן"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Text Tools */}
            <div className="space-y-2">
              <Label>הוסף טקסט</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="טקסט"
                    className="flex-1 min-h-[44px]"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleAddText} 
                    className="min-h-[44px] min-w-[44px]"
                    aria-label="הוסף טקסט"
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-1 flex-1">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border"
                      aria-label="בחר צבע טקסט"
                    />
                  </div>
                  <div className="flex-1">
                    <Slider
                      value={[fontSize]}
                      onValueChange={([value]) => setFontSize(value)}
                      min={12}
                      max={72}
                      step={2}
                      className="touch-none"
                      aria-label="גודל פונט"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{fontSize}px</span>
                </div>
              </div>
            </div>

            {/* Shape Tools */}
            <div className="space-y-2">
              <Label>הוסף צורות</Label>
              <div className="space-y-2">
                <div className="flex gap-2 items-center mb-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border"
                    aria-label="בחר צבע מסגרת"
                  />
                  <span className="text-xs text-muted-foreground">צבע מסגרת</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="min-h-[44px]" 
                    onClick={handleAddRectangle}
                    aria-label="הוסף מלבן"
                  >
                    <Square className="h-4 w-4 ml-2" />
                    מלבן
                  </Button>
                  <Button 
                    variant="outline" 
                    className="min-h-[44px]" 
                    onClick={handleAddCircle}
                    aria-label="הוסף עיגול"
                  >
                    <Circle className="h-4 w-4 ml-2" />
                    עיגול
                  </Button>
                </div>
              </div>
            </div>

            {/* Delete */}
            <Button 
              variant="destructive" 
              className="w-full min-h-[44px]" 
              onClick={handleDeleteSelected}
              aria-label="מחק אובייקט נבחר"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              מחק נבחר
            </Button>

            {/* Save to Property */}
            <Button 
              variant="secondary" 
              className="w-full min-h-[44px]" 
              onClick={handleSaveToProperty}
              aria-label="שמור תמונה לנכס"
            >
              <Save className="h-4 w-4 ml-2" />
              שמור לנכס
            </Button>

            {/* Export */}
            <div className="space-y-2">
              <Label>ייצוא</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownload('png')} 
                  className="min-h-[44px]"
                  aria-label="הורד כ-PNG"
                >
                  <Download className="h-4 w-4 ml-1" />
                  PNG
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownload('jpeg')} 
                  className="min-h-[44px]"
                  aria-label="הורד כ-JPG"
                >
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
