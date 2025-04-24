import { FileText, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, truncate } from "@/lib/utils";

interface Resume {
  id: number;
  filename: string;
  uploadedAt: string | Date;
  content?: string;
}

interface ResumeListProps {
  resumes: Resume[];
  selectedResumeId: number | null;
  onSelectResume: (resumeId: number) => void;
}

export default function ResumeList({ 
  resumes, 
  selectedResumeId,
  onSelectResume
}: ResumeListProps) {
  if (resumes.length === 0) {
    return (
      <div className="text-center py-6">
        <FileType className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">No resumes uploaded yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Upload your resume to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resumes.map((resume) => (
        <div 
          key={resume.id}
          className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 transition cursor-pointer ${
            selectedResumeId === resume.id ? 'border-primary/50 bg-primary/5' : 'border-gray-200'
          }`}
          onClick={() => onSelectResume(resume.id)}
        >
          <div className="flex-shrink-0 mr-3">
            <FileText className={`h-8 w-8 ${
              selectedResumeId === resume.id ? 'text-primary' : 'text-gray-400'
            }`} />
          </div>
          <div className="flex-grow min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {truncate(resume.filename, 20)}
            </p>
            <p className="text-xs text-gray-500">
              Uploaded {formatDate(resume.uploadedAt)}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-shrink-0 ml-2"
            onClick={(e) => {
              e.stopPropagation();
              onSelectResume(resume.id);
            }}
          >
            Use
          </Button>
        </div>
      ))}
    </div>
  );
}
