/**
 * Scroll utility functions to handle smooth scrolling with fixed header offset
 */

const HEADER_HEIGHT = 80; // h-20 = 80px
const ADDITIONAL_OFFSET = 20; // Extra spacing for better UX

/**
 * Smoothly scrolls to an element by ID with offset for fixed header
 * @param elementId - The ID of the element to scroll to
 * @param additionalOffset - Optional additional offset in pixels
 */
export const scrollToElement = (elementId: string, additionalOffset: number = 0) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - HEADER_HEIGHT - ADDITIONAL_OFFSET - additionalOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};

/**
 * Scrolls to an element on a different page
 * @param path - The path to navigate to
 * @param elementId - The ID of the element to scroll to
 * @param navigate - React Router navigate function
 */
export const scrollToElementOnPage = (
  path: string,
  elementId: string,
  navigate: (path: string) => void
) => {
  navigate(path);
  setTimeout(() => {
    scrollToElement(elementId);
  }, 150); // Increased timeout to ensure page is loaded
};
