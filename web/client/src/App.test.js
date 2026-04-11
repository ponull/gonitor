import {render, screen} from '@testing-library/react';
import App from './App';
import {MemoryRouter} from "react-router-dom";
import {NotistackWrapper} from "./components/NotistackWrapper";

test('renders login route', () => {
  render(
      <NotistackWrapper>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </NotistackWrapper>
  );
  expect(screen.getByRole('heading', {name: /sign in/i})).toBeInTheDocument();
});
