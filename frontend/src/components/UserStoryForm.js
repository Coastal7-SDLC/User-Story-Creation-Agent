import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Send, Loader2, Upload, FileText, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const UserStoryForm = ({ onGenerateStories, hasStories = false, showTips = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm();

  const requirements = watch('requirements');

  // Clear analysis when requirements change
  useEffect(() => {
    if (analysisResult) {
      setAnalysisResult(null);
    }
  }, [requirements]);

  // Analyze requirements to estimate story count
  const analyzeRequirements = async () => {
    if (!requirements || requirements.length < 10) {
      toast.error('Please enter requirements (at least 10 characters) to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requirements }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze requirements');
      }

      const result = await response.json();
      setAnalysisResult(result);
      toast.success(`Analysis complete! Estimated ${result.story_estimation.estimated_min_stories}-${result.story_estimation.estimated_max_stories} stories`);
    } catch (error) {
      toast.error(error.message || 'Failed to analyze requirements');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // PDF parsing function with better error handling and fallbacks
  const parsePDF = async (file) => {
    try {
      // Try to import pdfjs-dist
      let pdfjsLib;
      try {
        pdfjsLib = await import('pdfjs-dist');
      } catch (importError) {
        console.error('Failed to import pdfjs-dist:', importError);
        throw new Error('PDF parsing library not available. Please convert your PDF to text format.');
      }

      // Set worker path with fallback
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Try different PDF parsing options
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        // Add options for better text extraction
        verbosity: 0, // Reduce console output
        disableAutoFetch: false,
        disableStream: false,
        // Try to handle image-based PDFs
        cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      });
      
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      let pagesWithText = 0;
      
      // Extract text from all pages with better error handling
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          
          // Try multiple text extraction methods
          let pageText = '';
          
          // Method 1: Standard text content extraction
          try {
            const textContent = await page.getTextContent();
            pageText = textContent.items
              .filter(item => item.str && item.str.trim())
              .map(item => item.str.trim())
              .join(' ');
          } catch (textError) {
            console.warn(`Standard text extraction failed for page ${pageNum}:`, textError);
          }
          
          // Method 2: Try to get text from text layer if available
          if (!pageText.trim()) {
            try {
              const textLayer = await page.getTextContent({ normalizeWhitespace: true });
              pageText = textLayer.items
                .filter(item => item.str && item.str.trim())
                .map(item => item.str.trim())
                .join(' ');
            } catch (layerError) {
              console.warn(`Text layer extraction failed for page ${pageNum}:`, layerError);
            }
          }
          
          if (pageText.trim()) {
            fullText += pageText + '\n';
            pagesWithText++;
          } else {
            console.warn(`No text found on page ${pageNum} - might be image-based`);
          }
        } catch (pageError) {
          console.warn(`Error processing page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }
      
      // Check if we got any text
      if (!fullText.trim()) {
        throw new Error('No text could be extracted from the PDF. This appears to be an image-based PDF. Please try:\n1. Converting the PDF to text using OCR tools\n2. Copying the text manually\n3. Using a different file format (TXT, DOC, DOCX)');
      }
      
      // If we got some text but not from all pages, warn the user
      if (pagesWithText < pdf.numPages) {
        console.warn(`Only ${pagesWithText} out of ${pdf.numPages} pages contained extractable text`);
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('Error parsing PDF:', error);
      
      // Provide more helpful error messages
      if (error.message.includes('Invalid PDF')) {
        throw new Error('The uploaded file is not a valid PDF or is corrupted. Please try a different file.');
      } else if (error.message.includes('No text could be extracted')) {
        throw error; // Re-throw our custom message
      } else {
        throw new Error(`Failed to parse PDF: ${error.message}. Please try converting your PDF to text format or use a different file type.`);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }

      const fileExtension = file.name.split('.').pop().toLowerCase();
      const isPdf = fileExtension === 'pdf';

      if (isPdf) {
        setIsPdfProcessing(true);
        try {
          const pdfText = await parsePDF(file);
          setValue('requirements', pdfText);
          setUploadedFile(file);
          toast.success(`PDF "${file.name}" processed successfully! Extracted ${pdfText.length} characters.`);
        } catch (error) {
          // Show more detailed error messages
          const errorMessage = error.message || 'Failed to process PDF file';
          toast.error(errorMessage, { duration: 6000 }); // Show error for 6 seconds
          console.error('PDF processing error:', error);
          
          // If it's an image-based PDF, show additional help
          if (errorMessage.includes('image-based')) {
            setTimeout(() => {
              toast('💡 Tip: Try converting your PDF to text using online OCR tools or copy the text manually', {
                duration: 8000,
                icon: '💡'
              });
            }, 2000);
          }
        } finally {
          setIsPdfProcessing(false);
        }
      } else {
        // Handle other file types (txt, md, doc, docx)
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          setValue('requirements', content);
          setUploadedFile(file);
          toast.success(`File "${file.name}" uploaded successfully!`);
        };
        reader.onerror = () => {
          toast.error('Failed to read file');
        };
        reader.readAsText(file);
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setValue('requirements', '');
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await onGenerateStories(data.requirements);
      toast.success('User stories generated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to generate user stories');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`card ${hasStories ? 'h-fit' : ''}`}>
      {!hasStories && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Generate User Stories</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Describe your project requirements and let AI generate actionable user stories with acceptance criteria.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <div className="mb-4">
            <div className="flex items-center space-x-3">
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={handleFileUpload}
                  disabled={isLoading || isPdfProcessing}
                />
                <div className="btn-secondary flex items-center space-x-2">
                  {isPdfProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>Upload File</span>
                </div>
              </label>
              
              <span className="text-xs text-gray-500">
                PDF, DOC, DOCX, TXT, MD (max 5MB)
              </span>
            </div>
            
            {uploadedFile && (
              <div className="mt-3 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            {/* PDF Processing Help */}
            {isPdfProcessing && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-800 font-medium">Processing PDF...</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  This may take a moment for large files or image-based PDFs
                </p>
              </div>
            )}
          </div>

          <textarea
            id="requirements"
            {...register('requirements', {
              required: 'Requirements are required',
              minLength: {
                value: 10,
                message: 'Requirements must be at least 10 characters long',
              },
            })}
            rows={hasStories ? 8 : 12}
            className={`input-field ${errors.requirements ? 'border-red-300 focus:ring-red-500/20' : ''}`}
            placeholder="Describe your project requirements, features, or business needs. You can also upload a file above. For example: The app should allow users to register, log in, add tasks, mark tasks as completed, and get reminders."
            disabled={isLoading || isPdfProcessing}
          />
          {errors.requirements && (
            <p className="mt-2 text-sm text-red-600 font-medium">{errors.requirements.message}</p>
          )}
          
          {requirements && (
            <p className="mt-2 text-xs text-gray-500 font-medium">
              {requirements.length} characters
            </p>
          )}

          {/* Requirements Analysis Section */}
          {analysisResult && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Requirements Analysis</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Complexity:</span>
                  <span className="ml-2 text-blue-700">{analysisResult.requirements_analysis.estimated_complexity}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Word Count:</span>
                  <span className="ml-2 text-blue-700">{analysisResult.requirements_analysis.word_count}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Estimated Stories:</span>
                  <span className="ml-2 text-blue-700 font-bold">
                    {analysisResult.story_estimation.estimated_min_stories}-{analysisResult.story_estimation.estimated_max_stories}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Features Detected:</span>
                  <span className="ml-2 text-blue-700">{analysisResult.requirements_analysis.feature_indicators}</span>
                </div>
              </div>
              
              <p className="mt-3 text-sm text-blue-700">
                {analysisResult.story_estimation.recommended_approach}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={analyzeRequirements}
              disabled={!requirements || requirements.length < 10 || isAnalyzing || isLoading}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  <span>Analyze Requirements</span>
                </>
              )}
            </button>
            
            <div className="text-sm text-gray-500 font-medium">
              {isLoading ? 'Generating user stories...' : 'Click generate to create user stories'}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || isPdfProcessing}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Generate Stories</span>
              </>
              )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserStoryForm;
