```javascript
// __tests__/App.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import * as api from '../api/songs';

// Mock API
jest.mock('../api/songs');

const mockSongs = [
  {
    id: 1,
    artist: 'Dena',
    track: 'Cash, Diamond Ring, Swimming Pools',
    link: 'http://www.youtube.com/watch?v=r4CDc9yCAqE',
  },
  {
    id: 2,
    artist: 'Jessy Lanza',
    track: 'Kathy Lee',
    link: 'http://vimeo.com/73455369',
  },
];

describe('MINI React App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm for delete
    window.confirm = jest.fn(() => true);
  });

  describe('Component rendering', () => {
    test('renders the home page', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );
      expect(
        screen.getByText(/You are in the View: application\/view\/home\/index.php/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/home/i)).toBeInTheDocument();
      expect(screen.getByText(/subpage/i)).toBeInTheDocument();
      expect(screen.getByText(/songs/i)).toBeInTheDocument();
    });

    test('renders example one page', () => {
      render(
        <MemoryRouter initialEntries={['/home/exampleone']}>
          <App />
        </MemoryRouter>
      );
      expect(
        screen.getByText(/You are in the View: application\/view\/home\/example_one.php/i)
      ).toBeInTheDocument();
    });

    test('renders example two page', () => {
      render(
        <MemoryRouter initialEntries={['/home/exampletwo']}>
          <App />
        </MemoryRouter>
      );
      expect(
        screen.getByText(/You are in the View: application\/view\/home\/example_two.php/i)
      ).toBeInTheDocument();
    });

    test('renders error page for unknown route', () => {
      render(
        <MemoryRouter initialEntries={['/foo/bar']}>
          <App />
        </MemoryRouter>
      );
      expect(
        screen.getByText(/This is the Error-page. Will be shown when a page/i)
      ).toBeInTheDocument();
    });

    test('renders songs page with list', async () => {
      api.getSongs.mockResolvedValue({ songs: mockSongs, count: 2 });
      render(
        <MemoryRouter initialEntries={['/songs']}>
          <App />
        </MemoryRouter>
      );
      expect(
        screen.getByText(/You are in the View: application\/view\/song\/index.php/i)
      ).toBeInTheDocument();

      // Wait for songs to load
      expect(await screen.findByText('Dena')).toBeInTheDocument();
      expect(screen.getByText('Jessy Lanza')).toBeInTheDocument();
      expect(screen.getByText('Cash, Diamond Ring, Swimming Pools')).toBeInTheDocument();
      expect(screen.getByText('Kathy Lee')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // amount_of_songs
    });

    test('renders edit song page with song data', async () => {
      api.getSong.mockResolvedValue(mockSongs[0]);
      render(
        <MemoryRouter initialEntries={['/songs/editsong/1']}>
          <App />
        </MemoryRouter>
      );
      expect(
        screen.getByText(/You are in the View: application\/view\/song\/edit.php/i)
      ).toBeInTheDocument();

      expect(await screen.findByDisplayValue('Dena')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Cash, Diamond Ring, Swimming Pools')).toBeInTheDocument();
      expect(screen.getByDisplayValue('http://www.youtube.com/watch?v=r4CDc9yCAqE')).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    test('add song form requires artist and track', async () => {
      api.getSongs.mockResolvedValue({ songs: [], count: 0 });
      render(
        <MemoryRouter initialEntries={['/songs']}>
          <App />
        </MemoryRouter>
      );

      const artistInput = await screen.findByLabelText(/Artist/i);
      const trackInput = screen.getByLabelText(/Track/i);
      const submitBtn = screen.getByRole('button', { name: /submit/i });

      // Both required: try submitting empty
      fireEvent.click(submitBtn);

      expect(artistInput).toBeRequired();
      expect(trackInput).toBeRequired();
      expect(screen.getByText(/Artist is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Track is required/i)).toBeInTheDocument();

      // Fill only artist
      fireEvent.change(artistInput, { target: { value: 'Test Artist' } });
      fireEvent.click(submitBtn);
      expect(screen.queryByText(/Artist is required/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Track is required/i)).toBeInTheDocument();

      // Fill both
      fireEvent.change(trackInput, { target: { value: 'Test Track' } });
      fireEvent.click(submitBtn);
      expect(screen.queryByText(/Artist is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Track is required/i)).not.toBeInTheDocument();
    });

    test('edit song form requires artist and track', async () => {
      api.getSong.mockResolvedValue(mockSongs[0]);
      render(
        <MemoryRouter initialEntries={['/songs/editsong/1']}>
          <App />
        </MemoryRouter>
      );

      const artistInput = await screen.findByLabelText(/Artist/i);
      const trackInput = screen.getByLabelText(/Track/i);
      const updateBtn = screen.getByRole('button', { name: /update/i });

      // Clear artist and try to submit
      fireEvent.change(artistInput, { target: { value: '' } });
      fireEvent.click(updateBtn);
      expect(screen.getByText(/Artist is required/i)).toBeInTheDocument();

      // Clear track and try to submit
      fireEvent.change(artistInput, { target: { value: 'Dena' } });
      fireEvent.change(trackInput, { target: { value: '' } });
      fireEvent.click(updateBtn);
      expect(screen.getByText(/Track is required/i)).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    test('can add a song and refreshes list', async () => {
      api.getSongs
        .mockResolvedValueOnce({ songs: mockSongs, count: 2 })
        .mockResolvedValueOnce({
          songs: [
            ...mockSongs,
            {
              id: 3,
              artist: 'New Artist',
              track: 'New Track',
              link: 'http://example.com',
            },
          ],
          count: 3,
        });
      api.addSong.mockResolvedValue({ id: 3 });

      render(
        <MemoryRouter initialEntries={['/songs']}>
          <App />
        </MemoryRouter>
      );

      const artistInput = await screen.findByLabelText(/Artist/i);
      const trackInput = screen.getByLabelText(/Track/i);
      const linkInput = screen.getByLabelText(/Link/i);
      const submitBtn = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(artistInput, { target: { value: 'New Artist' } });
      fireEvent.change(trackInput, { target: { value: 'New Track' } });
      fireEvent.change(linkInput, { target: { value: 'http://example.com' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.addSong).toHaveBeenCalledWith({
          artist: 'New Artist',
          track: 'New Track',
          link: 'http://example.com',
        });
      });

      // After add, new song appears
      expect(await screen.findByText('New Artist')).toBeInTheDocument();
      expect(screen.getByText('New Track')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // updated amount_of_songs
    });

    test('can delete a song and refreshes list', async () => {
      api.getSongs
        .mockResolvedValueOnce({ songs: mockSongs, count: 2 })
        .mockResolvedValueOnce({ songs: [mockSongs[1]], count: 1 });
      api.deleteSong.mockResolvedValue({});

      render(
        <MemoryRouter initialEntries={['/songs']}>
          <App />
        </MemoryRouter>
      );

      // Wait for table
      const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(api.deleteSong).toHaveBeenCalledWith(1);
      });

      // After delete, only 1 song remains
      expect(await screen.findByText('Jessy Lanza')).toBeInTheDocument();
      expect(screen.queryByText('Dena')).not.toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // updated amount_of_songs
    });

    test('can edit a song and updates list', async () => {
      api.getSong.mockResolvedValue(mockSongs[0]);
      api.updateSong.mockResolvedValue({});
      api.getSongs
        .mockResolvedValueOnce({ songs: mockSongs, count: 2 })
        .mockResolvedValueOnce({
          songs: [
            {
              ...mockSongs[0],
              artist: 'Dena Edited',
            },
            mockSongs[1],
          ],
          count: 2,
        });

      render(
        <MemoryRouter initialEntries={['/songs/editsong/1']}>
          <App />
        </MemoryRouter>
      );

      const artistInput = await screen.findByLabelText(/Artist/i);
      const updateBtn = screen.getByRole('button', { name: /update/i });

      fireEvent.change(artistInput, { target: { value: 'Dena Edited' } });
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(api.updateSong).toHaveBeenCalledWith({
          artist: 'Dena Edited',
          track: 'Cash, Diamond Ring, Swimming Pools',
          link: 'http://www.youtube.com/watch?v=r4CDc9yCAqE',
          song_id: 1,
        });
      });

      // After update, should redirect to /songs and show updated artist
      expect(await screen.findByText('Dena Edited')).toBeInTheDocument();
    });

    test('AJAX button fetches amount of songs', async () => {
      api.getSongs.mockResolvedValue({ songs: mockSongs, count: 2 });
      api.getSongCount.mockResolvedValueOnce(2);

      render(
        <MemoryRouter initialEntries={['/songs']}>
          <App />
        </MemoryRouter>
      );

      const ajaxBtn = await screen.findByRole('button', {
        name: /Click here to get the amount of songs via Ajax/i,
      });

      fireEvent.click(ajaxBtn);

      await waitFor(() => {
        expect(api.getSongCount).toHaveBeenCalled();
      });

      expect(await screen.findByText('2')).toBeInTheDocument();
    });
  });

  describe('API call mocking', () => {
    test('getSongs API failure shows error', async () => {
      api.getSongs.mockRejectedValue(new Error('API error'));
      render(
        <MemoryRouter initialEntries={['/songs']}>
          <App />
        </MemoryRouter>
      );
      expect(await screen.findByText(/Failed to load songs/i)).toBeInTheDocument();
    });

    test('addSong API failure shows error', async () => {
      api.getSongs.mockResolvedValue({ songs: [], count: 0 });
      api.addSong.mockRejectedValue(new Error('API error'));

      render(
        <MemoryRouter initialEntries={['/songs']}>
          <App />
        </MemoryRouter>
      );

      const artistInput = await screen.findByLabelText(/Artist/i);
      const trackInput = screen.getByLabelText(/Track/i);
      const submitBtn = screen.getByRole('button', { name: /submit/i });

      fireEvent.change(artistInput, { target: { value: 'Error Artist' } });
      fireEvent.change(trackInput, { target: { value: 'Error Track' } });

      fireEvent.click(submitBtn);

      expect(await screen.findByText(/Failed to add song/i)).toBeInTheDocument();
    });
  });

  describe('Route protection', () => {
    test('edit song page with invalid id redirects to error', async () => {
      api.getSong.mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/songs/editsong/999']}>
          <App />
        </MemoryRouter>
      );

      expect(
        await screen.findByText(/Error/i)
      ).toBeInTheDocument();
      expect(
        await screen.findByText(/This is the Error-page. Will be shown when a page/i)
      ).toBeInTheDocument();
    });

    test('edit song page without id redirects to error', async () => {
      render(
        <MemoryRouter initialEntries={['/songs/editsong']}>
          <App />
        </MemoryRouter>
      );

      // Should redirect to error page
      expect(
        await screen.findByText(/Error/i)
      ).toBeInTheDocument();
      expect(
        await screen.findByText(/This is the Error-page. Will be shown when a page/i)
      ).toBeInTheDocument();
    });

    test('deletesong route without id redirects to error', async () => {
      render(
        <MemoryRouter initialEntries={['/songs/deletesong']}>
          <App />
        </MemoryRouter>
      );

      // Should redirect to error page
      expect(
        await screen.findByText(/Error/i)
      ).toBeInTheDocument();
      expect(
        await screen.findByText(/This is the Error-page. Will be shown when a page/i)
      ).toBeInTheDocument();
    });
  });
});
```