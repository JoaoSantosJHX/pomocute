// src/components/AudioPlayer.jsx
import React from 'react';

const AudioPlayer = () => {
  return (
    <div style={{ marginTop: '30px' }}>
      <p>Música Lo-Fi para focar 🎶</p>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <iframe
          width="300"
          height="150"
          src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&loop=1&playlist=jfKfPfyJRdk"
          title="LoFi Music"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default AudioPlayer;
