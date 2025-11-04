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
import { useLanguage } from "@/contexts/LanguageContext";

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  onUploadComplete?: (resumeJson: any) => void;
}

export function FileUploadDialog({ open, onClose, sessionId, onUploadComplete }: FileUploadDialogProps) {
  const { t, dir } = useLanguage();
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
        setErrorMessage(t("fileUpload.error"));
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
        throw new Error(t("fileUpload.error"));
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
        throw new Error(t("fileUpload.error"));
      }

      const parseResult = await parseResponse.json();

      if (parseResult.issues && parseResult.issues.length > 0) {
        setErrorMessage(parseResult.issues.join("\n"));
        setUploadStatus("error");
      } else {
        setUploadStatus("success");
        // Call the callback with parsed resume data
        if (onUploadComplete && parseResult.resumeJson) {
          onUploadComplete(parseResult.resumeJson);
        }
        setTimeout(() => {
          onClose();
          setFile(null);
          setUploadStatus("idle");
        }, 1500);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage(error instanceof Error ? error.message : t("fileUpload.error"));
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
      <DialogContent className="sm:max-w-md" data-testid="dialog-file-upload" dir={dir}>
        <DialogHeader>
          <DialogTitle>{t("fileUpload.title")}</DialogTitle>
          <DialogDescription>
            {t("fileUpload.description")}
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
              <p className="text-foreground mb-2">{t("fileUpload.dragOrClick")}</p>
              <p className="text-sm text-muted-foreground">
                {t("fileUpload.supportedFormats")}
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
                      <span className="text-sm">{t("fileUpload.extracting")}</span>
                    </div>
                  )}
                  {uploadStatus === "parsing" && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm">{t("fileUpload.parsing")}</span>
                    </div>
                  )}
                  {uploadStatus === "success" && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">{t("fileUpload.success")}</span>
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
                  {t("fileUpload.uploadAndAnalyze")}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
