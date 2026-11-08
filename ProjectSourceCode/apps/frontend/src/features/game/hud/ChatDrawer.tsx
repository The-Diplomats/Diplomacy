import { ArrowUp, Plus, RefreshCcw, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';

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
import { type Power, POWER_COLORS } from '../../map/powers';

type PlayablePower = Exclude<Power, 'neutral' | 'water'>;

type ChatMessage = {
  id: string;
  power: PlayablePower;
  sender: string;
  text: string;
  time: string;
};

const SELF_POWER: PlayablePower = 'england';

const MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    power: 'france',
    sender: 'France',
    text: 'I propose a DMZ in Burgundy.',
    time: '12:01',
  },
  {
    id: 'm2',
    power: 'germany',
    sender: 'Germany',
    text: 'Agreed. Belgium together Fall?',
    time: '12:03',
  },
  {
    id: 'm3',
    power: 'england',
    sender: 'You',
    text: 'Bounce in Burgundy is fine. Belgium is yours if you support me into Munich.',
    time: '12:04',
  },
  {
    id: 'm4',
    power: 'germany',
    sender: 'Germany',
    text: 'Hard sell. Tyrolia instead?',
    time: '12:06',
  },
  {
    id: 'm5',
    power: 'england',
    sender: 'You',
    text: 'Spring push to Norway is on. Any support?',
    time: '12:08',
  },
  {
    id: 'm6',
    power: 'russia',
    sender: 'Russia',
    text: 'Not from me. Taking StP myself this season.',
    time: '12:10',
  },
  { id: 'm7', power: 'italy', sender: 'Italy', text: 'Austria, want to Lepanto?', time: '12:12' },
  {
    id: 'm8',
    power: 'austria',
    sender: 'Austria',
    text: 'Only if you keep Venice stationed.',
    time: '12:13',
  },
];

type Props = {
  onClose: () => void;
};

export function ChatDrawer({ onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(MESSAGES);
  const [draft, setDraft] = useState('');

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (text === '') {
      return;
    }

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      power: SELF_POWER,
      sender: 'You',
      text: text,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
    };

    setMessages([...messages, newMessage]);
    setDraft('');
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
              {messages.map((message) => {
                const self = message.power === SELF_POWER;
                const color = POWER_COLORS[message.power].fill;
                return (
                  <MessageScrollerItem key={message.id} messageId={message.id}>
                    <Message align={self ? 'end' : 'start'}>
                      {!self && (
                        <MessageAvatar className="h-8 w-8">
                          <div
                            className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {message.sender.slice(0, 2).toUpperCase()}
                          </div>
                        </MessageAvatar>
                      )}
                      <MessageContent className="max-w-[80%]">
                        {!self && (
                          <MessageHeader className="px-0">
                            <span className="text-foreground">{message.sender}</span>
                            <span className="ml-2 text-muted-foreground/70">{message.time}</span>
                          </MessageHeader>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2 text-sm ${
                            self ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                          }`}
                        >
                          {message.text}
                        </div>
                        {self && (
                          <div className="px-1 text-[10px] text-muted-foreground">
                            {message.time}
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
          <Button variant="ghost" size="icon-sm" type="button" aria-label="Attach">
            <Plus />
          </Button>
          <input
            aria-label="Message"
            type="text"
            placeholder="Send a message"
            className="flex-1 bg-transparent px-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" size="icon-sm" className="rounded-full" aria-label="Send">
            <ArrowUp />
          </Button>
        </form>
      </div>
    </Card>
  );
}
