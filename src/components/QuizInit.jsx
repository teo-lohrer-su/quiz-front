import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QuizInit = ({ title, description }) => {
  const [pageId, setPageId] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const createQuiz = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/pages/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': 'test_key'
          },
          body: JSON.stringify({ title, description })
        });
        
        if (!response.ok) throw new Error('Failed to create quiz');
        
        const data = await response.json();
        setPageId(data.page_id);
        localStorage.setItem('quiz_page_id', data.page_id);
      } catch (err) {
        setError('Failed to create quiz session');
      }
    };

    createQuiz();
  }, [title, description]);

  useEffect(() => {
    if (!pageId) return;

    const pollStudentCount = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/pages/${pageId}`);
        if (!response.ok) throw new Error('Failed to fetch quiz data');
        
        const data = await response.json();
        setStudentCount(data.answers?.length || 0);
      } catch (err) {
        console.error('Failed to fetch student count:', err);
      }
    };

    const interval = setInterval(pollStudentCount, 5000);
    return () => clearInterval(interval);
  }, [pageId]);

  if (error) {
    return <div style={{ color: '#dc2626' }}>{error}</div>;
  }

  const studentUrl = pageId 
    ? `${window.location.origin}?page=${pageId}`
    : '';

  return (
    <div className="quiz-container">
      <h2 className="title">{title}</h2>
      <p className="description">{description}</p>
      
      {pageId && (
        <>
          <div className="qr-container">
            <QRCodeSVG value={studentUrl} size={200} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
              Scan to join or visit:
            </p>
            <p className="url-text">{studentUrl}</p>
            <p className="student-count">
              Connected students: {studentCount}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default QuizInit;