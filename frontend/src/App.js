import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import UserStoryForm from './components/UserStoryForm';
import UserStoryList from './components/UserStoryList';
import { userStoryAPI } from './services/api';

function App() {
  const [currentStories, setCurrentStories] = useState(null);

  const handleGenerateStories = async (requirements) => {
    try {
      const response = await userStoryAPI.generateUserStories(requirements);
      const storyData = {
        userStories: response.user_stories,
        requirements: requirements,
        createdAt: new Date().toISOString(),
      };
      setCurrentStories(storyData);
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!currentStories ? (
          // Initial State: Form on left, tips on right (both centered vertically)
          <div className="flex justify-center items-center min-h-[70vh]">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full max-w-6xl">
              {/* Left Column - Form */}
              <div className="xl:col-span-2">
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <UserStoryForm 
                      onGenerateStories={handleGenerateStories}
                      hasStories={false}
                      showTips={false}
                    />
                  </div>
                </div>
              </div>
              
              {/* Right Column - Tips */}
              <div className="xl:col-span-1">
                <div className="flex justify-center items-center h-full">
                  <div className="w-full max-w-sm">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 className="text-sm font-semibold text-blue-900">Tips for better results:</h3>
                      </div>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>Be specific about user roles and their needs</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>Include the main features and functionality</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>Mention any specific business rules or constraints</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>Describe the expected user experience</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>Upload a requirements document (PDF, DOC, TXT) for complex projects</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // After Generation: Form on left, stories on right
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="xl:col-span-1">
              <UserStoryForm 
                onGenerateStories={handleGenerateStories}
                hasStories={true}
                showTips={false}
              />
            </div>
            
            {/* Right Column - Generated Stories */}
            <div className="xl:col-span-2">
              <UserStoryList
                userStories={currentStories.userStories}
                requirements={currentStories.requirements}
                createdAt={currentStories.createdAt}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
