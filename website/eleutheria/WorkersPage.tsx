// The workers page.
//
// Drop it in a route and it works. Style it by editing workers.css, or throw
// that file away and put your own class names on — the markup is plain and the
// component takes no styling library with it.
//
//   import { WorkersPage } from './eleutheria/WorkersPage'
//   <WorkersPage language="ar" />

import { useMemo, useState } from 'react'
import { cvUrl, optionsFor, photoUrl, type Worker } from './workers'
import { useWorkers } from './useWorkers'
import './workers.css'

type Language = 'en' | 'ar'

const TEXT = {
  heading: { en: 'Available workers', ar: 'العاملات المتاحات' },
  search: { en: 'Search by name', ar: 'البحث بالاسم' },
  allCountries: { en: 'All countries', ar: 'كل الدول' },
  allProfessions: { en: 'All professions', ar: 'كل المهن' },
  allTypes: { en: 'All kinds', ar: 'كل الأنواع' },
  domestic: { en: 'Domestic worker', ar: 'عاملة منزلية' },
  profession: { en: 'Skilled worker', ar: 'عامل مهني' },
  loading: { en: 'Loading…', ar: 'جارٍ التحميل…' },
  empty: { en: 'No workers match this search.', ar: 'لا توجد نتائج مطابقة.' },
  none: { en: 'No workers are listed just now.', ar: 'لا توجد عاملات مدرجات حالياً.' },
  failed: { en: 'The list could not be loaded.', ar: 'تعذّر تحميل القائمة.' },
  retry: { en: 'Try again', ar: 'إعادة المحاولة' },
  ofExperience: { en: 'of experience', ar: 'خبرة' },
  oneYear: { en: 'year', ar: 'سنة' },
  someYears: { en: 'years', ar: 'سنوات' },
  age: { en: 'years old', ar: 'سنة' },
  count: { en: 'workers', ar: 'عاملة' },
  noPhoto: { en: 'No photograph', ar: 'بدون صورة' },
  cv: { en: 'View CV', ar: 'عرض السيرة الذاتية' },
} as const

function say(key: keyof typeof TEXT, language: Language): string {
  return TEXT[key][language]
}

export interface WorkersPageProps {
  language?: Language
  /** How many rows to ask for. The view is small; 200 is the default. */
  limit?: number
}

export function WorkersPage({ language = 'en', limit }: WorkersPageProps) {
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [profession, setProfession] = useState('')
  const [type, setType] = useState<'' | Worker['type']>('')

  // Everything published is fetched once and narrowed here, so changing a
  // dropdown is instant and the filters can be built from the real values.
  const { workers, loading, error, reload } = useWorkers(limit ? { limit } : {})

  const countries = useMemo(() => optionsFor(workers, 'country'), [workers])
  const professions = useMemo(() => optionsFor(workers, 'profession'), [workers])

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase()
    return workers.filter((worker) => {
      if (country && worker.country !== country) return false
      if (profession && worker.profession !== profession) return false
      if (type && worker.type !== type) return false
      if (term) {
        const names = `${worker.english_name} ${worker.arabic_name}`.toLowerCase()
        if (!names.includes(term)) return false
      }
      return true
    })
  }, [workers, search, country, profession, type])

  const dir = language === 'ar' ? 'rtl' : 'ltr'

  return (
    <section className="workers" dir={dir} lang={language}>
      <header className="workers-head">
        <h1>{say('heading', language)}</h1>
        {!loading && !error && (
          <p className="workers-count">
            {shown.length} {say('count', language)}
          </p>
        )}
      </header>

      <div className="workers-filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={say('search', language)}
          aria-label={say('search', language)}
        />
        <select value={country} onChange={(event) => setCountry(event.target.value)}>
          <option value="">{say('allCountries', language)}</option>
          {countries.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select value={profession} onChange={(event) => setProfession(event.target.value)}>
          <option value="">{say('allProfessions', language)}</option>
          {professions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(event) => setType(event.target.value as '' | Worker['type'])}
        >
          <option value="">{say('allTypes', language)}</option>
          <option value="Domestic">{say('domestic', language)}</option>
          <option value="Profession">{say('profession', language)}</option>
        </select>
      </div>

      {error && (
        <div className="workers-message workers-error" role="alert">
          <p>{say('failed', language)}</p>
          <p className="workers-detail">{error}</p>
          <button type="button" onClick={reload}>
            {say('retry', language)}
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="workers-grid" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <article key={n} className="worker-card worker-card-skeleton">
              <div className="worker-photo" />
              <div className="worker-line" />
              <div className="worker-line worker-line-short" />
            </article>
          ))}
          <p className="workers-sr">{say('loading', language)}</p>
        </div>
      )}

      {!loading && !error && shown.length === 0 && (
        <p className="workers-message">
          {workers.length === 0 ? say('none', language) : say('empty', language)}
        </p>
      )}

      {!loading && !error && shown.length > 0 && (
        <div className="workers-grid">
          {shown.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} language={language} />
          ))}
        </div>
      )}
    </section>
  )
}

export function WorkerCard({ worker, language }: { worker: Worker; language: Language }) {
  const name = language === 'ar' && worker.arabic_name ? worker.arabic_name : worker.english_name
  const url = photoUrl(worker)
  const cv = cvUrl(worker)

  return (
    <article className="worker-card">
      {url ? (
        <img className="worker-photo" src={url} alt={name} loading="lazy" />
      ) : (
        <div className="worker-photo worker-photo-empty" aria-label={say('noPhoto', language)}>
          <span>{name.slice(0, 1)}</span>
        </div>
      )}

      <h2 className="worker-name">{name}</h2>

      <dl className="worker-facts">
        {worker.profession && <dd className="worker-profession">{worker.profession}</dd>}
        {worker.country && <dd>{worker.country}</dd>}
        {worker.age !== null && (
          <dd>
            {worker.age} {say('age', language)}
          </dd>
        )}
        {worker.experience_years > 0 && (
          <dd>
            {worker.experience_years}{' '}
            {say(worker.experience_years === 1 ? 'oneYear' : 'someYears', language)}{' '}
            {say('ofExperience', language)}
          </dd>
        )}
      </dl>

      {worker.experience.length > 0 && (
        <ul className="worker-jobs">
          {worker.experience.map((job) => (
            <li key={`${job.title}-${job.years}`}>
              <span>{job.title}</span>
              <span className="worker-jobs-years">
                {job.years} {say(job.years === 1 ? 'oneYear' : 'someYears', language)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {cv && (
        <a className="worker-cv" href={cv} target="_blank" rel="noreferrer">
          {say('cv', language)}
        </a>
      )}
    </article>
  )
}
