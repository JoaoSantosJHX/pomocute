import React, { useEffect, useState } from 'react';
import { FaCog, FaGoogle, FaMinus, FaPlus, FaSignOutAlt, FaTimes, FaUserCircle, FaVolumeUp } from 'react-icons/fa';
import { authConfigured, captureOAuthSession, getStoredUser, loadCurrentUser, signInWithGoogle, signInWithPassword, signOut, signUpWithPassword } from '../services/auth';
import { languageOptions, useI18n } from '../i18n';

const initialForm = { name: '', email: '', password: '' };

function avatarFor(user) {
  return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
}

function SessionLengthControl({ label, minutes, disabled, onDecrease, onIncrease }) {
  const { t } = useI18n();
  return <div className="settings-duration">
    <span>{label}</span>
    <div>
      <button type="button" onClick={onDecrease} disabled={disabled} aria-label={t('settings.decrease', { label })}><FaMinus /></button>
      <strong>{minutes}<small>{t('settings.minute')}</small></strong>
      <button type="button" onClick={onIncrease} disabled={disabled} aria-label={t('settings.increase', { label })}><FaPlus /></button>
    </div>
  </div>;
}

export default function AccountControls({
  preferences,
  isSessionLocked,
  onDurationChange,
  onLanguageChange,
  onAlarmEnabledChange,
  onAlarmSoundChange,
  onAlarmVolumeChange,
  onTestAlarm,
}) {
  const { t } = useI18n();
  const [user, setUser] = useState(() => getStoredUser());
  const [panel, setPanel] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    captureOAuthSession();
    loadCurrentUser().then(setUser).catch(() => {
      // Mantém a sessão local visível se a rede estiver temporariamente indisponível.
    });
  }, []);

  const openAuth = () => {
    setPanel('auth');
    setIsRegistering(false);
    setMessage('');
    setForm(initialForm);
  };
  const openProfile = () => {
    if (user) setPanel('account');
    else openAuth();
  };
  const change = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
  const submit = async event => {
    event.preventDefault();
    setMessage('');
    if (form.password.length < 8) { setMessage(t('account.passwordHint')); return; }
    setIsSubmitting(true);
    try {
      const nextUser = isRegistering
        ? await signUpWithPassword(form.email, form.password, form.name.trim())
        : await signInWithPassword(form.email, form.password);
      setUser(nextUser || null);
      if (nextUser) setPanel(null);
      else setMessage(t('account.confirmEmail'));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const google = () => {
    try { signInWithGoogle(); } catch (error) { setMessage(error.message); }
  };
  const logout = () => {
    signOut();
    setUser(null);
    setPanel(null);
  };
  const avatar = avatarFor(user);
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Profile';
  const alarm = preferences.alarm;
  const panelLabel = panel === 'auth' ? t('account.signIn') : panel === 'account' ? t('account.data') : t('settings.title');

  return <div className="account-controls">
    <button type="button" className="account-icon-button" onClick={openProfile} aria-label={user ? t('account.profile', { name: displayName }) : t('account.signIn')} title={user ? displayName : t('account.signIn')}>
      {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : <FaUserCircle aria-hidden="true" />}
    </button>
    <button type="button" className="account-icon-button" onClick={() => setPanel('settings')} aria-label={t('account.settings')} title={t('account.settings')}><FaCog aria-hidden="true" /></button>

    {panel && <div className={`account-popover${panel === 'settings' ? ' account-popover--settings' : ''}`} role="dialog" aria-modal="true" aria-label={panelLabel}>
      <button type="button" className="account-popover__close" onClick={() => setPanel(null)} aria-label={t('account.close')}><FaTimes /></button>
      {panel === 'auth' && <>
        <span className="account-popover__eyebrow">{t('account.space')}</span>
        <h2>{isRegistering ? t('account.createTitle') : t('account.welcomeBack')}</h2>
        <p>{t('account.syncDescription')}</p>
        <button type="button" className="account-google" onClick={google}><FaGoogle /> {t('account.continueGoogle')}</button>
        <div className="account-divider"><span>{t('account.or')}</span></div>
        <form onSubmit={submit}>
          {isRegistering && <label>{t('account.name')}<input name="name" value={form.name} onChange={change} autoComplete="name" required /></label>}
          <label>{t('account.email')}<input type="email" name="email" value={form.email} onChange={change} autoComplete="email" required /></label>
          <label>{t('account.password')}<input type="password" name="password" value={form.password} onChange={change} autoComplete={isRegistering ? 'new-password' : 'current-password'} required /></label>
          {message && <p className="account-message" role="status">{message}</p>}
          <button className="account-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? t('account.wait') : isRegistering ? t('account.createAccount') : t('account.login')}</button>
        </form>
        <button type="button" className="account-switch" onClick={() => { setIsRegistering(value => !value); setMessage(''); }}>{isRegistering ? t('account.loginSwitch') : t('account.createSwitch')}</button>
        {!authConfigured && <p className="account-config-note">{t('account.notConfigured')}</p>}
      </>}

      {panel === 'account' && <>
        <span className="account-popover__eyebrow">{t('account.eyebrow')}</span>
        <h2>{t('account.data')}</h2>
        <div className="account-summary">{avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : <FaUserCircle />}<div><strong>{displayName}</strong><span>{user?.email}</span></div></div>
        <button type="button" className="account-signout" onClick={logout}><FaSignOutAlt /> {t('account.signOut')}</button>
      </>}

      {panel === 'settings' && <>
        <span className="account-popover__eyebrow">{t('settings.eyebrow')}</span>
        <h2>{t('settings.title')}</h2>

        <section className="settings-section settings-language">
          <label htmlFor="language-select">{t('settings.language')}</label>
          <select id="language-select" value={preferences.language} onChange={event => onLanguageChange(event.target.value)}>
            {languageOptions.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}
          </select>
        </section>

        <section className="settings-section">
          <h3>{t('settings.sessionLengths')}</h3>
          <div className="settings-durations">
            <SessionLengthControl label={t('settings.focus')} minutes={preferences.durations.pomodoro} disabled={isSessionLocked} onDecrease={() => onDurationChange('pomodoro', -1)} onIncrease={() => onDurationChange('pomodoro', 1)} />
            <SessionLengthControl label={t('settings.shortBreak')} minutes={preferences.durations.short} disabled={isSessionLocked} onDecrease={() => onDurationChange('short', -1)} onIncrease={() => onDurationChange('short', 1)} />
            <SessionLengthControl label={t('settings.longBreak')} minutes={preferences.durations.long} disabled={isSessionLocked} onDecrease={() => onDurationChange('long', -1)} onIncrease={() => onDurationChange('long', 1)} />
          </div>
          {isSessionLocked && <p className="settings-note">{t('settings.locked')}</p>}
        </section>

        <section className="settings-section settings-alarm">
          <div className="settings-section__heading"><h3>{t('settings.alarm')}</h3><label className="settings-toggle"><input type="checkbox" checked={alarm.enabled} onChange={event => onAlarmEnabledChange(event.target.checked)} aria-label={alarm.enabled ? t('settings.alarmOn') : t('settings.alarmOff')} /><span aria-hidden="true" /></label></div>
          <div className="settings-alarm-types" aria-label={t('settings.alarm')}>
            {['chime', 'bell', 'digital'].map(type => <button key={type} type="button" className={alarm.type === type ? 'is-selected' : ''} disabled={!alarm.enabled} onClick={() => onAlarmSoundChange(type)}>{t(`settings.${type}`)}</button>)}
          </div>
          <label className="settings-volume" htmlFor="alarm-volume"><FaVolumeUp aria-hidden="true" /><span>{t('settings.volume')}</span><input id="alarm-volume" type="range" min="0" max="100" value={alarm.volume} disabled={!alarm.enabled} onChange={event => onAlarmVolumeChange(Number(event.target.value))} /><output>{alarm.volume}%</output></label>
          <button type="button" className="settings-test-alarm" onClick={onTestAlarm} disabled={!alarm.enabled}>{t('settings.testAlarm')}</button>
        </section>
      </>}
    </div>}
  </div>;
}
