import React, { useState, useEffect } from 'react';
import { config } from '../config';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const StudentView = () => {
  const [pageData, setPageData] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [error, setError] = useState(null);

  // Get page ID from URL query parameter
  const pageId = new URLSearchParams(window.location.search).get('page');

  // Poll the server for updates
  useEffect(() => {
    if (!pageId) {
      setError('No quiz page ID provided');
      return;
    }

    const pollServer = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/pages/${pageId}`);
        if (!response.ok) throw new Error('Failed to fetch quiz data');

        const data = await response.json();

        // Reset answer state if a new question is detected
        if (data.current_question?.created_at !== pageData?.current_question?.created_at) {
          setSelectedOptions([]);
          setHasAnswered(false);
        }

        setPageData(data);
        setError(null);
      } catch (err) {
        setError('Failed to connect to quiz server');
      }
    };

    // Poll every 2 seconds
    pollServer();
    const interval = setInterval(pollServer, 2000);

    return () => clearInterval(interval);
  }, [pageId, pageData?.current_question?.created_at]);

  const handleOptionToggle = (optionIndex) => {
    if (hasAnswered || !pageData.current_question.active) return;
    
    // Get the allow_multiple flag directly from the API response
    // This fixes the mismatch between backend and frontend property names
    const isMultiple = pageData.current_question.allow_multiple;
    
    if (isMultiple) {
      // For multiple choice: toggle the selection
      setSelectedOptions(prev => {
        if (prev.includes(optionIndex)) {
          return prev.filter(idx => idx !== optionIndex);
        } else {
          return [...prev, optionIndex];
        }
      });
    } else {
      // For single choice: replace selection
      setSelectedOptions([optionIndex]);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!pageId || hasAnswered || selectedOptions.length === 0) return;

    try {
      const response = await fetch(`${config.apiUrl}/api/pages/${pageId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          option_indices: selectedOptions
        })
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      setHasAnswered(true);
    } catch (err) {
      setError('Failed to submit answer');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6 text-center">
          Loading quiz...
        </div>
      </div>
    );
  }

  // Correctly determine if multiple selection is allowed using the property from the backend
  const isMultipleChoice = pageData.current_question?.allow_multiple;

  // Function to unescape special characters
  const unescapeString = (str) => {
    if (!str) return '';
    
    // Handle JSON escaping
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  };

  // Helper function to render markdown content
  const renderMarkdown = (content) => {
    // First unescape the content if it has escaped sequences
    const unescapedContent = unescapeString(content);
    
    return (
      <ReactMarkdown
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {unescapedContent}
      </ReactMarkdown>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Quiz header */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {pageData.title}
          </h1>
          <p className="text-gray-600 mt-2">
            {pageData.description}
          </p>
        </div>

        {/* Current question or waiting state */}
        {pageData.current_question ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-lg font-medium text-gray-900 mb-4 question-text">
              {renderMarkdown(pageData.current_question.text)}
            </div>
            
            {/* Instruction for multiple choice questions */}
            {isMultipleChoice && (
              <div className="text-sm text-blue-600 mb-3">
                Select all correct answers (multiple selection allowed)
              </div>
            )}

            <div className="space-y-3">
              {pageData.current_question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionToggle(index)}
                  disabled={hasAnswered || !pageData.current_question.active}
                  className={`w-full p-4 text-left rounded-lg border transition-colors flex items-start
                    ${selectedOptions.includes(index)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                    }
                    ${hasAnswered || !pageData.current_question.active
                      ? 'opacity-75 cursor-not-allowed'
                      : 'hover:border-gray-300'
                    }
                  `}
                >
                  <div className={`w-5 h-5 mt-1 mr-3 flex-shrink-0 border rounded ${isMultipleChoice ? 'rounded-sm' : 'rounded-full'} 
                    ${selectedOptions.includes(index) 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-300'}`
                  }>
                    {selectedOptions.includes(index) && (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="option-text flex-grow">
                    {renderMarkdown(option.text)}
                  </div>
                </button>
              ))}
            </div>

            {pageData.current_question.active && !hasAnswered && selectedOptions.length > 0 && (
              <button
                onClick={handleSubmitAnswer}
                className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Answer{isMultipleChoice && selectedOptions.length > 1 ? 's' : ''}
              </button>
            )}

            {hasAnswered && (
              <div className="mt-4 text-center text-green-600">
                Answer submitted
              </div>
            )}

            {!pageData.current_question.active && (
              <div className="mt-4 text-center text-gray-600">
                Question closed
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            Waiting for the next question...
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentView;