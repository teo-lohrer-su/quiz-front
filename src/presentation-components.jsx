import React from 'react'
import './index.css'
import { QuizInitElement } from './components/QuizInitElement'
import { QuizQuestionElement } from './components/QuizQuestionElement'

// Make React available globally
window.React = React;

// Register components
customElements.define('quiz-init', QuizInitElement);
customElements.define('quiz-question', QuizQuestionElement);

// Export our components
export { QuizInitElement, QuizQuestionElement }