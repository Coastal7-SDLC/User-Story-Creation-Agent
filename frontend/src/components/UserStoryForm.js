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

  // PDF parsing function with better error handling
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

      // Set worker path
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        } catch (pageError) {
          console.warn(`Error extracting text from page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }
      
      if (!fullText.trim()) {
        throw new Error('No text could be extracted from the PDF. The file might be image-based or corrupted.');
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
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
          toast.error(error.message || 'Failed to process PDF file');
          console.error('PDF processing error:', error);
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
