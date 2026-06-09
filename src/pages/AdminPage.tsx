import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ClipRecord, Mood, SiteSettings, Story } from '../lib/types'
import {
  fetchStories, adminDeleteStory, listMoods, upsertMood, deleteMood, updateSettings,
  adminListClips, addClip, updateClip, deleteClip, fetchYtMeta, extractYouTubeId,
} from '../lib/db'
import { invalidateMoods } from '../hooks/useMoods'
import { invalidateClips } from '../hooks/useClips'
import { useSession } from '../context/session'
import { useSettings } from '../context/settings'
import { timeAgo } from '../lib/format'
import PillButton from '../components/PillButton'
import { ADMIN_EMAILS } from '../lib/supabase'
import styles from './AdminPage.module.css'

export default function AdminPage() {
  const { ready, isAdmin, email, signInWithEmail, signOut } = useSession()

  if (!ready) {
    return <div className={styles.page}><p className={styles.center}>Loading…</p></div>
  }
  if (!isAdmin) {
    return <SignIn email={email} signInWithEmail={signInWithEmail} signOut={signOut} />
  }
  return <Dashboard email={email} signOut={signOut} />
}

/* ---------------- Sign in ---------------- */
function SignIn({
  email, signInWithEmail, signOut,
}: { email: string | null; signInWithEmail: (e: string) => Promise<void>; signOut: () => Promise<void> }) {
  const [addr, setAddr] = useState(ADMIN_EMAILS[0])
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const send = async () => {
    setBusy(true); setErr(null)
    try {
      await signInWithEmail(addr)
      setSent(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not send the link.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.signin}>
        <h1 className={styles.signinTitle}>Admin</h1>
        {email ? (
          <>
            <p className={styles.lead}>
              You're signed in as <b>{email}</b>, which isn't an admin account.
            </p>
            <PillButton variant="outline" onClick={signOut}>Sign out</PillButton>
          </>
        ) : sent ? (
          <p className={styles.lead}>
            Check <b>{addr}</b> for a sign-in link, then open it on this device.
          </p>
        ) : (
          <>
            <p className={styles.lead}>Sign in with the owner email to manage the site.</p>
            <input
              className={styles.input}
              type="email"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="you@example.com"
            />
            {err && <p className={styles.err}>{err}</p>}
            <PillButton onClick={send} disabled={busy || addr.trim().length === 0}>
              {busy ? 'Sending…' : 'Email me a magic link'}
            </PillButton>
          </>
        )}
        <Link to="/" className={styles.backLink}>← Back to the wall</Link>
      </div>
    </div>
  )
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ email, signOut }: { email: string | null; signOut: () => Promise<void> }) {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <h1 className={styles.h1}>Admin</h1>
        <div className={styles.topRight}>
          <Link to="/" className={styles.backLink}>View site</Link>
          <span className={styles.who}>{email}</span>
          <button className={styles.signout} onClick={signOut}>Sign out</button>
        </div>
      </header>

      <SettingsSection />
      <ClipsSection />
      <MoodsSection />
      <StoriesSection />
    </div>
  )
}

/* ---------------- Settings ---------------- */
function SettingsSection() {
  const { settings, reload } = useSettings()
  const [form, setForm] = useState<SiteSettings>(settings)
  const [status, setStatus] = useState<string | null>(null)

  // Sync the editable form when the async-loaded settings arrive.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setForm(settings) }, [settings])

  const save = async () => {
    setStatus('Saving…')
    try {
      await updateSettings(form)
      await reload()
      setStatus('Saved ✓')
      setTimeout(() => setStatus(null), 1800)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>Site title & copy</h2>
      <label className={styles.field}>
        <span>Brand title</span>
        <input className={styles.input} value={form.brandTitle}
          onChange={(e) => setForm({ ...form, brandTitle: e.target.value })} />
      </label>
      <label className={styles.field}>
        <span>Hero kicker</span>
        <input className={styles.input} value={form.heroKicker}
          onChange={(e) => setForm({ ...form, heroKicker: e.target.value })} />
      </label>
      <label className={styles.field}>
        <span>Hero prompt</span>
        <input className={styles.input} value={form.heroPrompt}
          onChange={(e) => setForm({ ...form, heroPrompt: e.target.value })} />
      </label>
      <div className={styles.row}>
        <PillButton onClick={save}>Save changes</PillButton>
        {status && <span className={styles.status}>{status}</span>}
      </div>
    </section>
  )
}

/* ---------------- Clip theater ---------------- */
const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

function ClipsSection() {
  const [clips, setClips] = useState<ClipRecord[]>([])
  const [url, setUrl] = useState('')
  const [draft, setDraft] = useState<ClipRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => { invalidateClips(); setClips(await adminListClips()) }

  useEffect(() => {
    let active = true
    ;(async () => {
      try { const c = await adminListClips(); if (active) setClips(c) } catch { /* ignore */ }
    })()
    return () => { active = false }
  }, [])

  const getInfo = async () => {
    setErr(null)
    const id = extractYouTubeId(url)
    if (!id) { setErr('Paste a valid YouTube link or 11-char video id.'); return }
    setBusy(true)
    try {
      const meta = await fetchYtMeta(url)
      setDraft({ id, kind: 'official', title: meta.title, channel: meta.channel,
        channelUrl: meta.channelUrl, thumbnail: meta.thumbnail || ytThumb(id), sort: 999, enabled: true })
    } catch {
      setDraft({ id, kind: 'official', title: '', channel: '',
        channelUrl: `https://www.youtube.com/watch?v=${id}`, thumbnail: ytThumb(id), sort: 999, enabled: true })
      setErr('Could not auto-fetch info — fill it in manually below.')
    } finally {
      setBusy(false)
    }
  }

  const add = async () => {
    if (!draft) return
    if (!draft.title.trim() || !draft.channel.trim()) { setErr('Title and channel are required.'); return }
    setBusy(true); setErr(null)
    try {
      await addClip(draft)
      setDraft(null); setUrl('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not add clip.')
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (c: ClipRecord) => {
    setClips((cs) => cs.map((x) => (x.id === c.id ? { ...x, enabled: !x.enabled } : x)))
    try { await updateClip(c.id, { enabled: !c.enabled }); invalidateClips() } catch { await load() }
  }

  const remove = async (c: ClipRecord) => {
    if (!window.confirm(`Remove "${c.title}" from the theater?`)) return
    setClips((cs) => cs.filter((x) => x.id !== c.id))
    try { await deleteClip(c.id); invalidateClips() } catch { await load() }
  }

  const enabledCount = clips.filter((c) => c.enabled).length

  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>Clip theater</h2>
      <p className={styles.help}>
        YouTube videos that shuffle in the “watch something wonderful” section. {enabledCount} of {clips.length} active.
      </p>

      <div className={styles.addClip}>
        <input className={styles.input} placeholder="Paste a YouTube link…"
          value={url} onChange={(e) => setUrl(e.target.value)} />
        <PillButton variant="outline" onClick={getInfo} disabled={busy || !url.trim()}>
          {busy ? '…' : 'Get info'}
        </PillButton>
      </div>

      {draft && (
        <div className={styles.draft}>
          {draft.thumbnail && <img className={styles.draftThumb} src={draft.thumbnail} alt="" />}
          <div className={styles.draftFields}>
            <input className={styles.inputSm} placeholder="Title"
              value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <input className={styles.inputSm} placeholder="Channel (credit)"
              value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value })} />
            <select className={styles.select} value={draft.kind}
              onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
              <option value="official">Official</option>
              <option value="amv">AMV</option>
            </select>
            <PillButton onClick={add} disabled={busy}>Add to theater</PillButton>
          </div>
        </div>
      )}
      {err && <p className={styles.err}>{err}</p>}

      <div className={styles.clipList}>
        {clips.map((c) => (
          <div key={c.id} className={`${styles.clipRow} ${c.enabled ? '' : styles.clipOff}`}>
            {c.thumbnail && <img className={styles.clipThumb} src={c.thumbnail} alt="" />}
            <div className={styles.clipMeta}>
              <span className={styles.clipTitle}>{c.title}</span>
              <span className={styles.clipSub}>{c.channel} · {c.kind === 'amv' ? 'AMV' : 'Official'}</span>
            </div>
            <label className={styles.switch}>
              <input type="checkbox" checked={c.enabled} onChange={() => toggle(c)} />
              {c.enabled ? 'On' : 'Off'}
            </label>
            <button className={styles.del} onClick={() => remove(c)}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Moods ---------------- */
function MoodsSection() {
  const [moods, setMoods] = useState<Mood[]>([])
  const [slug, setSlug] = useState('')
  const [label, setLabel] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    invalidateMoods()
    setMoods(await listMoods())
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try { const m = await listMoods(); if (active) setMoods(m) } catch { /* ignore */ }
    })()
    return () => { active = false }
  }, [])

  const add = async () => {
    setErr(null)
    const s = slug.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!s || !label.trim()) { setErr('Need a slug and a label.'); return }
    try {
      await upsertMood({ slug: s, label: label.trim(), sort: (moods.at(-1)?.sort ?? 0) + 1 })
      setSlug(''); setLabel('')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not add.')
    }
  }

  const remove = async (s: string) => {
    if (!window.confirm(`Remove the "${s}" phase? Stories keep their text but lose this tag.`)) return
    try { await deleteMood(s); await load() } catch (e) { setErr(e instanceof Error ? e.message : 'Failed') }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>Mood phases</h2>
      <p className={styles.help}>The feelings people can tag a story with (and filter the wall by).</p>
      <div className={styles.moodList}>
        {moods.map((m) => (
          <span key={m.slug} className={styles.moodTag}>
            {m.label}
            <button className={styles.x} onClick={() => remove(m.slug)} aria-label={`Remove ${m.label}`}>×</button>
          </span>
        ))}
      </div>
      <div className={styles.addMood}>
        <input className={styles.inputSm} placeholder="slug (e.g. hopeful)" value={slug}
          onChange={(e) => setSlug(e.target.value)} />
        <input className={styles.inputSm} placeholder="Label (e.g. Need hope)" value={label}
          onChange={(e) => setLabel(e.target.value)} />
        <PillButton variant="outline" onClick={add}>Add phase</PillButton>
      </div>
      {err && <p className={styles.err}>{err}</p>}
    </section>
  )
}

/* ---------------- Stories ---------------- */
function StoriesSection() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const s = await fetchStories()
        if (active) { setStories(s); setLoading(false) }
      } catch (e) {
        if (active) { setErr(e instanceof Error ? e.message : 'Failed to load'); setLoading(false) }
      }
    })()
    return () => { active = false }
  }, [])

  const remove = async (id: string) => {
    if (!window.confirm('Delete this story permanently?')) return
    const prev = stories
    setStories((s) => s.filter((x) => x.id !== id))
    try { await adminDeleteStory(id) } catch (e) {
      setStories(prev)
      setErr(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>Stories ({stories.length})</h2>
      {err && <p className={styles.err}>{err}</p>}
      {loading ? (
        <p className={styles.help}>Loading…</p>
      ) : (
        <div className={styles.stories}>
          {stories.map((s) => (
            <div key={s.id} className={styles.storyRow}>
              <div className={styles.storyMain}>
                <div className={styles.storyTop}>
                  <strong>{s.anime.title}</strong>
                  <span className={styles.meta}>
                    @{s.author} · {timeAgo(s.createdAt)} · ♥ {s.likeCount}
                    {s.moodLabel ? ` · ${s.moodLabel}` : ''}
                  </span>
                </div>
                <p className={styles.storyBody}>{s.body}</p>
              </div>
              <button className={styles.del} onClick={() => remove(s.id)}>Delete</button>
            </div>
          ))}
          {stories.length === 0 && <p className={styles.help}>No stories yet.</p>}
        </div>
      )}
    </section>
  )
}
