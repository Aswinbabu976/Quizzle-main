import React, { useState, useContext, useRef, useEffect } from 'react';
import './Chatbot.sass';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '@/common/contexts/Auth';

const Chatbot = () => {
  const { isAuthenticated, requireAuth } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Quizzle Bot — ask me about quizzes, game rules, or get a fun quiz prompt." }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const handleToggle = () => {
    if (!isAuthenticated) {
      requireAuth(() => setOpen(true));
      return;
    }
    setOpen(o => !o);
  };

  const send = async () => {
    if (!input.trim()) return;
    if (!isAuthenticated) {
      requireAuth(() => {});
      return;
    }

    const userMsg = { role: 'user', content: input.trim() };
    
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setSending(true);

    try {
      // FIX 1: Corrected instantiation of AbortController
      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, history: messages }),
        signal: controller.signal
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Server error');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;
          const dataLine = trimmed.split('\n').find(l => l.startsWith('data: '));
          if (!dataLine) continue;
          try {
            const evt = JSON.parse(dataLine.slice(6));
            if (evt.type === 'chunk') {
              const chunk = evt.chunk || '';
              // FIX 2: Safely update the last assistant message
              setMessages(prev => {
                const copy = [...prev];
                const lastIdx = copy.length - 1;
                if (lastIdx >= 0 && copy[lastIdx].role === 'assistant') {
                  copy[lastIdx] = { 
                    ...copy[lastIdx], 
                    content: copy[lastIdx].content + chunk 
                  };
                }
                return copy;
              });
            } else if (evt.type === 'done') {
              done = true;
            } else if (evt.type === 'error') {
              setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred.' }]);
              done = true;
            }
          } catch (e) {
            console.warn('Failed to parse chat event', e);
          }
        }
      }

      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(l.slice(6));
            if (evt.type === 'chunk') {
              setMessages(prev => {
                const copy = [...prev];
                const lastIdx = copy.length - 1;
                if (lastIdx >= 0 && copy[lastIdx].role === 'assistant') {
                  copy[lastIdx] = { 
                    ...copy[lastIdx], 
                    content: copy[lastIdx].content + (evt.chunk || '') 
                  };
                }
                return copy;
              });
            }
          } catch (e) {}
        }
      }

    } catch (e) {
      console.error('Chat error', e);
      if (e && e.name === 'AbortError') {
        // Handled via cancel button
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
      }
    } finally {
      setSending(false);
      if (abortRef.current) {
        abortRef.current = null;
      }
    }
  };

  return (
    <div className={`chatbot${open ? ' open' : ''}`}>
      <motion.button className="chat-toggle" onClick={handleToggle} whileTap={{ scale: 0.95 }} aria-label="Toggle Chatbot">
        <FontAwesomeIcon icon={faRobot} />
      </motion.button>

      <motion.div className="chat-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: open ? 1 : 0, y: open ? 0 : 20 }} style={{ display: open ? 'flex' : 'none' }}>
        <div className="chat-header">
          <div className="title">Quizzle Bot</div>
          <div className="subtitle">Friendly teacher — powered by Deepseek</div>
        </div>

        <div className="chat-body" role="log">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <div className="content">{m.content}</div>
            </div>
          ))}
          {sending && <div className="bubble assistant typing"><span className="dot"/> <span className="dot"/> <span className="dot"/></div>}
        </div>

        <div className="chat-input">
          { !isAuthenticated ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
              <div style={{ flex: 1, color: 'rgba(0,0,0,0.6)' }}>Login to chat with Quizzle Bot</div>
              <button onClick={() => requireAuth(() => setOpen(true))} style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff', border: 'none', padding: '0.5rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer' }}>Login</button>
            </div>
          ) : (
            <>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything — e.g., 'Create a 5-question quiz on planets'"
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
              />

              {sending ? (
                <>
                  <button className="cancel-btn" onClick={() => {
                    try {
                      if (abortRef.current) abortRef.current.abort();
                    } catch (e) { console.warn('Abort failed', e); }
                    if (abortRef.current) abortRef.current = null;
                    setSending(false);
                    setMessages(prev => {
                      const copy = [...prev];
                      const last = copy.length - 1;
                      if (copy[last] && copy[last].role === 'assistant') {
                        copy[last] = { ...copy[last], content: (copy[last].content || '') + '\n\n— (response cancelled)' };
                        return copy;
                      }
                      return [...copy, { role: 'assistant', content: '(response cancelled)' }];
                    });
                  }} aria-label="Cancel">Cancel</button>

                  <button disabled className="send-disabled" aria-label="Send disabled">
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={send} disabled={sending || !input.trim()} aria-label="Send">
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </>
              )}
            </>
          ) }
        </div>
      </motion.div>
    </div>
  );
};

export default Chatbot;