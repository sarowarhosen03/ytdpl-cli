export default function extractPlaylistId(youtubeUrl) {
    const regex = /[?&]list=([^&]+)/;
    const match = youtubeUrl.match(regex);
  
    if (match && match[1]) {
      return match[1];
    } else {
      // Handle the case where the URL doesn't contain a playlist ID
      console.error('Invalid YouTube playlist URL');
      return null;
    }
  }