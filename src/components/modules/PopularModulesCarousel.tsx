import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ModuleCard } from './ModuleCard';
import { getImageUrl } from '../../utils/imageUtils';
import type { Challenge } from '../../types';
import { useI18n } from '../../i18n/I18nContext';

interface PopularModulesCarouselProps {
  challenges: Challenge[];
  passedIds: Set<string>;
  lockInfoById: Map<string, any>;
  onChallengeClick: (id: string) => void;
  categories: any[];
  title?: string;
}

export const PopularModulesCarousel: React.FC<PopularModulesCarouselProps> = ({
  challenges,
  passedIds,
  lockInfoById,
  onChallengeClick,
  categories,
  title,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages } = useI18n();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (challenges.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            {title || messages.challenges.popularModulesTitle || 'Popular Modules'}
          </h2>
          <p className="text-[14px] text-neutral-500 font-medium max-w-2xl">
            {title === "Popular Modules" 
              ? "High-usage, highly rated modules across the platform. Trusted by teams to cover essential topics."
              : "The latest additions to our security training library. Stay up to date with new threats."}
          </p>
        </div>
        
        <div className="flex items-center gap-2 pb-1">
          <button
            onClick={() => scroll('left')}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:bg-neutral-50 hover:shadow-md active:scale-95"
            aria-label="Previous"
          >
            <ChevronLeft size={24} className="text-neutral-900" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:bg-neutral-50 hover:shadow-md active:scale-95"
            aria-label="Next"
          >
            <ChevronRight size={24} className="text-neutral-900" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="hide-scrollbar flex gap-6 overflow-x-auto pb-4 scroll-smooth"
      >
        {challenges.map((challenge, idx) => {
          const lock = lockInfoById.get(challenge.id);
          const category = categories.find(cat => cat.name === challenge.category);
          const catImg = category ? getImageUrl(category.image_url) : null;

          return (
            <div key={challenge.id} className="min-w-[240px] w-[240px] sm:min-w-[280px] sm:w-[280px]">
              <ModuleCard
                challenge={challenge}
                index={idx}
                isDone={passedIds.has(challenge.id)}
                progressionLocked={lock?.progressionLocked ?? false}
                progressionLockReason={lock?.progressionLockReason ?? null}
                onClick={onChallengeClick}
                categoryImage={catImg}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
