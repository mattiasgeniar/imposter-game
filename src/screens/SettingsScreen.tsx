import { Screen } from '../components/Screen'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { Stepper } from '../components/Stepper'
import { useLocale, useT } from '../i18n/LocaleProvider'
import { AVAILABLE_LOCALES } from '../i18n/locales'
import { formatTime } from '../game/format'
import type { Settings } from '../game/types'
import type { InstallState } from '../lib/install'

type Props = {
  settings: Settings
  players: string[]
  categoryCount: number
  install: InstallState
  onChange: (s: Settings) => void
  onEditPlayers: () => void
  onStart: () => void
  onBack: () => void
}

const TIME_STEP = 30
const TIME_MIN = 30
const TIME_MAX = 600
const MIN_PLAYERS = 3

export function SettingsScreen({
  settings,
  players,
  categoryCount,
  install,
  onChange,
  onEditPlayers,
  onStart,
  onBack,
}: Props) {
  const t = useT()
  const { locale, setLocale } = useLocale()
  const playerCount = players.length
  const maxImposters = Math.max(1, playerCount - 1)
  const canStart = playerCount >= MIN_PLAYERS && categoryCount >= 1

  return (
    <Screen footer={<Button onClick={onStart} disabled={!canStart}>{t('settings.start')}</Button>}>
      <ScreenHeader title={t('settings.title')} onBack={onBack} />

      <div className="flex-1 scroll-smooth-y space-y-4 pb-2">
        <Card title={t('settings.players.title')} subtitle={t('settings.players.subtitle')}>
          <button
            type="button"
            onClick={onEditPlayers}
            className="w-full flex items-center justify-between gap-3 text-left bg-line/40 active:bg-line rounded-xl px-3 py-3 press-ios-soft"
          >
            <span className="text-sm text-white/80 leading-snug truncate">
              {playerCount === 0
                ? t('settings.players.empty')
                : players.join(', ')}
            </span>
            <span className="text-white/60 text-sm font-semibold shrink-0">
              {t('settings.players.edit')} ›
            </span>
          </button>
        </Card>

        <Card title={t('settings.imposters.title')} subtitle={t('settings.imposters.subtitle')}>
          <Stepper
            value={settings.imposterCount}
            min={1}
            max={maxImposters}
            decreaseLabel={t('settings.imposters.decrease')}
            increaseLabel={t('settings.imposters.increase')}
            onChange={(n) => onChange({ ...settings, imposterCount: n })}
          />
        </Card>

        <Card title={t('settings.time.title')} subtitle={t('settings.time.subtitle')}>
          <Stepper
            value={settings.roundSeconds}
            min={TIME_MIN}
            max={TIME_MAX}
            step={TIME_STEP}
            format={formatTime}
            decreaseLabel={t('settings.time.decrease')}
            increaseLabel={t('settings.time.increase')}
            onChange={(n) => onChange({ ...settings, roundSeconds: n })}
          />
        </Card>

        <Card title={t('settings.hints.title')} subtitle={t('settings.hints.subtitle')}>
          <Segmented
            label={t('settings.hints.title')}
            value={settings.hintsEnabled}
            options={[
              { value: false, label: t('settings.hints.off') },
              { value: true, label: t('settings.hints.on') },
            ]}
            onChange={(v) => onChange({ ...settings, hintsEnabled: v })}
          />
        </Card>

        <Card title={t('settings.voteMode.title')} subtitle={t('settings.voteMode.subtitle')}>
          <Segmented
            label={t('settings.voteMode.title')}
            value={settings.voteMode}
            options={[
              { value: 'individual', label: t('settings.voteMode.individual') },
              { value: 'group', label: t('settings.voteMode.group') },
            ]}
            onChange={(v) => onChange({ ...settings, voteMode: v })}
          />
        </Card>

        <Card title={t('settings.language.title')} subtitle={t('settings.language.subtitle')}>
          <Segmented
            label={t('settings.language.title')}
            value={locale}
            options={AVAILABLE_LOCALES.map(({ code, label }) => ({ value: code, label }))}
            onChange={setLocale}
          />
        </Card>

        <Card title={t('settings.install.title')} subtitle={t('settings.install.subtitle')}>
          <InstallSection install={install} />
        </Card>

        <Credits />
      </div>
    </Screen>
  )
}

function Credits() {
  const t = useT()
  return (
    <div className="pt-2 pb-1 text-center space-y-1.5">
      <p className="text-sm text-white/60 leading-snug">
        {t('settings.credits.builtBy')}{' '}
        <a
          href="https://github.com/mattiasgeniar/imposter-game"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/80 underline underline-offset-2 active:text-white"
        >
          {t('settings.credits.sourceLink')}
        </a>
        .
      </p>
      <p className="text-xs text-white/40 leading-snug">
        {t('settings.credits.thanks')}
      </p>
    </div>
  )
}

function InstallSection({ install }: { install: InstallState }) {
  const t = useT()

  if (install.installed) {
    return <p className="text-sm text-success">✓ {t('settings.install.alreadyInstalled')}</p>
  }
  if (install.isIOS) {
    return <p className="text-sm text-white/80 leading-snug">{t('settings.install.iosInstructions')}</p>
  }
  if (install.hasPromptEvent) {
    return (
      <Button size="md" onClick={() => install.promptInstall()}>
        {t('settings.install.button')}
      </Button>
    )
  }
  return <p className="text-sm text-white/60 leading-snug">{t('settings.install.unavailable')}</p>
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-line rounded-2xl p-4">
      <h3 className="font-bold text-lg leading-tight">{title}</h3>
      <p className="text-sm text-white/60 mt-0.5 mb-3">{subtitle}</p>
      {children}
    </div>
  )
}

type SegmentedProps<T> = {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}

function Segmented<T extends string | number | boolean>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid grid-flow-col auto-cols-fr gap-1 p-1 rounded-xl bg-line/60"
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={String(opt.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={
              `h-10 rounded-lg font-semibold text-sm press-ios ` +
              (selected
                ? 'bg-white text-ink shadow-sm'
                : 'bg-transparent text-white/70 active:text-white')
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
