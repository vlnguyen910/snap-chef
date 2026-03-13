interface FeedHeroProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  badgeTimer?: string;
  ctaText?: string;
  onCta?: () => void;
  participantCount?: string;
}

export default function FeedHero({
  title = 'Master the Art of Hand-Rolled Gnocchi',
  subtitle = 'are cooking this today',
  badgeText = 'Daily Challenge',
  badgeTimer = 'Ending in 4h 22m',
  ctaText = 'Join Challenge',
  onCta,
  participantCount = '+12k',
}: Readonly<FeedHeroProps>) {
  return (
    <div className="relative h-[260px] md:h-[360px] rounded-3xl overflow-hidden group">
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=1200&q=80"
        alt="Daily Challenge — Hand-rolled gnocchi pasta"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-widest">
            {badgeText}
          </span>
          <span className="text-white/80 text-xs font-medium">{badgeTimer}</span>
        </div>

        <h2 className="text-white text-2xl md:text-4xl font-black mb-4 tracking-tight leading-tight max-w-lg">
          {title}
        </h2>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={onCta}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 text-sm"
          >
            {ctaText}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/40?img=${20 + i}`}
                  alt={`Participant ${i}`}
                  className="w-7 h-7 rounded-full border-2 border-black object-cover"
                />
              ))}
              <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-black flex items-center justify-center text-[9px] text-white font-bold">
                {participantCount}
              </div>
            </div>
            <span className="text-white/80 text-xs font-medium">{subtitle}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
