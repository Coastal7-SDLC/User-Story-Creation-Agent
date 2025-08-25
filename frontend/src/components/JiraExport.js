import React, { useState, useEffect } from 'react';
import { jiraAPI } from '../services/api';

const JiraExport = ({ userStories, onExportComplete }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [epicName, setEpicName] = useState('User Stories');
  const [createEpic, setCreateEpic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jiraHealth, setJiraHealth] = useState('unknown');

  // Check Jira service health on component mount
  useEffect(() => {
    checkJiraHealth();
    if (jiraHealth === 'healthy') {
      loadProjects();
    }
  }, [jiraHealth]);

  const checkJiraHealth = async () => {
    try {
      setLoading(true);
      const health = await jiraAPI.healthCheck();
      setJiraHealth(health.status);
      if (health.status === 'healthy') {
        setError('');
      } else {
        setError('Jira service is not available');
      }
    } catch (err) {
      setJiraHealth('unhealthy');
      setError('Failed to connect to Jira service');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await jiraAPI.getProjects();
      setProjects(response.projects || []);
      if (response.projects && response.projects.length > 0) {
        setSelectedProject(response.projects[0].key);
      }
    } catch (err) {
      setError('Failed to load Jira projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedProject) {
      setError('Please select a Jira project');
      return;
    }

    if (!userStories || userStories.length === 0) {
      setError('No user stories to export');
      return;
    }

    try {
      setExporting(true);
      setError('');
      setSuccess('');

      const response = await jiraAPI.exportStories(
        userStories,
        selectedProject,
        createEpic,
        epicName
      );

      setSuccess(`Successfully exported ${response.export_result.total_exported} stories to Jira!`);
      
      // Call callback if provided
      if (onExportComplete) {
        onExportComplete(response.export_result);
      }

      // Show export details
      if (response.export_result.epic) {
        setSuccess(prev => prev + ` Epic created: ${response.export_result.epic.key}`);
      }

    } catch (err) {
      setError(err.message || 'Failed to export stories to Jira');
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const refreshProjects = () => {
    loadProjects();
  };

  if (jiraHealth === 'unhealthy') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Jira Service Unavailable
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={checkJiraHealth}
                className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Export to Jira
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            jiraHealth === 'healthy' ? 'bg-green-400' : 
            jiraHealth === 'unhealthy' ? 'bg-red-400' : 'bg-yellow-400'
          }`}></div>
          <span className="text-sm text-gray-500">
            {jiraHealth === 'healthy' ? 'Connected' : 
             jiraHealth === 'unhealthy' ? 'Disconnected' : 'Checking...'}
          </span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        </div>
      )}

      {!loading && jiraHealth === 'healthy' && (
        <div className="space-y-4">
          {/* Project Selection */}
          <div>
            <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-2">
              Jira Project
            </label>
            <div className="flex space-x-2">
              <select
                id="project-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.key} value={project.key}>
                    {project.key} - {project.name}
                  </option>
                ))}
              </select>
              <button
                onClick={refreshProjects}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Epic Configuration */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="create-epic"
              checked={createEpic}
              onChange={(e) => setCreateEpic(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="create-epic" className="text-sm font-medium text-gray-700">
              Create Epic
            </label>
          </div>

          {createEpic && (
            <div>
              <label htmlFor="epic-name" className="block text-sm font-medium text-gray-700 mb-2">
                Epic Name
              </label>
              <input
                type="text"
                id="epic-name"
                value={epicName}
                onChange={(e) => setEpicName(e.target.value)}
                placeholder="Enter epic name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={!selectedProject || exporting || userStories.length === 0}
            className={`w-full px-4 py-2 rounded-md font-medium text-white ${
              !selectedProject || exporting || userStories.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {exporting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </div>
            ) : (
              `Export ${userStories.length} Stories to Jira`
            )}
          </button>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  This will create {userStories.length} user stories in your selected Jira project.
                  {createEpic && ' An epic will be created to group all related stories.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JiraExport;
