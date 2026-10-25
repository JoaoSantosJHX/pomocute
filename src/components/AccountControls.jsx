import React, { useEffect, useState } from 'react';
import { FaCog, FaGoogle, FaSignOutAlt, FaTimes, FaUserCircle } from 'react-icons/fa';
import { authConfigured, captureOAuthSession, getStoredUser, loadCurrentUser, signInWithGoogle, signInWithPassword, signOut, signUpWithPassword } from '../services/auth';

const initialForm = { name: '', email: '', password: '' };

function avatarFor(user) {
  return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
}

export default function AccountControls() {
  const [user, setUser] = useState(() => getStoredUser());
  const [panel, setPanel] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    captureOAuthSession();
    loadCurrentUser().then(setUser);
  }, []);

  const openAuth = () => {
    setPanel('auth');
    setMessage('');
    setForm(initialForm);
  };
  const change = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
  const submit = async event => {
    event.preventDefault();
    setMessage('');
    if (form.password.length < 8) { setMessage('Use uma senha com pelo menos 8 caracteres.'); return; }
    setIsSubmitting(true);
    try {
      const nextUser = isRegistering
        ? await signUpWithPassword(form.email, form.password, form.name.trim())
        : await signInWithPassword(form.email, form.password);
      setUser(nextUser || null);
      if (nextUser) setPanel(null);
      else setMessage('Conta criada. Confirme o e-mail enviado para entrar.');
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
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Perfil';

  return <div className="account-controls">
    <button type="button" className="account-icon-button" onClick={openAuth} aria-label={user ? `Perfil de ${displayName}` : 'Entrar ou criar conta'} title={user ? displayName : 'Entrar'}>
      {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : <FaUserCircle aria-hidden="true" />}
    </button>
    <button type="button" className="account-icon-button" onClick={() => setPanel('settings')} aria-label="Configurações" title="Configurações"><FaCog aria-hidden="true" /></button>

    {panel && <div className="account-popover" role="dialog" aria-modal="true" aria-label={panel === 'auth' ? 'Entrar no Pomocute' : 'Configurações'}>
      <button type="button" className="account-popover__close" onClick={() => setPanel(null)} aria-label="Fechar"><FaTimes /></button>
      {panel === 'auth' ? <>
        <span className="account-popover__eyebrow">SEU ESPAÇO POMOCUTE</span>
        <h2>{isRegistering ? 'Crie sua conta' : 'Boas-vindas de volta'}</h2>
        <p>Sincronize suas tarefas e acompanhe seus focos.</p>
        <button type="button" className="account-google" onClick={google}><FaGoogle /> Continuar com Google</button>
        <div className="account-divider"><span>ou</span></div>
        <form onSubmit={submit}>
          {isRegistering && <label>Nome<input name="name" value={form.name} onChange={change} autoComplete="name" required /></label>}
          <label>E-mail<input type="email" name="email" value={form.email} onChange={change} autoComplete="email" required /></label>
          <label>Senha<input type="password" name="password" value={form.password} onChange={change} autoComplete={isRegistering ? 'new-password' : 'current-password'} required /></label>
          {message && <p className="account-message" role="status">{message}</p>}
          <button className="account-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Aguarde...' : isRegistering ? 'Criar conta' : 'Entrar'}</button>
        </form>
        <button type="button" className="account-switch" onClick={() => { setIsRegistering(value => !value); setMessage(''); }}>{isRegistering ? 'Já tenho uma conta' : 'Quero criar uma conta'}</button>
        {!authConfigured && <p className="account-config-note">A autenticação será ativada assim que as chaves do Supabase forem configuradas.</p>}
      </> : <>
        <span className="account-popover__eyebrow">CONFIGURAÇÕES</span>
        <h2>Conta e dados</h2>
        {user ? <><div className="account-summary">{avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : <FaUserCircle />}<div><strong>{displayName}</strong><span>{user.email}</span></div></div><button type="button" className="account-signout" onClick={logout}><FaSignOutAlt /> Sair da conta</button></> : <><p>Entre para manter suas tarefas e sessões de foco em qualquer dispositivo.</p><button type="button" className="account-submit" onClick={openAuth}>Entrar ou criar conta</button></>}
      </>}
    </div>}
  </div>;
}