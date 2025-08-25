import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          throw new Error(data.detail || 'Bad request');
        case 404:
          throw new Error(data.detail || 'Resource not found');
        case 500:
          throw new Error(data.detail || 'Internal server error');
        default:
          throw new Error(data.detail || `HTTP ${status} error`);
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// API service functions
export const userStoryAPI = {
  // Generate user stories from requirements
  generateUserStories: async (requirements) => {
    const response = await api.post('/generate-user-stories', {
      requirements,
    });
    return response.data;
  },

  // Get all user stories with pagination
  getUserStories: async (skip = 0, limit = 10) => {
    const response = await api.get('/user-stories', {
      params: { skip, limit },
    });
    return response.data;
  },

  // Get a specific user story by ID
  getUserStoryById: async (storyId) => {
    const response = await api.get(`/user-stories/${storyId}`);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Jira integration API functions
export const jiraAPI = {
  // Health check for Jira service
  healthCheck: async () => {
    const response = await api.get('/jira/health');
    return response.data;
  },

  // Get all accessible Jira projects
  getProjects: async () => {
    const response = await api.get('/jira/projects');
    return response.data;
  },

  // Get specific project details
  getProjectDetails: async (projectKey) => {
    const response = await api.get(`/jira/projects/${projectKey}`);
    return response.data;
  },

  // Export user stories to Jira
  exportStories: async (stories, projectKey, createEpic = true, epicName = "User Stories") => {
    const response = await api.post('/jira/export-stories', {
      stories,
      project_key: projectKey,
      create_epic: createEpic,
      epic_name: epicName
    });
    return response.data;
  },

  // Get issue details
  getIssueDetails: async (issueKey) => {
    const response = await api.get(`/jira/issues/${issueKey}`);
    return response.data;
  },
};

// Download user stories in different formats
export const downloadUserStories = async (userStories, format) => {
  try {
    const response = await api.post('/download-user-stories', {
      user_stories: userStories,
      format: format
    });
    
    // Handle JSON response with content
    const { content, filename, mime_type, note, encoding } = response.data;
    
    // Show note if provided (e.g., PDF fallback to text)
    if (note) {
      console.log(note);
    }
    
    let blob;
    
    // Handle different content types
    if (format === 'pdf' && encoding === 'base64') {
      // Convert base64 PDF content to blob
      const binaryString = atob(content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: 'application/pdf' });
    } else {
      // Handle text-based formats
      blob = new Blob([content], { type: mime_type });
    }
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(error.response?.data?.detail || 'Failed to download file');
  }
};

export default api;
