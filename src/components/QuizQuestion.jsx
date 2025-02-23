import React, { useState, useEffect } from 'react';
import { config } from '../config';

const QuizQuestion = ({ children }) => {
    const [questionData, setQuestionData] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    // Parse the markdown-like content
    useEffect(() => {
        const lines = children.trim().split('\n');
        const questionText = lines[0].trim();
        const options = lines.slice(1).map(line => {
            const trimmed = line.trim();
            if (!trimmed.startsWith('- [')) return null;

            const isCorrect = trimmed.includes('[x]');
            const text = trimmed.replace('- [x] ', '').replace('- [ ] ', '').trim();

            return { text, is_correct: isCorrect };
        }).filter(Boolean);

        setQuestionData({ text: questionText, options });
    }, [children]);

    // Handle slide show/hide
    useEffect(() => {
        const handleSlideChange = (event) => {
            // Check if this component is in the current slide
            const currentSlide = event.currentSlide;
            const isVisible = currentSlide.contains(event.target);

            if (isVisible && !isActive) {
                pushQuestion();
            }
        };

        // Listen for Reveal.js slide change events
        document.addEventListener('slidechanged', handleSlideChange);
        return () => document.removeEventListener('slidechanged', handleSlideChange);
    }, [questionData]);

    const pushQuestion = async () => {
        if (!questionData) return;

        const pageId = localStorage.getItem('quiz_page_id');
        if (!pageId) {
            setError('No active quiz session. Please create one first.');
            return;
        }

        try {
            const response = await fetch(`${config.apiUrl}/api/pages/${pageId}/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // hardcoded API key for testing purposes
                    'api-key': 'test_key'
                },
                body: JSON.stringify(questionData)
            });

            if (!response.ok) throw new Error('Failed to push question');

            setIsActive(true);
            setStats(null);
        } catch (err) {
            setError('Failed to push question to quiz');
            console.error(questionData)
        }
    };

    const closeQuestion = async () => {
        const pageId = localStorage.getItem('quiz_page_id');
        if (!pageId || !isActive) return;

        try {
            // const response = await fetch(`http://localhost:8000/api/pages/${pageId}/close-question`, {
            const response = await fetch(`${config.apiUrl}/api/pages/${pageId}/close-question`, {
                method: 'POST',
                headers: {
                    // hardcoded API key for testing purposes
                    'api-key': 'test_key'
                }
            });

            if (!response.ok) throw new Error('Failed to close question');

            const statsData = await response.json();
            setStats(statsData);
            setIsActive(false);
        } catch (err) {
            setError('Failed to close question');
        }
    };

    if (!questionData) return null;

    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">{questionData.text}</h3>
                <div className="mt-2 space-y-2">
                    {questionData.options.map((option, index) => (
                        <div
                            key={index}
                            className={`p-2 rounded ${option.is_correct ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                } border`}
                        >
                            {option.text}
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div className="text-red-600 mb-4">
                    {error}
                </div>
            )}

            <div className="flex justify-between items-center">
                <button
                    onClick={isActive ? closeQuestion : pushQuestion}
                    className={`px-4 py-2 rounded ${isActive
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                        } text-white`}
                >
                    {isActive ? 'Close Question' : 'Start Question'}
                </button>

                {isActive && (
                    <span className="text-green-600">
                        Question is active
                    </span>
                )}
            </div>

            {stats && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                    <h4 className="font-semibold mb-2">Results:</h4>
                    <p>Total responses: {stats.total_answers}</p>
                    <div className="mt-2 space-y-2">
                        {Object.entries(stats.option_stats).map(([index, stat]) => (
                            <div key={index} className="flex flex-col">
                                <div className="flex justify-between text-sm">
                                    <span>{questionData.options[parseInt(index)].text}</span>
                                    <span>{stat.percentage.toFixed(1)}% ({stat.count})</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded overflow-hidden">
                                    <div
                                        className={`h-full ${stat.is_correct ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${stat.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizQuestion;