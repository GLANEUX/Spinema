import { render, screen } from '@testing-library/react-native';
import { Logo } from '../Logo';

describe('Logo', () => {
  it('shows the wordmark as a header', async () => {
    await render(<Logo />);
    expect(screen.getByRole('header', { name: 'Spinema' })).toBeTruthy();
    expect(screen.getByText('SPINEMA')).toBeTruthy();
  });
});
