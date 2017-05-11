const regex = new RegExp("^https:\/\/.*facebook\.com\/.*/videos\/\(.*\)\/.*", "g");
const regexAlt = new RegExp("^https:\/\/.*facebook\.com\/.*/videos\/.*\/\(.*\)\/.*", "g");
let TOKEN = '';
const facebookAPIUrl = 'https://graph.facebook.com/VIDEO_ID?fields=source,from,length&access_token=' + TOKEN;
let videoIds = {};

function download(videoId) {
  const url = facebookAPIUrl.replace('VIDEO_ID', videoId);
  const request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.onload = function () {
    const jsonResponse = JSON.parse(request.responseText);
    if(jsonResponse.source) { // If video's source found
      chrome.downloads.download({ // Download the video
        url : jsonResponse.source,
        filename : jsonResponse.from.name ? jsonResponse.from.name + '.mp4' : 'untitled.mp4',
        conflictAction : 'uniquify' // To avoid duplication, the filename is changed to include a counter before the filename extension.
      });
    }
  };
  request.send();
}

function handleTabUpdated(tabId, changeInfo, tabInfo) {
  if (tabInfo.url.match(regex)) {
    let videoId = tabInfo.url.replace(regex, '$1');
    if(isNaN(videoId)) {
      videoId = tabInfo.url.replace(regexAlt, '$1');
      if(isNaN(videoId)) return;
    }
    if(videoIds[tabId] !== videoId) {
      videoIds[tabId] = videoId;
      // Show notification
      chrome.notifications.create('fb-video-notification', {
        "type": "basic",
        "iconUrl": chrome.extension.getURL("icons/download-icon.png"),
        "title": "Video is ready to download!",
        "message": "You can download this Facebook video by clicking the icon on the toolbar/urlbar.",
      });
    }
    chrome.pageAction.show(tabId);
  } else {
    chrome.pageAction.hide(tabId);
  }
  if (!changeInfo.url && tabInfo.url.includes('facebook.com') && changeInfo.status === "complete") {
    chrome.tabs.executeScript(tabId, {file: "content-script.js"} );
  }
}

function handleButtonClicked(tab) {
  if (videoIds[tab.id]) {
    download(videoIds[tab.id]);
  }
}

function handleMessageReceived(request, sender, sendResponse) {
  if (sender.tab.url.includes('facebook.com') || request.messageType === "download-video") {
    download(request.videoId);
    sendResponse({answer: "Done!"});
  }
}

chrome.tabs.onUpdated.addListener(handleTabUpdated);
chrome.pageAction.onClicked.addListener(handleButtonClicked);
chrome.runtime.onMessage.addListener(handleMessageReceived);