import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, CheckCircle2, Loader2 } from "lucide-react";

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
}

export function FileUploadDialog({ open, onClose, sessionId }: FileUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "extracting" | "parsing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
        "image/jpg",
      ];
      
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setUploadStatus("idle");
        setErrorMessage("");
      } else {
        setErrorMessage("نوع الملف غير مدعوم. يرجى رفع PDF أو DOCX أو صورة.");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("extracting");

    try {
      // Step 1: Extract text from file
      const formData = new FormData();
      formData.append("file", file);

      const extractResponse = await fetch("/api/tools/extract_text", {
        method: "POST",
        body: formData,
      });

      if (!extractResponse.ok) {
        throw new Error("فشل استخراج النص من الملف");
      }

      const { text } = await extractResponse.json();

      // Step 2: Parse resume JSON
      setUploadStatus("parsing");

      const parseResponse = await fetch("/api/tools/parse_resume_json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!parseResponse.ok) {
        throw new Error("فشل تحليل السيرة الذاتية");
      }

      const parseResult = await parseResponse.json();

      if (parseResult.issues && parseResult.issues.length > 0) {
        setErrorMessage(parseResult.issues.join("\n"));
        setUploadStatus("error");
      } else {
        setUploadStatus("success");
        setTimeout(() => {
          onClose();
          setFile(null);
          setUploadStatus("idle");
        }, 2000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage(error instanceof Error ? error.message : "حدث خطأ أثناء رفع الملف");
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const event = { target: { files: [droppedFile] } } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-file-upload">
        <DialogHeader>
          <DialogTitle>رفع السيرة الذاتية</DialogTitle>
          <DialogDescription>
            ارفع ملف سيرتك الذاتية بصيغة PDF أو DOCX أو صورة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover-elevate cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById("file-input")?.click()}
              data-testid="dropzone"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground mb-2">اسحب الملف أو اضغط للاختيار</p>
              <p className="text-sm text-muted-foreground">
                PDF, DOCX, أو صورة (PNG, JPG)
              </p>
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".pdf,.docx,image/png,image/jpeg,image/jpg"
                onChange={handleFileSelect}
                data-testid="input-file"
              />
            </div>
          ) : (
            <div className="border border-card-border rounded-xl p-4" data-testid="file-preview">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground" data-testid="filename">
                      {file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFile(null);
                    setUploadStatus("idle");
                    setErrorMessage("");
                  }}
                  data-testid="button-remove-file"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {uploadStatus !== "idle" && (
                <div className="mt-4 p-3 rounded-lg bg-muted" data-testid="upload-status">
                  {uploadStatus === "extracting" && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm">جارٍ استخراج النص...</span>
                    </div>
                  )}
                  {uploadStatus === "parsing" && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm">جارٍ تحليل السيرة الذاتية...</span>
                    </div>
                  )}
                  {uploadStatus === "success" && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">تم التحليل بنجاح!</span>
                    </div>
                  )}
                  {uploadStatus === "error" && (
                    <div className="text-sm text-destructive whitespace-pre-wrap">
                      {errorMessage}
                    </div>
                  )}
                </div>
              )}

              {uploadStatus === "idle" && (
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full mt-4"
                  data-testid="button-upload-file"
                >
                  <Upload className="w-4 h-4 ml-2" />
                  رفع وتحليل
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
