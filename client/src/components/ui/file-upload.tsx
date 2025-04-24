import { useState, useRef } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

type FileUploadProps = {
  onFileSelected: (file: File) => void;
  onFileRemoved?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
  isUploading?: boolean;
  progress?: number;
  error?: string | null;
};

export default function FileUpload({
  onFileSelected,
  onFileRemoved,
  accept = 'application/pdf',
  maxSize = 5, // 5MB default
  label = 'Upload File',
  description = 'Drag and drop your file here or click to browse',
  isUploading = false,
  progress = 0,
  error = null,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    if (accept && !file.type.match(accept)) {
      setLocalError(`File type not accepted. Please upload a ${accept.split('/')[1].toUpperCase()} file.`);
      return false;
    }

    // Check file size
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      setLocalError(`File is too large. Maximum file size is ${maxSize}MB.`);
      return false;
    }

    setLocalError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        onFileSelected(droppedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileSelected(selectedFile);
      }
    }
  };

  const handleRemove = () => {
    setFile(null);
    setLocalError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onFileRemoved?.();
  };

  const displayError = error || localError;

  return (
    <div className="w-full">
      <div
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
        } ${file ? 'bg-gray-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={accept}
          disabled={isUploading}
        />

        {!file ? (
          <>
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-lg font-medium text-gray-900 mb-1">{label}</p>
            <p className="text-sm text-gray-500 text-center mb-4">
              {description}
            </p>
            <p className="text-xs text-gray-400">
              {accept.split('/')[1].toUpperCase()} format, {maxSize}MB max
            </p>
          </>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <File className="h-8 w-8 text-primary mr-2" />
                <div>
                  <p className="font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isUploading && (
              <div className="w-full mt-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Uploading... {progress}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {displayError && (
        <Alert variant="destructive" className="mt-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
