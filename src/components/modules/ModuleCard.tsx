import { 
  Clock, 
  Star, 
  Lock, 
  CheckCircle2, 
  Shield, 
  Mail, 
  Bug, 
  Key, 
  Users, 
  AlertTriangle,
  Mic,
  Cpu,
  Smartphone,
  Fish,
  Activity,
  Send,
  MessageCircle
} from 'lucide-react';
import type { Challenge } from '../../types';
import { categoryDisplayLabel } from '../../constants/challenges';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate } from '../../i18n/messages';

interface ModuleCardProps {
  challenge: Challenge;
  onClick: (id: string) => void;
  isDone: boolean;
  progressionLocked: boolean;
  progressionLockReason: string | null;
  index: number;
  categoryImage?: string | null;
}

const CATEGORY_COLORS = [
  'bg-pink-100/50',
  'bg-cyan-100/50',
  'bg-orange-100/50',
  'bg-purple-100/50',
  'bg-emerald-100/50',
  'bg-amber-100/50',
];

const ICON_CONTAINER_COLORS = [
  'from-pink-400 to-pink-500',
  'from-cyan-400 to-cyan-500',
  'from-orange-400 to-orange-500',
  'from-purple-400 to-purple-500',
  'from-emerald-400 to-emerald-500',
  'from-amber-400 to-amber-500',
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'general': Shield,
  'phishing': Mail,
  'malware': Bug,
  'password': Key,
  'social-engineering': Users,
  'socialengineering': Users,
  'incident-response': AlertTriangle,
  'incidentresponse': AlertTriangle,
};

const getCategoryIcon = (category: string, title: string): React.ElementType => {
  const cat = category.toLowerCase().replace(/[\s-]/g, '');
  const t = title.toLowerCase();

  // Title-based overrides for more variety within categories
  if (t.includes('voice') || t.includes('phone') || t.includes('call')) return Mail; // Placeholder, will replace below
  if (t.includes('deepfake') || t.includes('ai')) return Shield; 
  
  return CATEGORY_ICONS[cat] || Shield;
};

export const ModuleCard: React.FC<ModuleCardProps> = ({
  challenge,
  onClick,
  isDone,
  progressionLocked,
  progressionLockReason,
  index,
  categoryImage,
}) => {
  const { messages } = useI18n();
  const ch = messages.challenges;
  
  const bgColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  const iconGradient = ICON_CONTAINER_COLORS[index % ICON_CONTAINER_COLORS.length];
  
  // Smarter Icon Selection
  const getDynamicIcon = () => {
    const t = challenge.title.toLowerCase();
    const c = challenge.category.toLowerCase().replace(/[\s-]/g, '');

    // Local 3D PNG Icons (Priority)
    let src = '';
    if (t.includes('deepfake')) src = '/assets/masks.png';
    else if (t.includes('ai') && t.includes('voice')) src = '/assets/phone-ai.png';
    else if (t.includes('voice') && t.includes('phishing')) src = '/assets/voice-wave.png';
    else if (t.includes('social') && t.includes('engineering')) src = '/assets/social-web.png';
    else if (t.includes('email') && t.includes('phishing')) src = '/assets/email-hook.png';
    else if (t.includes('malware') || t.includes('virus') || t.includes('ransomware')) src = '/assets/ransomware.png';
    else if (c === 'general' || t.includes('privacy')) src = '/assets/privacy.png';
    else if (t.includes('social') || t.includes('network') || t.includes('web')) src = '/assets/social-web.png';

    if (src) {
      return (
        <img 
          src={src} 
          alt="" 
          className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110" 
        />
      );
    }

    // Title keywords fallback (Lucide)
    const lucideProps = { size: 48, strokeWidth: 1.2, className: "fill-white/20" };
    if (t.includes('telegram')) return <Send {...lucideProps} className="fill-white/20 rotate-45" />;
    if (t.includes('whatsapp')) return <MessageCircle {...lucideProps} />;
    if (t.includes('voice') || t.includes('audio')) return <Mic {...lucideProps} />;
    if (t.includes('phone') || t.includes('call') || t.includes('smartphone')) return <Smartphone {...lucideProps} />;
    if (t.includes('ai') || t.includes('artificial')) return <Cpu {...lucideProps} />;
    if (t.includes('phishing')) return <Fish {...lucideProps} />;
    
    // Category fallbacks (Lucide)
    const Icon = CATEGORY_ICONS[c] || Shield;
    return <Icon {...lucideProps} />;
  };

  const CategoryIcon = getDynamicIcon();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !progressionLocked && onClick(challenge.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!progressionLocked) onClick(challenge.id);
        }
      }}
      className={`group relative w-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
        progressionLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
      }`}
    >
      {/* Top Background Section */}
      <div className={`aspect-video w-full rounded-3xl bg-neutral-100 flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:shadow-md border border-neutral-100`}>
        {/* Category Image Background */}
        {categoryImage ? (
          <img 
            src={categoryImage} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${iconGradient} opacity-10`} />
        )}
        
        {/* Status & Scope Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isDone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
              <CheckCircle2 className="h-3 w-3" />
              {ch.done}
            </span>
          )}
          {progressionLocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
              <Lock className="h-3 w-3" />
              {ch.statusLockedShort}
            </span>
          )}
          {/* Scope Badge */}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm ${
            !challenge.orgId ? 'bg-blue-500/80' : !challenge.deptId ? 'bg-indigo-500/80' : 'bg-purple-500/80'
          }`}>
            <Shield className="h-3 w-3" />
            {!challenge.orgId ? 'Global' : !challenge.deptId ? 'Org' : 'Dept'}
          </span>
        </div>

        {/* Difficulty Badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur-md border ${
            challenge.difficulty === 'advanced' 
              ? 'bg-rose-500/80 text-white border-rose-400/50' 
              : challenge.difficulty === 'intermediate'
              ? 'bg-amber-500/80 text-white border-amber-400/50' 
              : 'bg-emerald-500/80 text-white border-emerald-400/50'
          }`}>
            {challenge.difficulty === 'advanced' ? 'Advanced' : challenge.difficulty === 'intermediate' ? 'Middle' : 'Beginner'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-4 space-y-1.5 px-0.5">
        <h3 className="line-clamp-1 text-[16px] font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors tracking-tight">
          {challenge.title}
        </h3>
        
        <div className="flex items-center justify-between text-[13px] text-neutral-500 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock size={15} className="text-neutral-400" />
              ~{challenge.duration}m
            </span>
            <span className="flex items-center gap-1.5">
              <Star size={15} className="text-neutral-400 fill-neutral-400" />
              {(challenge.rating ?? 0).toFixed(1)}
            </span>
          </div>
          <span className="text-neutral-400">
            {challenge.releaseDate || 'Aug. 2025'}
          </span>
        </div>
      </div>
      
      {/* Tooltip for locked challenges */}
      {progressionLocked && (
        <div className="absolute inset-x-0 bottom-full mb-2 hidden group-hover:block z-20">
          <div className="bg-black/90 text-white text-[10px] p-2 rounded-lg shadow-xl border border-white/10 animate-in fade-in slide-in-from-bottom-1">
            {progressionLockReason || ch.lockedTitle}
          </div>
        </div>
      )}
    </div>
  );
};
