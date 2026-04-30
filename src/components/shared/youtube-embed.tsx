export function YouTubeEmbed({
  videoId,
  title,
  className,
}: {
  videoId: string;
  title?: string;
  className?: string;
}) {
  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900 ${className || ""}`}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0`}
        title={title || "Workout video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

export function YouTubeThumbnail({
  videoId,
  title,
  className,
}: {
  videoId: string;
  title?: string;
  className?: string;
}) {
  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-lg bg-slate-200 ${className || ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
        alt={title || "Video thumbnail"}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 ml-1">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
