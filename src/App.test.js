import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
beforeEach(() => {
  delete window.documentPictureInPicture;
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-19T12:00:00Z'));
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
const click = name => fireEvent.click(screen.getByRole('button', { name, exact: true }));
const activeBackground = () => document.querySelector('.background-scene--current').getAttribute('src');
const activeVideo = () => document.querySelector('.background-scene--current');

test('alterna a cena de foco a cada nova sessão', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0);
  render(<App />);
  expect(activeBackground()).toBe('/videos/home/home_page1.mp4');
  const homeVideo = activeVideo();
  click('Começar');
  expect(activeBackground()).toBe('/videos/estudo/estudo_3.mp4');
  expect(activeVideo()).not.toBe(homeVideo);
  click('Encerrar');
  expect(activeBackground()).toBe('/videos/home/home_page2.mp4');
  click('Começar');
  expect(activeBackground()).toBe('/videos/estudo/estudo_girl_studying.mp4');
});

test('alterna a cena de entrada ao retornar para a home', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0);
  render(<App />);
  click('Pausa curta');
  expect(activeBackground()).toBe('/videos/pausa/pausa.mp4');
  click('Pomodoro');
  expect(activeBackground()).toBe('/videos/home/home_page2.mp4');
});

test('compacta o card durante uma sessão ativa e permite navegar entre faixas', () => {
  render(<App />);
  click('Começar');
  const card = document.querySelector('.timer-card');
  expect(card).toHaveClass('timer-card--focus');
  expect(card).not.toHaveClass('timer-card--details-visible');
  fireEvent.mouseEnter(card);
  expect(card).toHaveClass('timer-card--details-visible');
  fireEvent.mouseLeave(card);
  expect(card).not.toHaveClass('timer-card--details-visible');
  expect(screen.getByLabelText('Escolher trilha:')).toHaveValue('https://stream.laut.fm/lofi');
  click('Próxima faixa');
  expect(screen.getByLabelText('Escolher trilha:')).toHaveValue('https://stream.laut.fm/jazzradio');
  click('Faixa anterior');
  expect(screen.getByLabelText('Escolher trilha:')).toHaveValue('https://stream.laut.fm/lofi');
});

test('pausa e retoma preservando o tempo, sem contar encerramentos', () => {
  render(<App />);
  click('Começar');
  act(() => jest.advanceTimersByTime(10000));
  click('Pausar');
  expect(screen.getByRole('timer')).toHaveTextContent('24:50');
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.getByRole('timer')).toHaveTextContent('24:50');
  click('Retomar'); click('Encerrar');
  expect(screen.getByText('Sessão encerrada sem contabilizar')).toBeInTheDocument();
  expect(screen.getByText('0', { selector: 'strong' })).toBeInTheDocument();
});
test('sincroniza ao retornar após suspensão e conta apenas uma vez', () => {
  render(<App />); click('Começar');
  act(() => { jest.setSystemTime(Date.now() + 1500001); window.dispatchEvent(new Event('focus')); });
  expect(screen.getByText('Sessão concluída!')).toBeInTheDocument();
  expect(screen.getByText('1', { selector: 'strong' })).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(5000));
  expect(screen.getByText('1', { selector: 'strong' })).toBeInTheDocument();
  click('Preparar pausa curta'); click('Começar');
  act(() => jest.advanceTimersByTime(300000));
  expect(screen.getByText('1', { selector: 'strong' })).toBeInTheDocument();
});
test('restaura sessão ativa após recarga', () => {
  const first = render(<App />); click('Começar'); first.unmount();
  act(() => jest.setSystemTime(Date.now() + 60000));
  render(<App />);
  expect(screen.getByRole('timer')).toHaveTextContent('24:00');
});
test('mostra falha do player sem afetar o timer', async () => {
  HTMLMediaElement.prototype.play.mockRejectedValue(new Error('offline'));
  render(<App />);
  await act(async () => click('Tocar música'));
  expect(screen.getByText(/Música indisponível/)).toBeInTheDocument();
  expect(screen.getByRole('timer')).toHaveTextContent('25:00');
});

test('quarta conclusão sugere pausa longa e recarga não duplica o contador', () => {
  localStorage.setItem('pomocute-session-v1', JSON.stringify({ mode: 'pomodoro', status: 'running',
    remaining: 1500000, deadline: Date.now() - 1, count: 3 }));
  const first = render(<App />);
  expect(screen.getByText('4', { selector: 'strong' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Preparar pausa longa' })).toBeInTheDocument();
  first.unmount(); render(<App />);
  expect(screen.getByText('4', { selector: 'strong' })).toBeInTheDocument();
});
test('dados locais inválidos não impedem iniciar uma sessão', () => {
  localStorage.setItem('pomocute-session-v1', '{invalid');
  render(<App />);
  expect(screen.getByRole('timer')).toHaveTextContent('25:00');
  click('Começar');
  expect(screen.getByText('Hora de focar')).toBeInTheDocument();
});

test('abre mini-timer em uma janela PiP e mantém os controles sincronizados', async () => {
  const pipWindow = {
    document,
    closed: false,
    focus: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const requestWindow = jest.fn().mockResolvedValue(pipWindow);
  Object.defineProperty(window, 'documentPictureInPicture', {
    configurable: true,
    value: { requestWindow },
  });

  render(<App />);
  click('Começar');
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Abrir mini-timer flutuante' }));
  });

  expect(requestWindow).toHaveBeenCalledWith({ width: 340, height: 220 });
  expect(screen.getByRole('progressbar', { name: 'Progresso da sessão' })).toHaveAttribute('aria-valuenow', '0');
  fireEvent.click(screen.getByRole('button', { name: 'Pausar timer' }));
  expect(screen.getByText('Sessão pausada')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Encerrar sessão' }));
  expect(screen.getByText('Sessão encerrada sem contabilizar')).toBeInTheDocument();
});

test('mantém um mini-timer dentro da página quando PiP não está disponível', () => {
  render(<App />);
  expect(screen.queryByRole('button', { name: 'Abrir mini-timer flutuante' })).not.toBeInTheDocument();
  click('Começar');
  click('Abrir mini-timer flutuante');

  expect(screen.getByText(/mini-timer abriu nesta página/)).toBeInTheDocument();
  const fallback = document.querySelector('.mini-timer-fallback');
  expect(fallback).toBeInTheDocument();
  fireEvent.click(within(fallback).getByRole('button', { name: 'Pausar timer' }));
  expect(screen.getByText('Sessão pausada')).toBeInTheDocument();
  fireEvent.click(within(fallback).getByRole('button', { name: 'Encerrar sessão' }));
  expect(screen.getByText('Sessão encerrada sem contabilizar')).toBeInTheDocument();
});
