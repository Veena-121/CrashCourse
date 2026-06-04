const YouTube = {
  
  extractPlaylistId(url) {
    const patterns = [
      /[?&]list=([^&#]+)/,
      /playlist\?list=([^&#]+)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  },

  
  async fetchPlaylist(playlistId) {
    if (!CONFIG.YOUTUBE_API_KEY || CONFIG.YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
      throw new Error('YouTube API key not set. Please edit config.js.');
    }
    let videos = [];
    let pageToken = '';
    const maxPages = 4;
    let page = 0;

    do {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.searchParams.set('part', 'snippet,contentDetails');
      url.searchParams.set('playlistId', playlistId);
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('key', CONFIG.YOUTUBE_API_KEY);
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const resp = await fetch(url.toString());
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error?.message || 'YouTube API error');
      }
      const data = await resp.json();

      for (const item of data.items) {
        const s = item.snippet;
        if (s.title === 'Deleted video' || s.title === 'Private video') continue;
        videos.push({
          videoId: s.resourceId.videoId,
          title: s.title,
          description: s.description?.slice(0, 300) || '',
          thumbnail: s.thumbnails?.medium?.url || s.thumbnails?.default?.url || '',
        });
      }

      pageToken = data.nextPageToken || '';
      page++;
    } while (pageToken && page < maxPages);

    return videos;
  },

  
  async fetchPlaylistInfo(playlistId) {
    if (!CONFIG.YOUTUBE_API_KEY || CONFIG.YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') return null;
    const url = new URL('https://www.googleapis.com/youtube/v3/playlists');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('id', playlistId);
    url.searchParams.set('key', CONFIG.YOUTUBE_API_KEY);
    const resp = await fetch(url.toString());
    if (!resp.ok) return null;
    const data = await resp.json();
    const s = data.items?.[0]?.snippet;
    return s ? { title: s.title, channel: s.channelTitle } : null;
  },
};



const CourseBuilder = {
  
  build({ title, videos, startDate, daysPerLesson }) {
    const start = new Date(startDate);
    const lessons = videos.map((v, i) => {
      const deadline = new Date(start);
      deadline.setDate(start.getDate() + (i + 1) * daysPerLesson);
      return {
        index: i,
        videoId: v.videoId,
        title: v.title,
        description: v.description,
        thumbnail: v.thumbnail,
        deadline: deadline.toISOString(),
      };
    });

    return {
      id: 'course_' + Date.now(),
      title,
      createdAt: new Date().toISOString(),
      lessons,
    };
  },

  
  deadlineStatus(lesson, isCompleted) {
    if (isCompleted) return { label: '✓ Done', cls: 'done' };
    const now = new Date();
    const dl  = new Date(lesson.deadline);
    const diff = (dl - now) / (1000 * 60 * 60 * 24); // days
    if (diff < 0)   return { label: 'Overdue', cls: 'overdue' };
    if (diff < 1.5) return { label: 'Due soon', cls: 'soon' };
    return { label: `Due ${dl.toLocaleDateString('en', { month:'short', day:'numeric' })}`, cls: 'ok' };
  },
};
