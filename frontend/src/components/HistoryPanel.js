import React, { useState, useEffect } from 'react';
import { History, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { userStoryAPI } from '../services/api';
import toast from 'react-hot-toast';

const HistoryPanel = ({ onSelectStory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadStories = async (pageNum = 0) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await userStoryAPI.getUserStories(pageNum * 10, 10);
      const newStories = pageNum === 0 ? response.user_stories : [...stories, ...response.user_stories];
      setStories(newStories);
      setHasMore(response.total > newStories.length);
      setPage(pageNum);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStories();
    }
  }, [isOpen, loadStories]);

  const handleViewStory = (story) => {
    onSelectStory(story);
    setIsOpen(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
      >
        <div className="flex items-center space-x-3">
          <History className="w-5 h-5 text-gray-600" />
          <div className="text-left">
            <h3 className="font-medium text-gray-900">Generation History</h3>
            <p className="text-sm text-gray-500">
              View previously generated user stories
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          {loading && stories.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner"></div>
              <span className="ml-2 text-gray-500">Loading history...</span>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No user stories generated yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Generate your first user story to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium mb-1">
                        {story.user_stories.length} user stories
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        {truncateText(story.requirements)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(story.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-3">
                      <button
                        onClick={() => handleViewStory(story)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <button
                  onClick={() => loadStories(page + 1)}
                  disabled={loading}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner w-4 h-4"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Load More</span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
