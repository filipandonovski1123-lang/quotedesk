import clsx from 'clsx';
import { Copy, Loader2, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Button, inputCls } from '../../components/ui';
import { smsHref } from '../logic';

/**
 * An editable draft plus "Text them": opens the phone's Messages app with the text filled in, so
 * it goes from the tradie's own number and replies come straight back to them. Records it as sent.
 */
export function SendBox({
  phone,
  name,
  draft,
  onSent,
  onCancel,
  label = 'Text',
  rows = 8,
}: {
  phone: string;
  name: string;
  draft: string;
  /** Saves the send. Runs before Messages opens; may return a changed text (e.g. with a link). */
  onSent: (text: string) => Promise<void>;
  onCancel?: () => void;
  label?: string;
  rows?: number;
}) {
  const [text, setText] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async (how: 'sms' | 'copy') => {
    setBusy(true);
    setError(null);
    try {
      if (how === 'copy') {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
      await onSent(text);
      if (how === 'sms') location.href = smsHref(phone, text);
    } catch {
      setError('Couldn’t save that. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <textarea className={clsx(inputCls, 'text-[13.5px] leading-snug')} rows={rows} value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
      {error && (
        <p role="alert" className="text-[13px] text-bad">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" className="flex-1" disabled={busy || !text.trim()} onClick={() => void go('sms')}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />} {label} {name.split(' ')[0]}
        </Button>
        <Button variant="secondary" disabled={busy || !text.trim()} onClick={() => void go('copy')} title="Copy the text and mark it sent">
          <Copy className="size-4" /> {copied ? 'Copied' : 'Copy'}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Back
          </Button>
        )}
      </div>
      <p className="text-[11.5px] text-ink-3">Opens Messages on your phone with this text ready. It sends from your own number, so replies come straight to you.</p>
    </div>
  );
}
