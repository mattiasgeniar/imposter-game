import { useT } from '../i18n/LocaleProvider'

type Props = {
  title: string
  onBack: () => void
}

export function ScreenHeader({ title, onBack }: Props) {
  const t = useT()
  return (
    <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center py-3">
      <button
        type="button"
        onClick={onBack}
        className="h-10 w-10 -ml-2 flex items-center justify-center text-white/90 active:opacity-60 transition-opacity duration-150"
        aria-label={t('common.back')}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden focusable="false">
          <path
            d="M15 5l-7 7 7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <h2 className="text-base font-semibold text-center truncate">{title}</h2>
      <span aria-hidden />
    </div>
  )
}
