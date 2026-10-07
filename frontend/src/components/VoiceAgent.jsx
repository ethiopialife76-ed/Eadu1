import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, Sparkles, Volume2, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { miscService } from '../services';
import { useAuth } from '../store/authStore';

export default function VoiceAgent() {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Selam. I am the ProjectMarket DBU voice assistant. Visitors can ask how to register, find projects, form teams, or request a supervisor. Speak or type.',
    },
  ]);
  const recRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  const send = async (text) => {
    const message = (text || input).trim();
    if (!message) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setBusy(true);
    try {
      const data = await miscService.voice({ message, path: location.pathname });
      setMessages((m) => [...m, { role: 'assistant', text: data.reply }]);
      speak(data.reply);
      const nav = data.actions?.find((a) => a.type === 'navigate');
      if (nav?.to) navigate(nav.to);
    } catch {
      const fallback = 'I could not reach the assistant service. Check that the API is running.';
      setMessages((m) => [...m, { role: 'assistant', text: fallback }]);
    } finally {
      setBusy(false);
    }
  };

  const toggleListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Voice input needs Chrome or Edge. You can still type to me.' },
      ]);
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const said = e.results[0][0].transcript;
      setListening(false);
      send(said);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  useEffect(() => () => recRef.current?.stop(), []);

  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-dbu-600 text-white shadow-lg hover:bg-dbu-700"
        onClick={() => setOpen(true)}
        aria-label="Open Selam voice assistant"
      >
        <Sparkles className="h-6 w-6" />
      </button>
      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[520px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-dbu-700 px-4 py-3 text-white">
            <div>
              <p className="font-display text-lg">Selam</p>
              <p className="text-xs text-white/80">
                DBU AI voice agent {user ? `· ${user.role}` : '· visitor'}
              </p>
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === 'user' ? 'ml-auto bg-dbu-600 text-white' : 'bg-stone-100 text-stone-800'
                }`}
              >
                {m.text}
              </div>
            ))}
            {busy && <p className="text-xs text-stone-500">Selam is thinking…</p>}
          </div>
          <div className="border-t p-3">
            <div className="flex gap-2">
              <button
                className={`rounded-xl p-2 ${listening ? 'bg-rose-600 text-white' : 'bg-stone-100'}`}
                onClick={toggleListen}
                title="Speak"
              >
                {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <input
                className="input"
                placeholder="Ask about projects, teams, login…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button className="btn-primary px-3" onClick={() => send()} disabled={busy}>
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-stone-500">
              <Volume2 className="h-3 w-3" /> Replies are spoken aloud. Allow microphone in the browser.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
