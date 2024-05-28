import { removeButtons } from '../../scripts/scripts.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const loadVideo = (container, autoplay) => {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  video.dataset.loading = 'true';
  video.addEventListener('loadedmetadata', () => delete video.dataset.loading);

  if (autoplay) {
    if (!prefersReducedMotion.matches) {
      video.setAttribute('autoplay', '');
    }
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.removeAttribute('controls');
    video.addEventListener('canplay', () => {
      video.muted = true;
      if (!prefersReducedMotion.matches) {
        video.play();
      }
    });
  }

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', container.dataset.videoHref);
  sourceEl.setAttribute('type', 'video/mp4');
  video.append(sourceEl);
  container.append(video);
};

/**
 * decorate the video block
 * @param {Element} block the block
 */
export default async function decorate(block) {
  const content = [];
  block.querySelectorAll(':scope > div > div').forEach((col, idx) => {
    if (idx === 0 && col.querySelector('a')) {
      col.className = 'video-video';
      const videoHref = col.querySelector('a').href;
      col.dataset.videoHref = videoHref;
      col.textContent = '';
    } else {
      col.className = 'video-content';
      removeButtons(col);
    }
    content.push(col);
  });

  const overlay = document.createElement('div');
  overlay.className = 'video-content-overlay';

  const togglePlayState = document.createElement('button');
  togglePlayState.setAttribute('type', 'button');
  togglePlayState.setAttribute('aria-label', 'Pause Video');
  togglePlayState.className = 'video-control';
  togglePlayState.addEventListener('click', () => {
    togglePlayState.classList.toggle('playing');
    const vid = block.querySelector('video');
    if (vid) {
      if (vid.paused) {
        vid.play();
        togglePlayState.setAttribute('aria-label', 'Pause Video');
      } else {
        vid.pause();
        togglePlayState.setAttribute('aria-label', 'Play Video');
      }
    }
  });
  if (!prefersReducedMotion.matches) {
    togglePlayState.classList.add('playing');
    togglePlayState.setAttribute('aria-label', 'Pause Video');
  }
  overlay.append(togglePlayState);

  const overlayLink = block.querySelector('.video-content a');
  if (overlayLink) {
    const cloned = overlayLink.cloneNode(false);
    cloned.classList.add('shop-link');
    overlay.append(cloned);
  }
  content.push(overlay);

  if (block.classList.contains('autoplay')) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        loadVideo(block.querySelector('.video-video'), true);
      }
    });
    observer.observe(block);
  } else {
    loadVideo(block.querySelector('.video-video'), false);
  }

  block.replaceChildren(...content);
}
