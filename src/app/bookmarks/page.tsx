'use client';
import { useEffect, useState } from 'react';
import styles from './bookmarks.module.css';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface Bookmark {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  username: string; // Post owner's username
  dateBookmarked: string; // Date bookmark was added
}

export default function BookmarksPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/');
      return;
    }

    const fetchRealBookmarks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/bookmarks');
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setBookmarks(data.bookmarks);
      } catch (err) {
        setError('Failed to load bookmarks. Please ensure you are logged in and your API keys are correct.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRealBookmarks();
  }, [session, status, router]);

  useEffect(() => {
    const results = bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBookmarks(results);
  }, [searchTerm, bookmarks]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Your bookmarks</h1>
          <span className={styles.bookmarkCount}>( {filteredBookmarks.length} )</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className={styles.searchIcon}>&#128269;</div> 
          </div>
          <button onClick={handleSignOut} className={styles.settingsButton} title="Sign Out">
            &#9881;
          </button>
        </div>
      </div>

      {loading && <p>Loading bookmarks...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && filteredBookmarks.length === 0 && (
        <p>No bookmarks found for {session?.user?.name || 'you'}.</p>
      )}

      <div className={styles.bookmarksGrid}>
        {!loading && !error && filteredBookmarks.map((bookmark) => (
          <div key={bookmark.id} className={styles.bookmarkCard}>
            {bookmark.thumbnail && <img src={bookmark.thumbnail} alt={bookmark.title} className={styles.cardThumbnail} />}
            <div className={styles.cardContent}>
              <div className={styles.cardUsernameWrapper}>
                <img src="https://placehold.co/16x16" alt="User avatar" className={styles.userAvatar} />
                <div className={styles.cardUsername}>{bookmark.username}</div>
              </div>
              <h3 className={styles.cardTitle}>{bookmark.title}</h3>
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.cardDate}>{bookmark.dateBookmarked}</div>
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className={styles.cardCta}>View on X</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
