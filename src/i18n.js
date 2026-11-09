import React, { createContext, useContext, useMemo } from 'react';

export const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
];

const english = {
  'session.type': 'Session type',
  'mode.pomodoro': 'Pomodoro',
  'mode.short': 'Short break',
  'mode.long': 'Long break',
  'status.ready': 'Ready to start',
  'status.runningFocus': 'Time to focus',
  'status.runningBreak': 'Time to rest',
  'status.paused': 'Session paused',
  'status.completed': 'Session complete!',
  'status.ended': 'Session ended without being counted',
  'timer.progress': 'Timer progress',
  'timer.remaining': 'Time remaining',
  'timer.start': 'Start',
  'timer.pause': 'Pause',
  'timer.resume': 'Resume',
  'timer.reset': 'Reset {mode}',
  'timer.chooseBreak': 'Choose a break above to continue.',
  'account.profile': '{name} profile',
  'account.signIn': 'Sign in or create an account',
  'account.settings': 'Settings',
  'account.close': 'Close',
  'account.space': 'YOUR POMOCUTE SPACE',
  'account.welcomeBack': 'Welcome back',
  'account.createTitle': 'Create your account',
  'account.syncDescription': 'Sync your tasks and keep track of your focus sessions.',
  'account.continueGoogle': 'Continue with Google',
  'account.or': 'or',
  'account.name': 'Name',
  'account.email': 'Email',
  'account.password': 'Password',
  'account.wait': 'Please wait...',
  'account.createAccount': 'Create account',
  'account.login': 'Sign in',
  'account.createSwitch': 'Create an account',
  'account.loginSwitch': 'I already have an account',
  'account.passwordHint': 'Use a password with at least 8 characters.',
  'account.confirmEmail': 'Account created. Confirm the email we sent before signing in.',
  'account.notConfigured': 'Authentication will be enabled when the Supabase keys are configured.',
  'account.eyebrow': 'ACCOUNT',
  'account.data': 'Account and data',
  'account.signOut': 'Sign out',
  'account.syncPrompt': 'Sign in to keep your tasks and focus sessions on every device.',
  'settings.eyebrow': 'PREFERENCES',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.sessionLengths': 'Session lengths',
  'settings.focus': 'Focus',
  'settings.shortBreak': 'Short break',
  'settings.longBreak': 'Long break',
  'settings.minute': 'min',
  'settings.decrease': 'Decrease {label}',
  'settings.increase': 'Increase {label}',
  'settings.locked': 'Session lengths are locked while the timer is running or paused.',
  'settings.alarm': 'Alarm',
  'settings.alarmOn': 'Alarm enabled',
  'settings.alarmOff': 'Alarm disabled',
  'settings.chime': 'Chime',
  'settings.bell': 'Bell',
  'settings.digital': 'Digital',
  'settings.volume': 'Alarm volume',
  'settings.testAlarm': 'Test alarm',
  'music.open': 'Open music menu',
  'music.close': 'Close music menu',
  'music.station': 'POMOCUTE STATION',
  'music.choose': 'Choose your soundtrack',
  'music.selected': 'Selected',
  'music.playing': 'Playing',
  'music.links': 'YOUR LINKS',
  'music.empty': 'Add a YouTube or Spotify link.',
  'music.linkLabel': 'YouTube or Spotify link',
  'music.linkPlaceholder': 'Paste a YouTube or Spotify link',
  'music.add': 'Add link',
  'music.invalid': 'Use a valid YouTube or Spotify link.',
  'music.unavailable': 'Music unavailable. Try again or choose another track.',
  'music.previous': 'Previous track',
  'music.next': 'Next track',
  'music.play': 'Play music',
  'music.pause': 'Pause music',
  'music.volume': 'Music volume:',
  'music.closePlayer': 'Close external player',
  'music.remove': 'Remove {title}',
  'tasks.open': 'Open tasks',
  'tasks.close': 'Close tasks',
  'tasks.eyebrow': 'TODAY\'S FOCUS',
  'tasks.title': 'Tasks',
  'tasks.new': 'New task',
  'tasks.placeholder': 'Add task',
  'tasks.add': 'Add task',
  'mini.open': 'Open floating mini timer',
  'mini.close': 'Close mini timer',
  'mini.progress': 'Session progress',
  'mini.pause': 'Pause timer',
  'mini.resume': 'Resume timer',
  'mini.end': 'End session',
  'mini.notice': 'The browser blocked the floating window. The mini timer opened on this page.',
};

const portuguese = {
  ...english,
  'session.type': 'Tipo de sessão', 'mode.short': 'Pausa curta', 'mode.long': 'Pausa longa',
  'status.ready': 'Pronto para começar', 'status.runningFocus': 'Hora de focar', 'status.runningBreak': 'Hora de descansar', 'status.paused': 'Sessão pausada', 'status.completed': 'Sessão concluída!', 'status.ended': 'Sessão encerrada sem contabilizar',
  'timer.progress': 'Progresso do timer', 'timer.remaining': 'Tempo restante', 'timer.start': 'Começar', 'timer.pause': 'Pausar', 'timer.resume': 'Retomar', 'timer.reset': 'Reiniciar {mode}', 'timer.chooseBreak': 'Escolha uma pausa acima para continuar.',
  'account.profile': 'Perfil de {name}', 'account.signIn': 'Entrar ou criar conta', 'account.settings': 'Configurações', 'account.close': 'Fechar', 'account.space': 'SEU ESPAÇO POMOCUTE', 'account.welcomeBack': 'Boas-vindas de volta', 'account.createTitle': 'Crie sua conta', 'account.syncDescription': 'Sincronize suas tarefas e acompanhe seus focos.', 'account.continueGoogle': 'Continuar com Google', 'account.or': 'ou', 'account.name': 'Nome', 'account.email': 'E-mail', 'account.password': 'Senha', 'account.wait': 'Aguarde...', 'account.createAccount': 'Criar conta', 'account.login': 'Entrar', 'account.createSwitch': 'Quero criar uma conta', 'account.loginSwitch': 'Já tenho uma conta', 'account.passwordHint': 'Use uma senha com pelo menos 8 caracteres.', 'account.confirmEmail': 'Conta criada. Confirme o e-mail enviado para entrar.', 'account.notConfigured': 'A autenticação será ativada assim que as chaves do Supabase forem configuradas.', 'account.eyebrow': 'CONTA', 'account.data': 'Conta e dados', 'account.signOut': 'Sair da conta', 'account.syncPrompt': 'Entre para manter suas tarefas e sessões de foco em qualquer dispositivo.',
  'settings.eyebrow': 'PREFERÊNCIAS', 'settings.title': 'Configurações', 'settings.language': 'Idioma', 'settings.sessionLengths': 'Durações das sessões', 'settings.focus': 'Foco', 'settings.shortBreak': 'Pausa curta', 'settings.longBreak': 'Pausa longa', 'settings.decrease': 'Diminuir {label}', 'settings.increase': 'Aumentar {label}', 'settings.locked': 'As durações ficam bloqueadas enquanto o timer está em andamento ou pausado.', 'settings.alarm': 'Alarme', 'settings.alarmOn': 'Alarme ativado', 'settings.alarmOff': 'Alarme desativado', 'settings.chime': 'Sino suave', 'settings.bell': 'Campainha', 'settings.digital': 'Digital', 'settings.volume': 'Volume do alarme', 'settings.testAlarm': 'Testar alarme',
  'music.open': 'Abrir menu de música', 'music.close': 'Fechar menu de música', 'music.station': 'ESTAÇÃO POMOCUTE', 'music.choose': 'Escolha sua trilha', 'music.selected': 'Selecionada', 'music.playing': 'Tocando', 'music.links': 'SEUS LINKS', 'music.empty': 'Adicione um link do YouTube ou Spotify.', 'music.linkLabel': 'Link do YouTube ou Spotify', 'music.linkPlaceholder': 'Cole um link do YouTube ou Spotify', 'music.add': 'Adicionar link', 'music.invalid': 'Use um link válido do YouTube ou Spotify.', 'music.unavailable': 'Música indisponível. Tente novamente ou escolha outra trilha.', 'music.previous': 'Faixa anterior', 'music.next': 'Próxima faixa', 'music.play': 'Tocar música', 'music.pause': 'Pausar música', 'music.volume': 'Volume da música:', 'music.closePlayer': 'Fechar player externo', 'music.remove': 'Remover {title}',
  'tasks.open': 'Abrir tarefas', 'tasks.close': 'Fechar tarefas', 'tasks.eyebrow': 'FOCO DO DIA', 'tasks.title': 'Tarefas', 'tasks.new': 'Nova tarefa', 'tasks.placeholder': 'Adicionar tarefa', 'tasks.add': 'Adicionar tarefa',
  'mini.open': 'Abrir mini-timer flutuante', 'mini.close': 'Fechar mini-timer', 'mini.progress': 'Progresso da sessão', 'mini.pause': 'Pausar timer', 'mini.resume': 'Retomar timer', 'mini.end': 'Encerrar sessão', 'mini.notice': 'O navegador bloqueou a janela flutuante. O mini-timer abriu nesta página.',
};

const spanish = {
  ...english,
  'session.type': 'Tipo de sesión', 'mode.short': 'Descanso corto', 'mode.long': 'Descanso largo', 'status.ready': 'Listo para empezar', 'status.runningFocus': 'Hora de concentrarse', 'status.runningBreak': 'Hora de descansar', 'status.paused': 'Sesión en pausa', 'status.completed': '¡Sesión completada!', 'status.ended': 'Sesión finalizada sin contar', 'timer.progress': 'Progreso del temporizador', 'timer.remaining': 'Tiempo restante', 'timer.start': 'Empezar', 'timer.pause': 'Pausar', 'timer.resume': 'Reanudar', 'timer.reset': 'Reiniciar {mode}', 'timer.chooseBreak': 'Elige un descanso arriba para continuar.',
  'account.signIn': 'Iniciar sesión o crear cuenta', 'account.settings': 'Configuración', 'account.welcomeBack': 'Bienvenido de nuevo', 'account.createTitle': 'Crea tu cuenta', 'account.syncDescription': 'Sincroniza tus tareas y registra tus sesiones de enfoque.', 'account.continueGoogle': 'Continuar con Google', 'account.name': 'Nombre', 'account.email': 'Correo electrónico', 'account.password': 'Contraseña', 'account.createAccount': 'Crear cuenta', 'account.login': 'Iniciar sesión', 'account.createSwitch': 'Quiero crear una cuenta', 'account.loginSwitch': 'Ya tengo una cuenta', 'account.data': 'Cuenta y datos', 'account.signOut': 'Cerrar sesión',
  'settings.eyebrow': 'PREFERENCIAS', 'settings.title': 'Configuración', 'settings.language': 'Idioma', 'settings.sessionLengths': 'Duración de sesiones', 'settings.focus': 'Enfoque', 'settings.shortBreak': 'Descanso corto', 'settings.longBreak': 'Descanso largo', 'settings.locked': 'Las duraciones se bloquean mientras el temporizador está activo o en pausa.', 'settings.alarm': 'Alarma', 'settings.alarmOn': 'Alarma activada', 'settings.alarmOff': 'Alarma desactivada', 'settings.chime': 'Campanilla', 'settings.bell': 'Campana', 'settings.digital': 'Digital', 'settings.volume': 'Volumen de alarma', 'settings.testAlarm': 'Probar alarma',
  'music.open': 'Abrir menú de música', 'music.close': 'Cerrar menú de música', 'music.choose': 'Elige tu música', 'music.selected': 'Seleccionada', 'music.playing': 'Reproduciendo', 'music.links': 'TUS ENLACES', 'music.empty': 'Añade un enlace de YouTube o Spotify.', 'music.linkPlaceholder': 'Pega un enlace de YouTube o Spotify', 'music.add': 'Añadir enlace', 'music.invalid': 'Usa un enlace válido de YouTube o Spotify.', 'music.previous': 'Pista anterior', 'music.next': 'Pista siguiente', 'music.play': 'Reproducir música', 'music.pause': 'Pausar música', 'music.volume': 'Volumen de música:', 'music.closePlayer': 'Cerrar reproductor externo', 'music.remove': 'Eliminar {title}',
  'tasks.open': 'Abrir tareas', 'tasks.close': 'Cerrar tareas', 'tasks.eyebrow': 'FOCO DE HOY', 'tasks.title': 'Tareas', 'tasks.new': 'Nueva tarea', 'tasks.placeholder': 'Añadir tarea', 'tasks.add': 'Añadir tarea',
  'mini.open': 'Abrir mini temporizador flotante', 'mini.close': 'Cerrar mini temporizador', 'mini.progress': 'Progreso de sesión', 'mini.pause': 'Pausar temporizador', 'mini.resume': 'Reanudar temporizador', 'mini.end': 'Finalizar sesión', 'mini.notice': 'El navegador bloqueó la ventana flotante. El mini temporizador se abrió en esta página.',
};

const french = {
  ...english,
  'session.type': 'Type de session', 'mode.short': 'Pause courte', 'mode.long': 'Pause longue', 'status.ready': 'Prêt à commencer', 'status.runningFocus': 'Moment de se concentrer', 'status.runningBreak': 'Moment de se reposer', 'status.paused': 'Session en pause', 'status.completed': 'Session terminée !', 'status.ended': 'Session terminée sans être comptée', 'timer.progress': 'Progression du minuteur', 'timer.remaining': 'Temps restant', 'timer.start': 'Démarrer', 'timer.pause': 'Pause', 'timer.resume': 'Reprendre', 'timer.reset': 'Réinitialiser {mode}', 'timer.chooseBreak': 'Choisissez une pause ci-dessus pour continuer.',
  'account.signIn': 'Se connecter ou créer un compte', 'account.settings': 'Paramètres', 'account.welcomeBack': 'Bon retour', 'account.createTitle': 'Créez votre compte', 'account.syncDescription': 'Synchronisez vos tâches et suivez vos séances de concentration.', 'account.continueGoogle': 'Continuer avec Google', 'account.name': 'Nom', 'account.email': 'E-mail', 'account.password': 'Mot de passe', 'account.createAccount': 'Créer un compte', 'account.login': 'Se connecter', 'account.createSwitch': 'Créer un compte', 'account.loginSwitch': 'J’ai déjà un compte', 'account.data': 'Compte et données', 'account.signOut': 'Se déconnecter',
  'settings.eyebrow': 'PRÉFÉRENCES', 'settings.title': 'Paramètres', 'settings.language': 'Langue', 'settings.sessionLengths': 'Durées des sessions', 'settings.focus': 'Concentration', 'settings.shortBreak': 'Pause courte', 'settings.longBreak': 'Pause longue', 'settings.locked': 'Les durées sont verrouillées lorsque le minuteur est en cours ou en pause.', 'settings.alarm': 'Alarme', 'settings.alarmOn': 'Alarme activée', 'settings.alarmOff': 'Alarme désactivée', 'settings.chime': 'Carillon', 'settings.bell': 'Cloche', 'settings.digital': 'Numérique', 'settings.volume': 'Volume de l’alarme', 'settings.testAlarm': 'Tester l’alarme',
  'music.open': 'Ouvrir le menu musique', 'music.close': 'Fermer le menu musique', 'music.choose': 'Choisissez votre musique', 'music.selected': 'Sélectionnée', 'music.playing': 'Lecture en cours', 'music.links': 'VOS LIENS', 'music.empty': 'Ajoutez un lien YouTube ou Spotify.', 'music.linkPlaceholder': 'Collez un lien YouTube ou Spotify', 'music.add': 'Ajouter un lien', 'music.invalid': 'Utilisez un lien YouTube ou Spotify valide.', 'music.previous': 'Piste précédente', 'music.next': 'Piste suivante', 'music.play': 'Lire la musique', 'music.pause': 'Mettre la musique en pause', 'music.volume': 'Volume de la musique :', 'music.closePlayer': 'Fermer le lecteur externe', 'music.remove': 'Supprimer {title}',
  'tasks.open': 'Ouvrir les tâches', 'tasks.close': 'Fermer les tâches', 'tasks.eyebrow': 'OBJECTIF DU JOUR', 'tasks.title': 'Tâches', 'tasks.new': 'Nouvelle tâche', 'tasks.placeholder': 'Ajouter une tâche', 'tasks.add': 'Ajouter une tâche',
  'mini.open': 'Ouvrir le mini minuteur flottant', 'mini.close': 'Fermer le mini minuteur', 'mini.progress': 'Progression de la session', 'mini.pause': 'Mettre le minuteur en pause', 'mini.resume': 'Reprendre le minuteur', 'mini.end': 'Terminer la session', 'mini.notice': 'Le navigateur a bloqué la fenêtre flottante. Le mini minuteur s’est ouvert sur cette page.',
};

const german = {
  ...english,
  'session.type': 'Sitzungstyp', 'mode.short': 'Kurze Pause', 'mode.long': 'Lange Pause', 'status.ready': 'Bereit zum Start', 'status.runningFocus': 'Zeit zum Fokussieren', 'status.runningBreak': 'Zeit zum Ausruhen', 'status.paused': 'Sitzung pausiert', 'status.completed': 'Sitzung abgeschlossen!', 'status.ended': 'Sitzung beendet, nicht gezählt', 'timer.progress': 'Timer-Fortschritt', 'timer.remaining': 'Verbleibende Zeit', 'timer.start': 'Starten', 'timer.pause': 'Pausieren', 'timer.resume': 'Fortsetzen', 'timer.reset': '{mode} zurücksetzen', 'timer.chooseBreak': 'Wähle oben eine Pause, um fortzufahren.',
  'account.signIn': 'Anmelden oder Konto erstellen', 'account.settings': 'Einstellungen', 'account.welcomeBack': 'Willkommen zurück', 'account.createTitle': 'Konto erstellen', 'account.syncDescription': 'Synchronisiere Aufgaben und behalte Fokus-Sitzungen im Blick.', 'account.continueGoogle': 'Mit Google fortfahren', 'account.name': 'Name', 'account.email': 'E-Mail', 'account.password': 'Passwort', 'account.createAccount': 'Konto erstellen', 'account.login': 'Anmelden', 'account.createSwitch': 'Konto erstellen', 'account.loginSwitch': 'Ich habe bereits ein Konto', 'account.data': 'Konto und Daten', 'account.signOut': 'Abmelden',
  'settings.eyebrow': 'EINSTELLUNGEN', 'settings.title': 'Einstellungen', 'settings.language': 'Sprache', 'settings.sessionLengths': 'Sitzungsdauer', 'settings.focus': 'Fokus', 'settings.shortBreak': 'Kurze Pause', 'settings.longBreak': 'Lange Pause', 'settings.locked': 'Die Dauer ist gesperrt, solange der Timer läuft oder pausiert ist.', 'settings.alarm': 'Alarm', 'settings.alarmOn': 'Alarm aktiviert', 'settings.alarmOff': 'Alarm deaktiviert', 'settings.chime': 'Klang', 'settings.bell': 'Glocke', 'settings.digital': 'Digital', 'settings.volume': 'Alarmlautstärke', 'settings.testAlarm': 'Alarm testen',
  'music.open': 'Musikmenü öffnen', 'music.close': 'Musikmenü schließen', 'music.choose': 'Wähle deine Musik', 'music.selected': 'Ausgewählt', 'music.playing': 'Wird abgespielt', 'music.links': 'DEINE LINKS', 'music.empty': 'Füge einen YouTube- oder Spotify-Link hinzu.', 'music.linkPlaceholder': 'YouTube- oder Spotify-Link einfügen', 'music.add': 'Link hinzufügen', 'music.invalid': 'Verwende einen gültigen YouTube- oder Spotify-Link.', 'music.previous': 'Vorheriger Titel', 'music.next': 'Nächster Titel', 'music.play': 'Musik abspielen', 'music.pause': 'Musik pausieren', 'music.volume': 'Musiklautstärke:', 'music.closePlayer': 'Externen Player schließen', 'music.remove': '{title} entfernen',
  'tasks.open': 'Aufgaben öffnen', 'tasks.close': 'Aufgaben schließen', 'tasks.eyebrow': 'HEUTIGER FOKUS', 'tasks.title': 'Aufgaben', 'tasks.new': 'Neue Aufgabe', 'tasks.placeholder': 'Aufgabe hinzufügen', 'tasks.add': 'Aufgabe hinzufügen',
  'mini.open': 'Schwebenden Mini-Timer öffnen', 'mini.close': 'Mini-Timer schließen', 'mini.progress': 'Sitzungsfortschritt', 'mini.pause': 'Timer pausieren', 'mini.resume': 'Timer fortsetzen', 'mini.end': 'Sitzung beenden', 'mini.notice': 'Der Browser hat das schwebende Fenster blockiert. Der Mini-Timer wurde auf dieser Seite geöffnet.',
};

const dictionaries = { en: english, 'pt-BR': portuguese, es: spanish, fr: french, de: german };
const I18nContext = createContext({ language: 'en', t: key => key });

function interpolate(text, values) {
  return text.replace(/\{(\w+)\}/g, (_, key) => values?.[key] ?? `{${key}}`);
}

export function I18nProvider({ language, children }) {
  const normalizedLanguage = dictionaries[language] ? language : 'en';
  const value = useMemo(() => ({
    language: normalizedLanguage,
    t: (key, values) => interpolate(dictionaries[normalizedLanguage][key] || english[key] || key, values),
  }), [normalizedLanguage]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
