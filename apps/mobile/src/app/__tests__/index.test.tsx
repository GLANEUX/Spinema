import { render, screen } from '@testing-library/react-native';
import Home from '../index';

const health = (status: 'ok' | 'degraded') => ({
  status,
  version: '0.1.0',
  database: status === 'ok' ? 'up' : 'down',
});

describe('Home', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shows PLAY on the VCR when the API answers', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ json: async () => health('ok') } as Response);
    await render(<Home />);
    expect(await screen.findByText('▶ PLAY')).toBeTruthy();
    expect(screen.getByText('Le magnéto est branché.')).toBeTruthy();
  });

  it('ejects when the API is unreachable', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await render(<Home />);
    expect(await screen.findByText('⏏ EJECT')).toBeTruthy();
    expect(screen.getByText('La bande a sauté.')).toBeTruthy();
  });
});
