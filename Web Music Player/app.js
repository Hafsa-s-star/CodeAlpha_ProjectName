var progressBar = document.getElementById("progressBar");
var volumeControl = document.getElementById("volumeControl");
var playlistDiv = document.getElementById("playlist");
var playBtn = document.getElementById("playBtn");
var nextBtn = document.getElementById("nextBtn");
var prevBtn = document.getElementById("prevBtn");

var songs = [
    {
        title: "3 am West End",
        artist: "FreePD",
        src: "https://freepd.com/music/3%20am%20West%20End.mp3",
        img: ""
    },
    {
        title: "A Surprising Encounter",
        artist: "FreePD",
        src: "https://freepd.com/music/A%20Surprising%20Encounter.mp3",
        img: ""
    },
    {
        title: "Pickled Pink",
        artist: "FreePD",
        src: "https://freepd.com/music/Pickled%20Pink.mp3",
        img: ""
    },
    {
        title: "Lovely Piano Song",
        artist: "FreePD",
        src: "https://freepd.com/music/Lovely%20Piano%20Song.mp3",
        img: ""
    },
    {
        title: "Main Street",
        artist: "FreePD",
        src: "https://freepd.com/music/Main%20Street.mp3",
        img: ""
    },
    {
        title: "Song for a Friend",
        artist: "FreePD",
        src: "https://freepd.com/music/Song%20for%20a%20Friend.mp3",
        img: ""
    },
    {
        title: "Happy Bee",
        artist: "FreePD",
        src: "https://freepd.com/music/Happy%20Bee.mp3",
        img: ""
    },
    {
        title: "Long Road Home",
        artist: "FreePD",
        src: "https://freepd.com/music/Long%20Road%20Home.mp3",
        img: ""
    },
    {
        title: "Piano Mood",
        artist: "FreePD",
        src: "https://freepd.com/music/Piano%20Mood.mp3",
        img: ""
    },
    {
        title: "Soft Wonder",
        artist: "FreePD",
        src: "https://freepd.com/music/Soft%20Wonder.mp3",
        img: ""
    },


    {
        title: "Canon in D – Pachelbel",
        artist: "Musopen Orchestra",
        src: "https://musopen.org/static/music/download-src/1008.mp3",
        img: ""
    },
    {
        title: "Moonlight Sonata 1st mov.",
        artist: "Musopen Piano",
        src: "https://musopen.org/static/music/download-src/12.mp3",
        img: ""
    },
    {
        title: "Air on the G String – Bach",
        artist: "Musopen Orchestra",
        src: "https://musopen.org/static/music/download-src/1079.mp3",
        img: ""
    }
];

function isImageURLValid(url, callback) {
    var img = new Image();
    img.onload = function() {
        callback(true); // Image loaded successfully
    }
    img.onerror = function() {
        callback(false); // Failed to load
    }
    img.src = url;
}

// Example usage:
isImageURLValid("https://via.placeholder.com/200x200.png?text=Test", function(valid) {
    if (valid) {
        console.log("URL is valid ✅");
    } else {
        console.log("URL is broken ❌");
    }
});



var index = 0;
var audio = new Audio(songs[index].src);

// Load song details into player
 function loadSong(i) {
    var s = songs[i];
    document.getElementById("songTitle").textContent = s.title;
    document.getElementById("songArtist").textContent = s.artist;

    isImageURLValid(s.img, function(valid) {
        if (valid) {
            document.getElementById("albumArt").src = s.img;
        } else {
            document.getElementById("albumArt").src = "https://via.placeholder.com/200x200.png?text=No+Image";
        }
    });

    audio.src = s.src;
    highlight();
}



// Highlight currently playing song in playlist
function highlight() {
    document.querySelectorAll('.song-item').forEach((el, idx) => {
        el.classList.toggle('active-song', idx === index);
    });
}

// Build playlist UI
songs.forEach((s, i) => {
    var item = document.createElement('div');
    item.className = 'song-item';
    item.innerHTML = `<strong>${s.title}</strong><br><small>${s.artist}</small>`;
    item.onclick = () => {
        index = i;
        loadSong(index);
        audio.play();
        playBtn.textContent = "⏸";
    };
    playlistDiv.appendChild(item);
});

// Play/Pause
playBtn.onclick = () => {
    if (audio.paused) {
        audio.play();
        playBtn.textContent = "⏸";
    } else {
        audio.pause();
        playBtn.textContent = "▶";
    }
};

// Next song
nextBtn.onclick = () => {
    index = (index + 1) % songs.length;
    loadSong(index);
    audio.play();
    playBtn.textContent = "⏸";
};

// Previous song
prevBtn.onclick = () => {
    index = (index - 1 + songs.length) % songs.length;
    loadSong(index);
    audio.play();
    playBtn.textContent = "⏸";
};

// Progress bar update
audio.ontimeupdate = () => {
    if (!isNaN(audio.duration)) {
        progressBar.value = (audio.currentTime / audio.duration) * 100;
    }
};

// Seek with progress bar
progressBar.oninput = function () {
    audio.currentTime = (this.value / 100) * audio.duration;
};

// Volume control
volumeControl.oninput = function () {
    audio.volume = this.value;
};

// Initial load
loadSong(index);
