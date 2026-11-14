import { ArrowUp, RefreshCcw, X } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';

import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from '../../../components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '../../../components/ui/message-scroller';
import { Separator } from '../../../components/ui/separator';
import { useSession } from '../../auth/useSession';
import { POWER_COLORS } from '../../map/powers';
import { useGameMessages, useSendMessage } from '../useChat';

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

type Props = {
  onClose: () => void;
};

export function ChatDrawer({ onClose }: Props) {
  const { id: gameId = '' } = useParams();
  const { data: session } = useSession();
  const { data: messages = [], isPending, isError } = useGameMessages(gameId);
  const sendMessage = useSendMessage(gameId);
  const [draft, setDraft] = useState('');

  function handleSend(event: { preventDefault(): void }) {
    event.preventDefault();
    const text = draft.trim();
    if (text === '' || sendMessage.isPending) {
      return;
    }
    sendMessage.mutate(text, { onSuccess: () => setDraft('') });
  }

  return (
    <Card className="pointer-events-auto flex h-full w-full flex-col gap-0 overflow-hidden bg-card/95 p-0 shadow-xl backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-3">
        <div className="flex flex-col">
          <div className="text-base font-semibold text-foreground">Alliances</div>
          <div className="text-xs text-muted-foreground">Global press · Spring 1902</div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="New chat">
            <RefreshCcw />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close chat">
            <X />
          </Button>
        </div>
      </div>
      <Separator />

      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller>
          <MessageScrollerViewport aria-label="Chat messages">
            <MessageScrollerContent className="gap-4 px-4 py-4">
              {isPending && (
                <p className="text-center text-sm text-muted-foreground">Loading messages...</p>
              )}
              {isError && (
                <p className="text-center text-sm text-muted-foreground">Couldn't load messages.</p>
              )}
              {messages.map((message) => {
                const self = message.fromUsername === session?.username;
                const color = POWER_COLORS[message.fromPower ?? 'neutral'].fill;
                const sender = message.fromUsername ?? 'AI';
                const time = formatTime(message.createdAt);
                return (
                  <MessageScrollerItem key={message.id} messageId={message.id}>
                    <Message align={self ? 'end' : 'start'}>
                      {!self && (
                        <MessageAvatar className="h-8 w-8">
                          <div
                            className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {sender.slice(0, 2).toUpperCase()}
                          </div>
                        </MessageAvatar>
                      )}
                      <MessageContent className="max-w-[80%]">
                        {!self && (
                          <MessageHeader className="px-0">
                            <span className="text-foreground">{sender}</span>
                            <span className="ml-2 text-muted-foreground/70">{time}</span>
                          </MessageHeader>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2 text-sm ${
                            self
                              ? 'self-end px-1 bg-primary text-primary-foreground'
                              : 'self-start bg-muted text-foreground'
                          }`}
                        >
                          {message.text}
                        </div>
                        {self && (
                          <div className="self-end px-1 text-[10px] text-muted-foreground">
                            {time}
                          </div>
                        )}
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                );
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton direction="end" behavior="smooth" />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="p-3">
        <form
          className="flex items-end gap-2 rounded-2xl border border-border bg-muted/40 px-2 py-2"
          onSubmit={handleSend}
        >
          <textarea
            aria-label="Message"
            rows={1}
            placeholder="Send a message"
            className="flex-1 bg-transparent px-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none field-sizing-content max-h-32 resize-none"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button
            type="submit"
            size="icon-sm"
            className="rounded-full"
            aria-label="Send"
            disabled={sendMessage.isPending}
          >
            <ArrowUp />
          </Button>
        </form>
      </div>
    </Card>
  );
}
