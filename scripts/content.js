const YT_API_KEY = ""
const videoDates = new Map()

const formatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const richItemRendererTag = "ytd-rich-item-renderer";
const videoRendererTag = "ytd-video-renderer";
const gridVideoRendererTag = "ytd-grid-video-renderer";
const compactVideoRendererTag = "ytd-compact-video-renderer";
const channelVideoRendererTag = "ytd-channel-video-player-renderer";

const dateElementClasses = "inline-metadata-item style-scope ytd-video-meta-block";
const gridDateElementClasses = "style-scope ytd-grid-video-renderer";

let currentCalling = "";

const replaceUploadDates = async () => {
    const compactVideoElements = document.getElementsByTagName(compactVideoRendererTag) // appear as recommendations on the side while playing a video
    const richVideoElements = document.getElementsByTagName(richItemRendererTag); // appear on home page
    const searchVideoElements = document.getElementsByTagName(videoRendererTag); // appear on searching
    const gridVideoElements = document.getElementsByTagName(gridVideoRendererTag); // appear on a channel's page
    const channelVideoElements = document.getElementsByTagName(channelVideoRendererTag); // appear on top on channel's page

    let videoElements = new Set([...compactVideoElements, ...richVideoElements, ...searchVideoElements, ...gridVideoElements, ...channelVideoElements]);
    const dateElements = new Map();

    videoElements.forEach(videoElement => {
        let anchorElement = Array.from(videoElement.getElementsByTagName("a"))
            .find(element => element.href && element.href !== "" && element.href.includes("watch?"))
        if(!anchorElement) return;

        let queryString = anchorElement.href.split("?")[1];
        let params = new URLSearchParams(queryString);
        let videoId = params.get("v");

        const requiredClass = videoElement.tagName.toLowerCase() === gridVideoRendererTag ? gridDateElementClasses : dateElementClasses;

        let dateElement = Array.from(videoElement.getElementsByClassName(requiredClass))
            .find(element => element.childElementCount === 0 && element.innerHTML.includes("ago"))
        if(!dateElement) return;

        dateElements.set(videoId, dateElement)
    })

    const videoIds = Array.from(dateElements.keys())
        .filter((id) => !videoDates.has(id))
        .sort()
        .join(",")

    if(videoIds.length > 0 && !currentCalling.includes(videoIds)) {
        console.log("Need to call api to get dates")

        currentCalling = videoIds;
        const url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds}&key=${YT_API_KEY}`;
        const response = await fetch(url)
        currentCalling = "";

        if(!response.ok) {
            console.error(url)
            console.error(response)
            return;
        }

        const data = await response.json()
        console.log(data)

        data.items.forEach(item => {
            let uploadDate = item.snippet.publishedAt
            videoDates.set(item.id, uploadDate)
        })

    }

    let prevDate = new Date(Date.now() - (86_400_000 * 7)) // using last week

    dateElements.forEach((value, key) => {
        let uploadDate = new Date(videoDates.get(key))
        if(uploadDate <= prevDate) {
            value.innerHTML = formatter.format(uploadDate)
        }
    })

}

console.log("yo yt dater")

const observer = new MutationObserver(() => {
    setTimeout(replaceUploadDates, 1500)
});

observer.observe(document.body, { childList: true, subtree: true });