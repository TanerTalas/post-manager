import { useState } from 'preact/hooks';

/**
 * A mock-up, exactly as the reference design has it. Nothing is transmitted,
 * which is what the privacy page promises.
 */
export default function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <div>
      <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
        <label class="field">
          <span style="font-size:14px">Your name</span>
          <input class="input" placeholder="Elif Yılmaz" />
        </label>
        <label class="field">
          <span style="font-size:14px">Where I can reach you</span>
          <input class="input" type="email" placeholder="elif@example.com" />
        </label>
      </div>

      <label class="field" style="margin-top:16px">
        <span style="font-size:14px">What&apos;s on your mind</span>
        <textarea
          class="input"
          placeholder="Say as much or as little as you like."
          style="min-height:150px;line-height:1.75"
        />
      </label>

      <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:18px">
        <button class="btn btn-primary" onClick={() => setSent(true)} style="padding:10px 20px;font-size:14px">
          Send it
        </button>
        <span style="font-size:12px;color:color-mix(in srgb, var(--color-text) 55%, transparent)">
          {sent ? 'Prototype: nothing was actually sent.' : 'This form is a mock-up for now.'}
        </span>
      </div>
    </div>
  );
}
