export default function ResumePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Uploaded Resumes</h1>
      <p className="text-muted-foreground mb-6">You can upload, view, or delete your resumes here.</p>
      <div className="border rounded-lg p-6">
        <p>No resumes uploaded yet.</p>
        {/* Add list of resumes / upload button here later */}
      </div>
    </div>
  )
}
