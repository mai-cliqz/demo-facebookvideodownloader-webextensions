// console.log('Content script injected!');
window.regex = new RegExp("^https:\/\/.*facebook\.com\/.*/videos\/\(.*\)\/.*", "g");
window.regexAlt = new RegExp("^https:\/\/.*facebook\.com\/.*/videos\/.*\/\(.*\)\/.*", "g");
window.videoIds = [];

(function init() {
  // create an observer instance
  MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(mutation => { // Iterate through all mutation records
      for(let i = 0; i < mutation.addedNodes.length; i++) {
        maybeAddDownloadButtons(mutation.addedNodes[i]);
      }
    });
  });
  
  const target = document.getElementById('contentArea'); // select the target node
  if(target) {
  	maybeAddDownloadButtons(target);
  	observer.observe(target, { attributes: true, childList: true, subtree: true });
  }
})();

function maybeAddDownloadButtons(target) {
  if (target && target.querySelectorAll) {
	const elements = target.querySelectorAll('[href*="/videos/"]');
	if (elements) {
	  [].forEach.call(elements, function (element) {
	  	let videoId, btnStyle, referenceElement;
	  	if (element.href.includes('?comment')) {
	  		return;
	  	}
	  	videoId = element.href.replace(window.regex, '$1');
	  	btnStyle = 'background-color: pink';
	  	referenceElement = element;
	  	if(isNaN(videoId)) { // Invalid video ID
		// Special cases:
		// videoId.includes('vb.') || videoId.includes('vl.') || videoId.includes('pcb.')
	  	  videoId = element.href.replace(window.regexAlt, '$1'); // Try one more time
	  	  if (isNaN(videoId)) return;
	  	  btnStyle = 'background-color: pink; z-index: 2; position: absolute';
	  	  referenceElement = element.firstChild;
	  	}

	  	if(!window.videoIds.includes(videoId)) {
	  	  // Create a download button
	      const btn = document.createElement("BUTTON");
	      btn.innerHTML = "Download this";
	      btn.setAttribute('style', btnStyle);
	      btn.setAttribute('value', videoId);
	      btn.setAttribute('class', 'downloadButton');
	      btn.addEventListener('click', handleClick);
	      referenceElement.parentNode.insertBefore(btn, referenceElement);
	      
	      window.videoIds.push(videoId);
	  	}
	  });
	}
  }
}

function handleClick(ev) {
	ev.preventDefault();
	ev.stopPropagation();
	// console.log('Downloading', ev.target.value);
	const data = {
	  messageType: "download-video",
	  videoId: ev.target.value
	}
	chrome.runtime.sendMessage(data, function(response) {
	  console.log(response.answer);
	});
}