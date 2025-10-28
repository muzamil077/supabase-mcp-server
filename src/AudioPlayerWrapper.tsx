import { useAudioPlayerContext } from "@/context/audioPlayerContext";
import { MiniPlayer } from "@/components/ui/MiniPlayer";

export const AudioPlayerWrapper = () => {
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    isShuffled,
    repeatMode,
    isMinimized,
    togglePlay,
    skipNext,
    skipPrevious,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    closePlayer,
    toggleMinimize,
  } = useAudioPlayerContext();

  return (
    <MiniPlayer
      currentTrack={currentTrack}
      isPlaying={isPlaying}
      progress={progress}
      volume={volume}
      isShuffled={isShuffled}
      repeatMode={repeatMode}
      isMinimized={isMinimized}
      onTogglePlay={togglePlay}
      onSkipPrevious={skipPrevious}
      onSkipNext={skipNext}
      onSeek={seek}
      onVolumeChange={setVolume}
      onToggleShuffle={toggleShuffle}
      onToggleRepeat={toggleRepeat}
      onToggleFavorite={toggleFavorite}
      onClose={closePlayer}
      onToggleMinimize={toggleMinimize}
    />
  );
};

