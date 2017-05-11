const regex = new RegExp("^https:\/\/.*facebook\.com\/.*/videos\/\(.*\)\/.*", "g");
const TOKEN = '';
const facebookAPIUrl = 'https://graph.facebook.com/VIDEO_ID?fields=source,from,length&access_token=' + TOKEN;
let videoIds = {};

function handleUpdated(tabId, changeInfo, tabInfo) {
  if (tabInfo.url.match(regex)) { // If video url
  	videoIds[tabId] = tabInfo.url.replace(regex, '$1'); // Get the Video ID
    chrome.pageAction.show(tabId); // Show the page action button
  }
}

function handleClicked(tab) {
  if (videoIds[tab.id]) {
    const request = new XMLHttpRequest();
    request.open("GET", facebookAPIUrl.replace('VIDEO_ID', videoIds[tab.id]), true);
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
}

chrome.tabs.onUpdated.addListener(handleUpdated);
chrome.pageAction.onClicked.addListener(handleClicked);