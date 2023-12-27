import ytpl from 'ytpl';

export default async function getAllVideosFromPlayList(
    playlistId = 'PLsPKfE1cg_1V0CzPdZP-DjDPvX2jvJrur',
) {
    return new Promise(async (resolve, reject) => {
        let error = false;
        let Videos = [];
        let playlisttitle = '';
        try {
            let firstResultBatch = await ytpl(playlistId, {
                pages: 1,
            });
            
            playlisttitle = firstResultBatch.title;
            Videos.push(...firstResultBatch.items);
            while (!error) {
                try {
                    const nextResultBatch = await ytpl.continueReq(
                        firstResultBatch.continuation,
                    );
                    Videos.push(...nextResultBatch.items);
                    firstResultBatch = nextResultBatch;
                } catch (e) {
                    error = true;
                }
            }
            
            const flterdVideos = Videos.filter((video) => video.duration);
            resolve([flterdVideos, playlisttitle]);
        } catch (e) {
            reject(e);
        }
    });
}
