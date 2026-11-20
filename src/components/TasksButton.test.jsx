import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { getStoredUser } from '../services/auth';
import { createTask, deleteTask, listTasks } from '../services/data';
import TasksButton from './TasksButton';

jest.mock('./ClickSound', () => ({ playClick: jest.fn() }));
jest.mock('../services/auth', () => ({ getStoredUser: jest.fn() }));
jest.mock('../services/data', () => ({
  createTask: jest.fn(),
  deleteTask: jest.fn(),
  listTasks: jest.fn(),
}));

const storageKey = 'pomocute-tasks-v1:user-1';
const task = { id: 'remote-id', syncId: 'client-id', title: 'Tarefa antiga', done: false };
const row = { id: task.id, client_id: task.syncId, title: task.title, completed: false };

function openTasks() {
  const view = render(<I18nProvider language="pt-BR"><TasksButton /></I18nProvider>);
  fireEvent.click(screen.getByRole('button', { name: /tarefa/i }));
  return view;
}

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
  getStoredUser.mockReturnValue({ id: 'user-1' });
  localStorage.setItem(storageKey, JSON.stringify([task]));
});

test('mantém a exclusão offline após recarregar e envia ao reconectar', async () => {
  listTasks.mockRejectedValue(new Error('offline'));
  const view = openTasks();
  fireEvent.click(screen.getByRole('button', { name: 'Excluir Tarefa antiga' }));
  expect(screen.queryByText(task.title)).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(storageKey))).toEqual([
    expect.objectContaining({ deleted: true, pending: true }),
  ]);
  view.unmount();

  openTasks();
  expect(screen.queryByText(task.title)).not.toBeInTheDocument();
  listTasks.mockResolvedValue([row]);
  deleteTask.mockResolvedValue(true);
  fireEvent(window, new Event('online'));

  await waitFor(() => expect(deleteTask).toHaveBeenCalledWith(expect.objectContaining({ id: task.id })));
  await waitFor(() => expect(JSON.parse(localStorage.getItem(storageKey))).toEqual([]));
  expect(screen.queryByText(task.title)).not.toBeInTheDocument();
});

test('não recria tarefa em cache que já foi excluída em outro dispositivo', async () => {
  listTasks.mockResolvedValue([]);
  openTasks();
  await waitFor(() => expect(screen.queryByText(task.title)).not.toBeInTheDocument());
  expect(createTask).not.toHaveBeenCalled();
});
