import React from 'react';
import { Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <header className="header-gradient shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">
                User Story Creation Agent
              </h1>
              <p className="text-gray-600 font-medium">
                AI-powered user story generation
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
