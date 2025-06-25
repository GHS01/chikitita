import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Loader2, CheckCircle } from "lucide-react";

interface PhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PhotoUpload({ isOpen, onClose, onSuccess }: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [mealType, setMealType] = useState<string>("lunch");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('mealType', mealType);

      const response = await fetch('/api/nutrition/analyze', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // 🔧 FIX: Use correct token key
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to analyze image');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Meal analyzed successfully!",
        description: `${data.name} has been added to your nutrition log.`,
      });
      
      // Auto-close after showing result briefly
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      analyzeMutation.mutate(selectedFile);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setAnalysisResult(null);
    setMealType("lunch");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onClose();
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Create video element for camera preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // For now, we'll just trigger file input
      // In a real implementation, you'd implement camera capture
      fileInputRef.current?.click();
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.log('Camera access denied, falling back to file input');
      fileInputRef.current?.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Analyze Your Meal</DialogTitle>
          <DialogDescription>
            Take a photo or upload an image of your meal for instant nutritional analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meal Type Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Meal Type</label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload Area */}
          {!selectedFile && !analysisResult && (
            <Card 
              className="border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Upload Meal Photo</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop an image or use the buttons below
                    </p>
                    <div className="flex flex-col space-y-2">
                      <Button onClick={openCamera} className="w-full">
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Image Preview */}
          {selectedFile && previewUrl && !analysisResult && (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Meal preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl("");
                    URL.revokeObjectURL(previewUrl);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending}
                  className="flex-1"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Meal'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Analysis Result */}
          {analysisResult && (
            <Card className="bg-secondary/5 border-secondary/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-secondary text-white w-10 h-10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-secondary mb-1">Analysis Complete!</h4>
                    <p className="text-sm text-muted-foreground mb-3">{analysisResult.name}</p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-background/50 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Calories</p>
                        <p className="font-bold font-mono">{analysisResult.calories}</p>
                      </div>
                      <div className="bg-background/50 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Protein</p>
                        <p className="font-bold font-mono">{analysisResult.protein}g</p>
                      </div>
                      <div className="bg-background/50 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Carbs</p>
                        <p className="font-bold font-mono">{analysisResult.carbs}g</p>
                      </div>
                      <div className="bg-background/50 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Fat</p>
                        <p className="font-bold font-mono">{analysisResult.fat}g</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {!analysisResult && (
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
