#!/usr/bin/env node
import select from '@inquirer/select';
import input from '@inquirer/input';
import chalk from 'chalk';
import ytdl from 'ytdl-core';
import fs from 'fs';
import cliProgress from 'cli-progress';
import path from 'path';
import getAllVideosFromPlayList from './getAllVideosFromPlayList.mjs';
import extractPlaylistId from './getPlayListId.js';
import os from 'os';

const MAX_DIRECTORY_LENGTH = 150;
const Max_Video_Title_Length = 150;
const DOWNLOAD_PATH = 'ytdpl-cli';
const primaryColor = chalk.yellow;
const errorColor = chalk.red;
const baseColor = chalk.green;
const mainMenuValues = {
  newVideo: 'newVideo',
  newplaylist: 'newplaylist',
  reStartPlaylist: 'reStartPlaylist',
};
const DEFAULT_DOWNLOAD_PATH = path.resolve(os.homedir(), 'Downloads');
if (!fs.existsSync(DEFAULT_DOWNLOAD_PATH)) fs.mkdirSync(DEFAULT_DOWNLOAD_PATH);
const PROJECT_ROOT = path.resolve(os.homedir(), 'Downloads', DOWNLOAD_PATH);
if (!fs.existsSync(PROJECT_ROOT)) fs.mkdirSync(PROJECT_ROOT);
console.log(primaryColor('Welcome to Ytplaylist-cli tool'));

async function init() {
  const mainMenuAnser = await select({
    message: 'Select a Option From Menu',
    choices: [
      {
        name: 'Download Singel Youtube Video',
        value: mainMenuValues.newVideo,
        description: 'Start Downloading New Video',
      },
      {
        name: 'Download New Youtube Playlist',
        value: mainMenuValues.newplaylist,
        description: 'Start Downloading New Playlist',
      },
    ],
  });
  if (mainMenuAnser === mainMenuValues.newVideo) {
    try {
      const ytVideo = await input({ message: 'Enter Youtube Video Url :-' });
      if (!ytVideo) {
        console.log(errorColor('Invalid Video Url'));
        return init();
      }
      const res = await videoDownlaodAndSave(ytVideo, PROJECT_ROOT);
      console.clear();
      console.log(chalk.underline.whiteBright(res));
      await init();
    } catch (e) {
      console.log(errorColor(e?.message), '\n', baseColor('Please Try Again'));
      await init();
    }
  } else if (mainMenuAnser === mainMenuValues.newplaylist) {
    try {
      const res = await downloadPlaylist();
       console.clear();
      console.log(chalk.bold.whiteBright(res));
        await init();
    } catch (e) {
      console.log(errorColor(e), '\n', baseColor('Please Try Again'));
      init().then(() => {});
    }
  }
}

async function downloadPlaylist() {
  try {
    const playlistUrl = await input({
      message: 'Enter Youtube Playlist Url :-',
    });
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      console.log(errorColor('Invalid Playlist Id'));
      return init();
    }
    const [videos, playListTitle] = await getAllVideosFromPlayList(playlistId);
    const folderName = playListTitle
      .slice(0, MAX_DIRECTORY_LENGTH)
      .replace(/[^a-z0-9]/gi, '_');
    const folderPath = path.resolve(
      os.homedir(),
      'Downloads' + '/' + DOWNLOAD_PATH,
      folderName,
    );
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
    console.log(
      baseColor(`Total Videos in Playlist ${playListTitle} ${videos.length}`),
    );
    for (let i = 0; i < videos.length; i++) {
      try {
        const res = await videoDownlaodAndSave(videos[i].url, folderPath);
        console.log(chalk.underline.whiteBright(res));
      } catch (e) {
        console.log(e?.message);
      }
    }
    return '';
  } catch (e) {
    console.log('at catch', errorColor(e), '\n', baseColor('Please Try Again'));
    await init();
  }
}

async function videoDownlaodAndSave(url, downloadPathRef, quality = 'highest') {
  return new Promise(async (resolve, reject) => {
    try {
      const videoDAta = await ytdl.getBasicInfo(url);
      let name = videoDAta.videoDetails.title;
      const highqyqlityVideo = videoDAta.formats.reduce((acc, curr) => {
        if (curr?.itag > acc && curr?.contentLength) {
          return curr.contentLength;
        }
        return acc;
      }, 1);

      console.log(baseColor(`${name} is Downloading`));
      name = name.slice(0, Max_Video_Title_Length);
      name = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filePath = path.resolve(downloadPathRef, `${name}.mp4`);
      //check if file is exist
      if (fs.existsSync(filePath) && highqyqlityVideo) {
        const fileSize = getFilesizeInBytes(filePath);
        if (fileSize === Number(highqyqlityVideo)) {
          return resolve('already downloaded Skiping');
        }
      }
      const video = ytdl(url, {
        quality,
      });

      const bar1 = new cliProgress.SingleBar(
        {},
        cliProgress.Presets.shades_classic,
      );
      bar1.start(100, 0);
      video.on('progress', (_chunkLength, downloaded, total) => {
        bar1.update((downloaded / total) * 100);
      });
      video.on('error', (err) => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return reject(err);
      });
      video.on('end', async () => {
        bar1.stop();
        resolve(`Video Downloaded Successfully `);
      });
      video.pipe(fs.createWriteStream(path.resolve(filePath)), {
        end: true,
      });
    } catch (e) {
      reject(e);
    }
  });
}

init().then(() => {});

function getFilesizeInBytes(filename) {
  let stats = fs.statSync(filename);
  return stats.size;
}
