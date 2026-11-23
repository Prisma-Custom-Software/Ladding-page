import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import CarouselViewer from './CarouselViewer.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const slides = [1, 2, 3, 4].map((n) => ({ n, video: `/s${n}.mp4`, poster: `/s${n}.webp` }));

let host, root;
beforeAll(() => {
  // jsdom nao implementa midia
  window.HTMLMediaElement.prototype.play = function play() {
    this.dataset.playing = '1';
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function pause() {
    delete this.dataset.playing;
  };
});
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<CarouselViewer slides={slides} title="Carrossel" />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const counter = () => host.querySelector('[aria-live]').textContent.replace(/\s/g, '');
const btn = (label) => host.querySelector(`button[aria-label="${label}"]`);
const playing = () => [...host.querySelectorAll('video')].filter((v) => v.dataset.playing).map((v) => v.getAttribute('src'));

describe('CarouselViewer', () => {
  it('começa no primeiro slide tocando só o vídeo dele', () => {
    expect(counter()).toBe('01/04');
    expect(btn('Slide anterior').disabled).toBe(true);
    expect(playing()).toEqual(['/s1.mp4']);
  });

  it('setas avançam e voltam, sem passar dos limites', () => {
    act(() => btn('Próximo slide').click());
    expect(counter()).toBe('02/04');
    expect(playing()).toEqual(['/s2.mp4']);
    act(() => btn('Slide anterior').click());
    expect(counter()).toBe('01/04');
    act(() => btn('Ir para o slide 4').click());
    expect(counter()).toBe('04/04');
    expect(btn('Próximo slide').disabled).toBe(true);
  });

  it('teclado: setas esquerda e direita', () => {
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })));
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })));
    expect(counter()).toBe('03/04');
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })));
    expect(counter()).toBe('02/04');
  });

  it('marca a bolinha do slide atual', () => {
    act(() => btn('Ir para o slide 3').click());
    expect(btn('Ir para o slide 3').getAttribute('aria-current')).toBe('true');
    expect(btn('Ir para o slide 1').getAttribute('aria-current')).toBeNull();
  });
});
