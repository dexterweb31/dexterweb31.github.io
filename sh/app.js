const jsonFiles = [
  "Ahmet_Atilla_Yilmazer.json", "Ali_Sacan.json", "All_Star_Ogretmeni.json", "Altug_Gunes.json", 
  "Baris_Kapan.json", "Bayram_Meral.json", "Betul_Buyukkalayci.json", "Burak_Onay.json", 
  "Busra_Altinok.json", "Celal_Gunduz.json", "Deniz_Bozkurt.json", "Deniz_Ongel.json", 
  "Didar_Baskin.json", "Enes_Avci.json", "Enise_Ozdemir.json", "Erdal_Aydemir.json", 
  "Erkan_Ayranci.json", "Erkan_Tuncer.json", "Eyup_Boncuk.json", "Fatih_Demirkaya.json", 
  "Fatih_Vural.json", "Ferda_Kurnaz_Karagoz.json", "Gorkem_Sahin.json", "Gri_Koc.json", 
  "Gulhan_Sen.json", "Hale_Karatas.json", "Hilmi_Yavuz.json", "Ibrahim_Turker.json", 
  "Ibrahim_Ulas_Baldemir.json", "Ilhan_Aslan.json", "Ilyas_Gunes.json", "Ismail_Kocabas.json", 
  "Ismail_Tolga_Aktas.json", "Kader_Altinel.json", "Kadir_Gumus.json", "Kanan_Kara.json", 
  "Kemal_Coskun.json", "Kenan_Kara.json", "Mahsum_Ozturk.json", "Mehmet_Celal_Ozyildiz.json", 
  "Mehmet_Dural.json", "Mehmet_Durmus.json", "Mesut_Ugurdogan.json", "Murat_Namli.json", 
  "Mustafa_Ozturk.json", "Mustafa_Yagci.json", "Nagihan_Hoca.json", "Nurtac_Kozak.json", 
  "Nurten_Aydin.json", "Oktay_Duran.json", "Onay_CEPE.json", "Onur_Soguk.json", "Ozcan_Aykin.json", 
  "Ozer_Akgumus.json", "Ozlem_Penekli.json", "Oznur_Saat_Yildirim.json", "Rabia_Nalan_Cinar.json", 
  "Recep_Ustunel.json", "Rustu_Bayindir.json", "Salih_Yildirir.json", "Selim_Yuksel.json", 
  "Selma_Kalemci.json", "Semih_Akpinar.json", "Senol_Aydin.json", "Sercan_Dural.json", 
  "Sinan_Aydin.json", "Sukru_Akkoyun.json", "Uzay_Aslanturk.json", "Veysel_Boynuegri.json", 
  "Yavuz_Tuna.json", "Yunus_Turan.json"
];

let player = null;
let currentHls = null;
const defaultOptions = {
  controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen']
};

document.addEventListener('DOMContentLoaded', () => {
  const selectBox = document.getElementById('instructorSelect');
  const videoListEl = document.getElementById('videoList');
  const loader = document.getElementById('loader');
  const nowPlayingTitle = document.getElementById('nowPlayingTitle');
  const nowPlayingInstructor = document.getElementById('nowPlayingInstructor');

  // Initialize default Plyr player
  player = new Plyr('#player', defaultOptions);

  // Populate Select Box
  jsonFiles.forEach(file => {
    const name = file.replace('.json', '').replace(/_/g, ' ');
    const option = document.createElement('option');
    option.value = file;
    option.textContent = name;
    selectBox.appendChild(option);
  });

  // Handle Selection Change
  selectBox.addEventListener('change', async (e) => {
    const selectedFile = e.target.value;
    if (!selectedFile) {
      videoListEl.innerHTML = '';
      return;
    }
    
    loader.classList.add('active');
    videoListEl.innerHTML = '';
    
    try {
      const response = await fetch(selectedFile);
      if (!response.ok) throw new Error('Failed to fetch JSON');
      
      const videos = await response.json();
      renderVideoList(videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      videoListEl.innerHTML = `<div style="padding: 1rem; color: #ef4444;">Error loading videos. If you are opening this file locally (file://), you might need to run a local web server to avoid CORS issues.</div>`;
    } finally {
      loader.classList.remove('active');
    }
  });

  // Load first file automatically
  if (jsonFiles.length > 0) {
    selectBox.value = jsonFiles[0];
    selectBox.dispatchEvent(new Event('change'));
  }

  function renderVideoList(videos) {
    videos.forEach((video, index) => {
      const el = document.createElement('div');
      el.className = 'video-item';
      
      el.innerHTML = `
        <div class="video-title">${video.title || 'Untitled Video'}</div>
        <div class="video-meta">
          <span>${video.instructor_name || 'Unknown Instructor'}</span>
          <span class="badge">${video.duration || '--:--'}</span>
        </div>
      `;
      
      el.addEventListener('click', () => {
        document.querySelectorAll('.video-item').forEach(item => item.classList.remove('active'));
        el.classList.add('active');
        playVideo(video.stream_url, video.title, video.instructor_name);
      });
      
      videoListEl.appendChild(el);
    });
  }

  function playVideo(url, title, instructor) {
    nowPlayingTitle.textContent = title || 'Playing Video';
    nowPlayingInstructor.textContent = instructor || 'Unknown Instructor';
    
    const videoElement = document.getElementById('player');

    // HLS.js setup for handling m3u8 streams with quality selection
    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        if (currentHls) {
          currentHls.destroy();
        }
        currentHls = new Hls();
        currentHls.loadSource(url);
        currentHls.attachMedia(videoElement);
        currentHls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
          // Map available qualities from HLS manifest
          const availableQualities = currentHls.levels.map(l => l.height);
          
          // Add '0' to represent 'Auto'
          availableQualities.unshift(0);

          const options = {
            ...defaultOptions,
            quality: {
              default: 0,
              options: availableQualities,
              forced: true,
              onChange: (newQuality) => updateQuality(newQuality),
            },
            i18n: {
              qualityLabel: {
                0: 'Auto',
              },
            }
          };

          // Re-initialize Plyr to load the new quality options into settings menu
          if (player) {
            player.destroy();
          }
          player = new Plyr(videoElement, options);
          player.play();
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        if (player) {
          player.destroy();
        }
        player = new Plyr(videoElement, defaultOptions);
        videoElement.src = url;
        videoElement.addEventListener('loadedmetadata', function () {
          player.play();
        });
      }
    } else {
      // Standard video file (mp4, webm)
      if (currentHls) {
        currentHls.destroy();
        currentHls = null;
      }
      if (player) {
        player.destroy();
      }
      player = new Plyr(videoElement, defaultOptions);
      player.source = {
        type: 'video',
        sources: [
          {
            src: url,
            type: 'video/mp4',
          },
        ],
      };
      player.play();
    }
  }

  function updateQuality(newQuality) {
    if (!currentHls) return;
    
    if (newQuality === 0) {
      currentHls.currentLevel = -1; // -1 means Auto in hls.js
    } else {
      currentHls.levels.forEach((level, levelIndex) => {
        if (level.height === newQuality) {
          currentHls.currentLevel = levelIndex;
        }
      });
    }
  }
});
