import React, { useState, useEffect } from 'react';

const StudentView = () => {
  const [pageData, setPageData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
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
        const response = await fetch(`http://localhost:8000/api/pages/${pageId}`);
        if (!response.ok) throw new Error('Failed to fetch quiz data');

        const data = await response.json();

        // Reset answer state if a new question is detected
        if (data.current_question?.created_at !== pageData?.current_question?.created_at) {
          setSelectedOption(null);
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

  const handleSubmitAnswer = async (optionIndex) => {
    if (!pageId || hasAnswered) return;

    try {
      const response = await fetch(`http://localhost:8000/api/pages/${pageId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          option_index: optionIndex
        })
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      setSelectedOption(optionIndex);
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {pageData.current_question.text}
            </h2>

            <div className="space-y-3">
              {pageData.current_question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSubmitAnswer(index)}
                  disabled={hasAnswered || !pageData.current_question.active}
                  className={`w-full p-4 text-left rounded-lg border transition-colors
                    ${selectedOption === index
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                    }
                    ${hasAnswered || !pageData.current_question.active
                      ? 'opacity-75 cursor-not-allowed'
                      : 'hover:border-gray-300'
                    }
                  `}
                >
                  {option.text}
                </button>
              ))}
            </div>

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
