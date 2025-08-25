import React, { useState } from 'react';
import { Copy, Check, Calendar, FileText, Download, ChevronDown, ChevronUp, Eye, EyeOff, List, User, Shield, Settings, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadUserStories } from '../services/api';
import JiraExport from './JiraExport';

const UserStoryList = ({ userStories, requirements, createdAt }) => {
  const [activeTab, setActiveTab] = useState('stories');
  const [showRequirements, setShowRequirements] = useState(false);
  const [expandedStories, setExpandedStories] = useState(new Set());
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle both old format (array of strings) and new format (array of objects)
  const isNewFormat = userStories && userStories.length > 0 && typeof userStories[0] === 'object';
  const stories = isNewFormat ? userStories : userStories.map(story => ({ story, acceptance_criteria: [] }));

  // Role detection and color mapping
  const getRoleInfo = (story) => {
    const roleMatch = story.match(/As a (.*?),/i);
    if (!roleMatch) return { role: 'user', color: 'blue', icon: User };
    
    const role = roleMatch[1].toLowerCase().trim();
    
    // Role color mapping
    const roleMap = {
      'user': { color: 'blue', icon: User },
      'admin': { color: 'green', icon: Shield },
      'administrator': { color: 'green', icon: Shield },
      'manager': { color: 'purple', icon: Users },
      'developer': { color: 'orange', icon: Settings },
      'customer': { color: 'teal', icon: User },
      'client': { color: 'teal', icon: User },
      'guest': { color: 'gray', icon: User },
      'visitor': { color: 'gray', icon: User }
    };
    
    // Find matching role
    for (const [key, value] of Object.entries(roleMap)) {
      if (role.includes(key)) {
        return { role: key, ...value };
      }
    }
    
    // Default for unknown roles
    return { role: role, color: 'blue', icon: User };
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyAllStories = async () => {
    const allStories = stories.map(item => item.story).join('\n\n');
    await copyToClipboard(allStories);
  };

  const copyAllWithCriteria = async () => {
    const allContent = stories.map(item => {
      let content = item.story;
      if (item.acceptance_criteria && item.acceptance_criteria.length > 0) {
        content += '\n\nAcceptance Criteria:\n' + item.acceptance_criteria.join('\n');
      }
      return content;
    }).join('\n\n---\n\n');
    await copyToClipboard(allContent);
  };

  const downloadStoriesOnly = () => {
    const content = `User Stories Generated on ${new Date(createdAt).toLocaleDateString()}\n\n` +
                   stories.map(item => item.story).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-stories-only-${new Date(createdAt).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('User stories downloaded!');
  };

  const downloadWithCriteria = () => {
    const content = `User Stories with Acceptance Criteria Generated on ${new Date(createdAt).toLocaleDateString()}\n\n` +
                   stories.map(item => {
                     let content = item.story;
                     if (item.acceptance_criteria && item.acceptance_criteria.length > 0) {
                       content += '\n\nAcceptance Criteria:\n' + item.acceptance_criteria.join('\n');
                     }
                     return content;
                   }).join('\n\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-stories-with-criteria-${new Date(createdAt).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('User stories with acceptance criteria downloaded!');
  };

  const downloadInFormat = async (format) => {
    setIsDownloading(true);
    setShowDownloadMenu(false);
    
    try {
      // Pass complete story objects with acceptance criteria
      const storyObjects = stories.map(item => ({
        story: item.story,
        acceptance_criteria: item.acceptance_criteria || []
      }));
      await downloadUserStories(storyObjects, format);
      toast.success(`User stories downloaded as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download as ${format.toUpperCase()}: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleStoryExpansion = (index) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedStories(newExpanded);
  };

  const expandAllStories = () => {
    const allExpanded = new Set(stories.map((_, index) => index));
    setExpandedStories(allExpanded);
  };

  const collapseAllStories = () => {
    setExpandedStories(new Set());
  };

  if (!stories || stories.length === 0) {
    return null;
  }

  const hasAcceptanceCriteria = stories.some(item => item.acceptance_criteria && item.acceptance_criteria.length > 0);
  const expandedCount = expandedStories.size;

  return (
    <div className="card animate-fade-in">
      {/* Header with Stats and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Generated User Stories
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>{stories.length} stories</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Download Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={isDownloading}
              className="btn-secondary flex items-center space-x-2 relative"
              title="Download in different formats"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
            
            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => downloadInFormat('txt')}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>TXT (.txt)</span>
                  </button>
                  <button
                    onClick={() => downloadInFormat('md')}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>MD (.md)</span>
                  </button>
                  <button
                    onClick={() => downloadInFormat('pdf')}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF (.pdf)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={copyAllStories}
            className="btn-primary flex items-center space-x-2"
          >
            <Copy className="w-4 h-4" />
            <span>Copy All</span>
          </button>
        </div>
      </div>

      {/* Jira Export Section */}
      <JiraExport 
        userStories={stories} 
        onExportComplete={(exportResult) => {
          toast.success(`Successfully exported ${exportResult.total_exported} stories to Jira!`);
          if (exportResult.epic) {
            toast.success(`Epic created: ${exportResult.epic.key}`);
          }
        }}
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stories')}
            className={`nav-tab ${
              activeTab === 'stories'
                ? 'nav-tab-active'
                : 'nav-tab-inactive'
            }`}
          >
            User Stories ({stories.length})
          </button>
          {hasAcceptanceCriteria && (
            <button
              onClick={() => setActiveTab('criteria')}
              className={`nav-tab ${
                activeTab === 'criteria'
                  ? 'nav-tab-active'
                  : 'nav-tab-inactive'
              }`}
            >
              Acceptance Criteria
            </button>
          )}
          <button
            onClick={() => setActiveTab('requirements')}
            className={`nav-tab ${
              activeTab === 'requirements'
                ? 'nav-tab-active'
                : 'nav-tab-inactive'
            }`}
          >
            Requirements
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'stories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold gradient-text">
              Story Preview Panel
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium">
                <span>{expandedCount} of {stories.length} expanded</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={expandAllStories}
                  className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAllStories}
                  className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stories.map((item, index) => {
              const roleInfo = getRoleInfo(item.story);
              const isExpanded = expandedStories.has(index);
              
              return (
                <div
                  key={index}
                  className={`story-card ${
                    isExpanded ? 'story-card-expanded' : ''
                  }`}
                >
                  <div 
                    className={`p-5 cursor-pointer transition-all duration-300 ${
                      isExpanded 
                        ? 'bg-gradient-to-r from-gray-50 to-blue-50' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleStoryExpansion(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`role-badge ${
                          roleInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          roleInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                          roleInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                          roleInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                          roleInfo.color === 'teal' ? 'bg-teal-100 text-teal-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <roleInfo.icon className="w-4 h-4" />
                          <span className="capitalize font-semibold">{roleInfo.role}</span>
                        </div>
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          Story {index + 1}
                        </span>
                        <span className="text-sm text-gray-600 flex-1 font-medium">
                          {item.story.split(' ').slice(0, 12).join(' ')}...
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(item.story);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200"
                          title="Copy this story"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <div className={`transition-transform duration-300 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}>
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-6 bg-white border-t border-gray-200 animate-slide-down">
                      <div className="mb-6">
                        <h4 className="font-bold text-gray-900 mb-3 text-lg">Full Story:</h4>
                        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border-2 border-gray-100 shadow-sm">
                          {item.story}
                        </p>
                      </div>
                      
                      {item.acceptance_criteria && item.acceptance_criteria.length > 0 && (
                        <div className="border-t border-gray-100 pt-6">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                            <Check className="w-5 h-5 mr-2 text-green-600" />
                            Acceptance Criteria ({item.acceptance_criteria.length}):
                          </h4>
                          <div className="space-y-3">
                            {item.acceptance_criteria.map((criteria, criteriaIndex) => (
                              <div key={criteriaIndex} className="criteria-item">
                                <span className="bg-green-200 text-green-800 text-xs font-bold px-3 py-1 rounded-full mt-0.5 flex-shrink-0 shadow-sm">
                                  {criteriaIndex + 1}
                                </span>
                                <p className="text-sm text-gray-700 flex-1 font-medium">{criteria}</p>
                                <button
                                  onClick={() => copyToClipboard(criteria)}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-green-100 rounded-lg transition-all duration-200 flex-shrink-0"
                                  title="Copy this criteria"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'criteria' && hasAcceptanceCriteria && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold gradient-text">
              Acceptance Criteria
            </h3>
            <button
              onClick={copyAllWithCriteria}
              className="btn-secondary flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy All with Criteria</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {stories.map((item, index) => {
              const roleInfo = getRoleInfo(item.story);
              
              return (
                <div key={index} className="card card-hover">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`role-badge ${
                      roleInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      roleInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                      roleInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                      roleInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      roleInfo.color === 'teal' ? 'bg-teal-100 text-teal-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      <roleInfo.icon className="w-4 h-4" />
                      <span className="capitalize font-semibold">{roleInfo.role}</span>
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      Story {index + 1}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">{item.story}</h4>
                  {item.acceptance_criteria && item.acceptance_criteria.length > 0 ? (
                    <div className="space-y-3">
                      {item.acceptance_criteria.map((criteria, criteriaIndex) => (
                        <div key={criteriaIndex} className="criteria-item">
                          <span className="bg-green-200 text-green-800 text-xs font-bold px-3 py-1 rounded-full mt-0.5 shadow-sm">
                            {criteriaIndex + 1}
                          </span>
                          <p className="text-sm text-gray-700 flex-1 font-medium">{criteria}</p>
                          <button
                            onClick={() => copyToClipboard(criteria)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-green-100 rounded-lg transition-all duration-200"
                            title="Copy this criteria"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic font-medium">No acceptance criteria available</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'requirements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold gradient-text">
              Original Requirements
            </h3>
            <button
              onClick={() => setShowRequirements(!showRequirements)}
              className="btn-secondary flex items-center space-x-2"
            >
              {showRequirements ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Hide Requirements</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Show Requirements</span>
                </>
              )}
            </button>
          </div>
          
          {showRequirements && (
            <div className="card card-hover">
              <div className="bg-white p-6 rounded-xl border-2 border-blue-100 shadow-sm">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">{requirements}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      <div className="success-message mt-8">
        <div className="flex items-center space-x-3">
          <Check className="w-6 h-6 text-green-600" />
          <span className="text-base font-bold text-green-800">
            User stories with acceptance criteria generated successfully!
          </span>
        </div>
        <p className="text-sm text-green-700 mt-2 font-medium">
          Use the tabs above to view stories, acceptance criteria, or requirements. Download options are available in the header.
        </p>
      </div>
    </div>
  );
};

export default UserStoryList;
