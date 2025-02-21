import React from 'react';
import ReactDOM from 'react-dom/client';
import QuizInit from './QuizInit';

export class QuizInitElement extends HTMLElement {
  constructor() {
    super();
    this.root = null;
  }

  connectedCallback() {
    const mountPoint = document.createElement('div');
    this.attachShadow({ mode: 'open' }).appendChild(mountPoint);

    // Add styles directly
    const style = document.createElement('style');
    style.textContent = `
      .quiz-container {
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        background: white;
        max-width: 24rem;
        margin: 1rem auto;
      }
      .title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }
      .description {
        color: #4b5563;
        margin-bottom: 1rem;
      }
      .qr-container {
        display: flex;
        justify-content: center;
        margin-bottom: 1rem;
      }
      .url-text {
        font-family: monospace;
        background: #f9fafb;
        padding: 0.5rem;
        border-radius: 0.25rem;
        word-break: break-all;
        font-size: 0.875rem;
      }
      .student-count {
        color: #4b5563;
        font-size: 0.875rem;
        margin-top: 1rem;
        text-align: center;
      }
    `;
    this.shadowRoot.appendChild(style);

    // Get title and description from attributes
    const title = this.getAttribute('title') || 'Quiz';
    const description = this.getAttribute('description') || '';

    // Create React root and render component
    this.root = ReactDOM.createRoot(mountPoint);
    this.root.render(
      <React.StrictMode>
        <QuizInit title={title} description={description} />
      </React.StrictMode>
    );
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
    }
  }
}