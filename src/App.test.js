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
  const openWindow = jest.spyOn(window, 'open').mockReturnValue(null);
  render(<App />);
  expect(activeBackground()).toBe('/videos/home/home_page1.mp4');
  const homeVideo = activeVideo();
  click('Começar');
  expect(activeBackground()).toBe('/videos/estudo/estudo_3.mp4');
  expect(activeVideo()).not.toBe(homeVideo);
  click('Abrir mini-timer flutuante');
  click('Encerrar sessão');
  expect(activeBackground()).toBe('/videos/home/home_page2.mp4');
  click('Começar');
  expect(activeBackground()).toBe('/videos/estudo/estudo_girl_studying.mp4');
  openWindow.mockRestore();
});

test('alterna a cena de entrada ao retornar para a home', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0);
  render(<App />);
  click('Pausa curta');
  expect(activeBackground()).toBe('/videos/pausa/pausa.mp4');
  click('Pomodoro');
  expect(activeBackground()).toBe('/videos/home/home_page2.mp4');
});

test('mantém o card estável durante a sessão e permite navegar entre faixas', () => {
  render(<App />);
  click('Começar');
  const card = document.querySelector('.timer-card');
  expect(card).toHaveClass('timer-card--focus');
  fireEvent.mouseEnter(card);
  expect(card).not.toHaveClass('timer-card--details-visible');
  fireEvent.mouseLeave(card);
  expect(card).not.toHaveClass('timer-card--details-visible');
  click('Abrir menu de música');
  expect(screen.getByRole('button', { name: /Lofi Chill Beats/ })).toHaveClass('is-selected');
  click('Próxima faixa');
  expect(screen.getByRole('button', { name: /Jazz Vibes/ })).toHaveClass('is-selected');
  click('Faixa anterior');
  expect(screen.getByRole('button', { name: /Lofi Chill Beats/ })).toHaveClass('is-selected');
});

test('reduz o anel circular de progresso junto com o tempo da sessão', () => {
  render(<App />);
  const ring = screen.getByRole('progressbar', { name: 'Progresso do timer' });
  expect(ring).toHaveAttribute('aria-valuenow', '100');
  click('Começar');
  act(() => jest.advanceTimersByTime(150000));
  expect(ring).toHaveAttribute('aria-valuenow', '90');
});

test('pausa e retoma preservando o tempo, sem contar encerramentos', () => {
  const openWindow = jest.spyOn(window, 'open').mockReturnValue(null);
  render(<App />);
  click('Começar');
  act(() => jest.advanceTimersByTime(10000));
  click('Pausar');
  expect(screen.getByRole('timer')).toHaveTextContent('24:50');
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.getByRole('timer')).toHaveTextContent('24:50');
  click('Retomar');
  click('Abrir mini-timer flutuante');
  click('Encerrar sessão');
  expect(screen.getByText('Sessão encerrada sem contabilizar')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('pomocute-session-v1')).count).toBe(0);
  openWindow.mockRestore();
});
test('sincroniza ao retornar após suspensão e conta apenas uma vez', () => {
  render(<App />); click('Começar');
  act(() => { jest.setSystemTime(Date.now() + 1500001); window.dispatchEvent(new Event('focus')); });
  expect(screen.getByText('Sessão concluída!')).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('pomocute-session-v1')).count).toBe(1);
  act(() => jest.advanceTimersByTime(5000));
  expect(JSON.parse(localStorage.getItem('pomocute-session-v1')).count).toBe(1);
  click('Pausa curta'); click('Começar');
  act(() => jest.advanceTimersByTime(300000));
  expect(JSON.parse(localStorage.getItem('pomocute-session-v1')).count).toBe(1);
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
  click('Abrir menu de música');
  await act(async () => click('Tocar música'));
  expect(screen.getByText(/Música indisponível/)).toBeInTheDocument();
  expect(screen.getByRole('timer')).toHaveTextContent('25:00');
});

test('aceita um link do YouTube e abre o player externo', () => {
  render(<App />);
  click('Abrir menu de música');
  fireEvent.change(screen.getByLabelText('Link do YouTube ou Spotify'), {
    target: { value: 'https://www.youtube.com/watch?v=M7lc1UVf-VE' },
  });
  click('Adicionar link');
  expect(screen.getByLabelText('Player youtube')).toBeInTheDocument();
  expect(screen.getByTitle('Vídeo do YouTube')).toHaveAttribute('src', expect.stringContaining('M7lc1UVf-VE'));
  expect(document.querySelector('.timer-card')).toHaveClass('timer-card--embed-reactive');
  click('Fechar player externo');
  expect(document.querySelector('.timer-card')).not.toHaveClass('timer-card--embed-reactive');
});

test('quarta conclusão sugere pausa longa e recarga não duplica o contador', () => {
  localStorage.setItem('pomocute-session-v1', JSON.stringify({ mode: 'pomodoro', status: 'running',
    remaining: 1500000, deadline: Date.now() - 1, count: 3 }));
  const first = render(<App />);
  expect(screen.getByText('Escolha uma pausa acima para continuar.')).toBeInTheDocument();
  first.unmount(); render(<App />);
  expect(screen.getByText('Escolha uma pausa acima para continuar.')).toBeInTheDocument();
});

test('mantém modos fora da esfera e apenas o controle principal no timer', () => {
  render(<App />);
  expect(document.querySelector('.timer-card .session-mode-selector')).not.toBeInTheDocument();
  expect(document.querySelector('.session-mode-selector')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Começar' })).toHaveClass('timer-toggle');
  expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument();
});

test('habilita as pausas quando o foco é pausado', () => {
  render(<App />);
  click('Começar');
  click('Pausar');
  const shortBreak = screen.getByRole('button', { name: 'Pausa curta' });
  const longBreak = screen.getByRole('button', { name: 'Pausa longa' });
  expect(shortBreak).not.toBeDisabled();
  expect(longBreak).not.toBeDisabled();
  fireEvent.click(shortBreak);
  expect(screen.getByText('Pronto para começar')).toBeInTheDocument();
  expect(screen.getByRole('timer')).toHaveTextContent('05:00');
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

  expect(requestWindow).toHaveBeenCalledWith({
    width: 360,
    height: 160,
    preferInitialWindowPlacement: true,
  });
  expect(screen.getByRole('progressbar', { name: 'Progresso da sessão' })).toHaveAttribute('aria-valuenow', '0');
  fireEvent.click(screen.getByRole('button', { name: 'Pausar timer' }));
  expect(screen.getByRole('button', { name: 'Retomar timer' })).toBeInTheDocument();
  expect(screen.getByText('Sessão pausada')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Encerrar sessão' }));
  expect(screen.getByText('Sessão encerrada sem contabilizar')).toBeInTheDocument();
});

test('mantém um mini-timer dentro da página quando PiP não está disponível', () => {
  const openWindow = jest.spyOn(window, 'open').mockReturnValue(null);
  render(<App />);
  expect(screen.getByRole('button', { name: 'Abrir mini-timer flutuante' })).toBeInTheDocument();
  click('Começar');
  click('Abrir mini-timer flutuante');

  expect(screen.getByText(/mini-timer abriu nesta página/)).toBeInTheDocument();
  const fallback = document.querySelector('.mini-timer-fallback');
  expect(fallback).toBeInTheDocument();
  fireEvent.click(within(fallback).getByRole('button', { name: 'Pausar timer' }));
  expect(screen.getByText('Sessão pausada')).toBeInTheDocument();
  fireEvent.click(within(fallback).getByRole('button', { name: 'Encerrar sessão' }));
  expect(screen.getByText('Sessão encerrada sem contabilizar')).toBeInTheDocument();
  openWindow.mockRestore();
});
