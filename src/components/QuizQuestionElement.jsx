import React from 'react';
import ReactDOM from 'react-dom/client';
import QuizQuestion from './QuizQuestion';

export class QuizQuestionElement extends HTMLElement {
  constructor() {
    super();
    this.root = null;
  }

  connectedCallback() {
    const mountPoint = document.createElement('div');
    this.attachShadow({ mode: 'open' }).appendChild(mountPoint);

    // Add Tailwind styles to shadow DOM
    const styleSheet = document.createElement('link');
    styleSheet.setAttribute('rel', 'stylesheet');
    styleSheet.setAttribute('href', '/src/index.css');
    this.shadowRoot.appendChild(styleSheet);

    // Get content from within the tags and preserve whitespace
    const content = this.textContent;

    // Create React root and render component
    this.root = ReactDOM.createRoot(mountPoint);
    this.root.render(
      <React.StrictMode>
        <QuizQuestion>
          {content}
        </QuizQuestion>
      </React.StrictMode>
    );
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
    }
  }
}

// Register the custom element
customElements.define('quiz-question', QuizQuestionElement);