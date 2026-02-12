const AI_REVIEW_BUTTON_ID = 'ai-pr-review-button';
const AI_REVIEW_BUTTON_LABEL = 'AI Review';

const isPullRequestPage = () => /https:\/\/github\.com\/.+\/.+\/pull\/\d+/.test(window.location.href);

const findReviewChangesAnchor = () => {
  const candidates = Array.from(document.querySelectorAll('a, button'));
  return candidates.find((el) => {
    const text = (el.textContent || '').trim().toLowerCase();
    return text.includes('review changes');
  });
};

const createAIReviewButton = () => {
  const button = document.createElement('button');
  button.id = AI_REVIEW_BUTTON_ID;
  button.type = 'button';
  button.textContent = AI_REVIEW_BUTTON_LABEL;
  button.className = 'btn btn-sm ml-2';

  button.addEventListener('click', () => {
    // Placeholder for next step: extract PR diff and call backend API.
    // eslint-disable-next-line no-console
    console.log('[AI PR Review] Triggered AI Review action.');
  });

  return button;
};

const injectAIReviewButton = () => {
  if (!isPullRequestPage() || document.getElementById(AI_REVIEW_BUTTON_ID)) {
    return;
  }

  const reviewChangesAnchor = findReviewChangesAnchor();
  if (!reviewChangesAnchor || !reviewChangesAnchor.parentElement) {
    return;
  }

  const aiButton = createAIReviewButton();
  reviewChangesAnchor.insertAdjacentElement('afterend', aiButton);
};

const observeGitHubUI = () => {
  const observer = new MutationObserver(() => {
    injectAIReviewButton();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  injectAIReviewButton();
};

if (isPullRequestPage()) {
  observeGitHubUI();
}
