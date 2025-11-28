import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  ArrowLeft,
} from "lucide-react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { api } from "../../services/api";
import { analyticsService } from "../../services/analyticsService";
import "../../styles/VideoPlayer.css";

interface VideoPlayerProps {
  title?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  title: initialTitle,
}) => {
  const { id: slug } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const season = searchParams.get("se")
    ? parseInt(searchParams.get("se")!)
    : undefined;
  const episode = searchParams.get("ep")
    ? parseInt(searchParams.get("ep")!)
    : undefined;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [src, setSrc] = useState<string>("");
  const [baseTitle, setBaseTitle] = useState(
    initialTitle || location.state?.item?.title || "Loading..."
  );
  const [title, setTitle] = useState(
    initialTitle || location.state?.item?.title || "Loading..."
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qualities, setQualities] = useState<any[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>("");
  const [captions, setCaptions] = useState<any[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [isTVShow, setIsTVShow] = useState(false);
  const [tvShowDetails, setTvShowDetails] = useState<any>(null);
  const [subtitleText, setSubtitleText] = useState<string>("");
  const [subtitleData, setSubtitleData] = useState<
    Array<{ start: number; end: number; text: string }>
  >([]);

  const controlsTimeoutRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Ignore if tapping on controls
    if ((e.target as HTMLElement).closest('button, input, select')) return;

    const touch = e.touches[0];
    const now = Date.now();
    const x = touch.clientX;
    const width = window.innerWidth;

    if (lastTapRef.current && (now - lastTapRef.current.time < 300)) {
      // Double tap detected
      const isRight = x > width / 2;
      if (isRight) {
        seek(10);
      } else {
        seek(-10);
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x };
    }
  };

  // Force landscape on mount
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        if (screen.orientation && 'lock' in screen.orientation) {
          // @ts-ignore - lock is not in standard TS types yet
          await screen.orientation.lock('landscape');
        }
      } catch (e) {
        console.log('Orientation lock failed:', e);
      }
    };

    lockOrientation();

    return () => {
      try {
        if (screen.orientation && 'unlock' in screen.orientation) {
          screen.orientation.unlock();
        }
      } catch (e) {
        console.log('Orientation unlock failed:', e);
      }
    };
  }, []);

  // Update baseTitle when item changes
  useEffect(() => {
    const itemTitle =
      location.state?.item?.title || initialTitle || "Loading...";
    if (itemTitle !== baseTitle) {
      setBaseTitle(itemTitle);
      // Only update title if not in episode mode
      if (!season || !episode) {
        setTitle(itemTitle);
      }
    }
  }, [location.state?.item?.title, initialTitle]);

  useEffect(() => {
    const loadStream = async () => {
      if (!slug) return;

      try {
        let subjectId = location.state?.item?.id;
        const item = location.state?.item;

        // Check if it's a TV show
        const tvCheck =
          item?.type === "tv" ||
          item?.subjectType === 2 ||
          item?.subjectType === "2";
        setIsTVShow(tvCheck);

        // Get base title from item or metadata (always get fresh, don't use state)
        let currentBaseTitle = item?.title || initialTitle || "Loading...";
        if (!subjectId) {
          const metadata = await api.getMetadata(slug);
          subjectId = metadata.id;
          currentBaseTitle = metadata.title;
        }

        // Update baseTitle state
        setBaseTitle(currentBaseTitle);

        if (season && episode) {
          // Always use fresh currentBaseTitle to avoid appending
          setTitle(`${currentBaseTitle} - S${season}E${episode}`);

          // Load TV show details to get episode info
          if (tvCheck) {
            try {
              const tvData = await api.getDetails(subjectId, "tv", slug);
              setTvShowDetails(tvData);
            } catch (e) {
              console.log("Could not load TV show details");
            }
          }
        } else {
          setTitle(currentBaseTitle);
        }

        const data = await api.getStreams(slug, subjectId, season, episode);

        if (data.streams && data.streams.length > 0) {
          setQualities(data.streams);
          const bestStream = data.streams[0];
          setSrc(bestStream.url);
          setCurrentQuality(bestStream.quality);
          setIsBuffering(false);

          // Load captions
          const captionData = await api.getCaptions(
            slug,
            subjectId,
            bestStream.id
          );
          const loadedCaptions = captionData.captions || [];
          setCaptions(loadedCaptions);

          // Set default subtitle if available
          if (loadedCaptions.length > 0 && !currentSubtitle) {
            // Try to find English first, otherwise use first available
            const englishSub = loadedCaptions.find(
              (cap: any) =>
                cap.language === "en" ||
                cap.languageName?.toLowerCase().includes("english")
            );
            if (englishSub) {
              setCurrentSubtitle(englishSub.url);
              loadSubtitleText(englishSub.url);
            } else {
              setCurrentSubtitle(loadedCaptions[0].url);
              loadSubtitleText(loadedCaptions[0].url);
            }
          }
        } else {
          throw new Error("No streams found");
        }
      } catch (err) {
        console.error("Error loading stream:", err);
        setError("Failed to load video. Please try again.");
        setIsBuffering(false);
      }
    };

    loadStream();
  }, [slug, season, episode]);

  // Error handling for video source
  const handleVideoError = () => {
    // Try proxy if direct fails
    if (src && !src.includes("/api/proxy-stream")) {
      console.log("Direct playback failed, switching to proxy...");
      setSrc(`/api/proxy-stream?url=${encodeURIComponent(src)}`);
    } else {
      setError("Playback failed");
    }
  };

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = window.setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input/select
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(
            0,
            videoRef.current.currentTime - 10
          );
        }
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          window.clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
          controlsTimeoutRef.current = window.setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration,
            videoRef.current.currentTime + 10
          );
        }
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          window.clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
          controlsTimeoutRef.current = window.setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("click", handleMouseMove);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("click", handleMouseMove);
      }
      window.removeEventListener("keydown", handleKeyDown);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        
        // Track watch event when user starts playing
        if (location.state?.item) {
          const item = location.state.item;
          analyticsService.trackWatch(
            item.id || item.subjectId,
            item.title || title,
            item.type || 'movie'
          );
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
      setDuration(total);

      // Update subtitle text based on current time
      if (subtitleData.length > 0 && currentSubtitle) {
        const activeSubtitle = subtitleData.find(
          (sub) => current >= sub.start && current <= sub.end
        );
        // Replace \N with line breaks
        const text = activeSubtitle
          ? activeSubtitle.text.replace(/\\N/g, "\n")
          : "";
        setSubtitleText(text);
      } else {
        setSubtitleText("");
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const skip = (seconds: number) => {
    // For TV shows, navigate to next/previous episode
    if (isTVShow && season && episode && tvShowDetails) {
      const currentSeasonData = tvShowDetails.seasons?.find(
        (s: any) => s.se === season
      );
      if (currentSeasonData) {
        if (seconds > 0) {
          // Next episode
          if (episode < currentSeasonData.maxEp) {
            navigate(`/watch/${slug}?se=${season}&ep=${episode + 1}`, {
              state: location.state,
            });
            return;
          } else {
            // Next season
            const nextSeason = tvShowDetails.seasons?.find(
              (s: any) => s.se > season
            );
            if (nextSeason) {
              navigate(`/watch/${slug}?se=${nextSeason.se}&ep=1`, {
                state: location.state,
              });
              return;
            }
          }
        } else {
          // Previous episode
          if (episode > 1) {
            navigate(`/watch/${slug}?se=${season}&ep=${episode - 1}`, {
              state: location.state,
            });
            return;
          } else {
            // Previous season
            const prevSeason = tvShowDetails.seasons
              ?.slice()
              .reverse()
              .find((s: any) => s.se < season);
            if (prevSeason) {
              navigate(
                `/watch/${slug}?se=${prevSeason.se}&ep=${prevSeason.maxEp}`,
                { state: location.state }
              );
              return;
            }
          }
        }
      }
    }

    // For movies or if navigation not possible, skip seconds
    seek(seconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleBack = () => {
    if (slug) {
      navigate(`/details/${slug}`, { state: location.state });
    } else {
      navigate(-1);
    }
  };

  // Parse SRT format to extract timing and text
  const parseSRT = (
    srt: string
  ): Array<{ start: number; end: number; text: string }> => {
    const subtitles: Array<{ start: number; end: number; text: string }> = [];
    const blocks = srt.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split("\n");
      if (lines.length < 3) continue;

      // Parse time line (e.g., "00:00:01,234 --> 00:00:03,456")
      const timeLine = lines[1];
      const timeMatch = timeLine.match(
        /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
      );

      if (timeMatch) {
        const startTime =
          parseInt(timeMatch[1]) * 3600 +
          parseInt(timeMatch[2]) * 60 +
          parseInt(timeMatch[3]) +
          parseInt(timeMatch[4]) / 1000;

        const endTime =
          parseInt(timeMatch[5]) * 3600 +
          parseInt(timeMatch[6]) * 60 +
          parseInt(timeMatch[7]) +
          parseInt(timeMatch[8]) / 1000;

        // Combine all text lines (lines 2+), preserving \N for line breaks
        const text = lines
          .slice(2)
          .join(" ")
          .replace(/<[^>]+>/g, "")
          .trim();

        if (text) {
          subtitles.push({ start: startTime, end: endTime, text });
        }
      }
    }

    return subtitles;
  };

  // Load subtitle text and parse it
  const loadSubtitleText = async (subtitleUrl: string) => {
    try {
      const response = await fetch(subtitleUrl);
      const srtText = await response.text();
      const parsed = parseSRT(srtText);
      setSubtitleData(parsed);
    } catch (e) {
      console.error("Failed to load subtitle:", subtitleUrl, e);
      setSubtitleData([]);
    }
  };

  const changeQuality = (quality: string) => {
    const stream = qualities.find((q) => q.quality === quality);
    if (stream && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const wasPlaying = !videoRef.current.paused;
      setSrc(stream.url);
      setCurrentQuality(quality);

      // Restore time and play state after load
      const restoreState = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime;
          if (wasPlaying) videoRef.current.play();
        }
      };

      videoRef.current.addEventListener("loadedmetadata", restoreState, {
        once: true,
      });
    }
  };

  const changeSubtitle = (subtitleUrl: string) => {
    setCurrentSubtitle(subtitleUrl);
    if (subtitleUrl === "") {
      setSubtitleText("");
      setSubtitleData([]);
    } else {
      loadSubtitleText(subtitleUrl);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`video-player ${
        !showControls && isPlaying ? "video-player--hide-cursor" : ""
      }`}
      onTouchStart={handleTouchStart}
    >
      {src && (
        <video
          ref={videoRef}
          src={src}
          className="video-player__video"
          onTimeUpdate={handleTimeUpdate}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onError={handleVideoError}
          onClick={togglePlay}
          crossOrigin="anonymous"
        ></video>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="text-center">
            <p className="text-red-500 text-xl mb-4">{error}</p>
            <button
              className="px-4 py-2 bg-white/10 rounded hover:bg-white/20"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && !error && (
        <div className="video-player__buffering">
          <div className="spinner"></div>
        </div>
      )}

      {/* Subtitle Overlay */}
      {subtitleText && (
        <div
          className={`video-subtitle ${
            !showControls && isPlaying ? "video-subtitle--controls-hidden" : ""
          }`}
        >
          {subtitleText}
        </div>
      )}

      {/* Overlay Controls */}
      <div
        className={`video-player__overlay ${
          !showControls && isPlaying ? "video-player__overlay--hidden" : ""
        }`}
      >
        {/* Top Bar */}
        <div className="video-player__top">
          <button className="video-btn" onClick={handleBack}>
            <ArrowLeft size={24} />
          </button>
          <h2 className="video-title">{title}</h2>
        </div>

        {/* Center Play Button (only when paused) */}
        {!isPlaying && !isBuffering && !error && (
          <button className="video-player__center-play" onClick={togglePlay}>
            <Play size={48} fill="currentColor" />
          </button>
        )}

        {/* Bottom Controls */}
        <div className="video-player__controls">
          {/* Progress Bar */}
          <div className="video-progress">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="video-progress__slider"
              style={{ backgroundSize: `${progress}% 100%` }}
            />
          </div>

          <div className="video-controls-row">
            <div className="video-controls-left">
              <button className="video-btn" onClick={togglePlay}>
                {isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" />
                )}
              </button>

              <button
                className="video-btn"
                onClick={() => skip(-10)}
                title={isTVShow ? "Previous Episode" : "Rewind 10s"}
              >
                <SkipBack size={20} />
              </button>

              <button
                className="video-btn"
                onClick={() => skip(10)}
                title={isTVShow ? "Next Episode" : "Forward 10s"}
              >
                <SkipForward size={20} />
              </button>

              <div className="video-volume">
                <button className="video-btn" onClick={toggleMute}>
                  {isMuted || volume === 0 ? (
                    <VolumeX size={24} />
                  ) : (
                    <Volume2 size={24} />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                  style={{
                    backgroundSize: `${(isMuted ? 0 : volume) * 100}% 100%`,
                  }}
                />
              </div>

              <span className="video-time">
                {formatTime(videoRef.current?.currentTime || 0)} /{" "}
                {formatTime(duration)}
              </span>
            </div>

            <div className="video-controls-right">
              {/* Quality Select */}
              {qualities.length > 1 && (
                <select
                  className="video-select"
                  value={currentQuality}
                  onChange={(e) => changeQuality(e.target.value)}
                >
                  {qualities.map((q) => (
                    <option key={q.quality} value={q.quality}>
                      {q.quality}
                    </option>
                  ))}
                </select>
              )}

              {/* Subtitle Select */}
              {captions.length > 0 && (
                <select
                  className="video-select"
                  value={currentSubtitle}
                  onChange={(e) => changeSubtitle(e.target.value)}
                >
                  <option value="">Off</option>
                  {captions.map((cap) => (
                    <option key={cap.id} value={cap.url}>
                      {cap.languageName}
                    </option>
                  ))}
                </select>
              )}

              <button className="video-btn" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
