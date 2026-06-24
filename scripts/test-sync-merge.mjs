/**
 * Sync merge tests — conversations from two devices combine correctly.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import vm from 'vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(join(root, 'js/conversations.js'), 'utf8');
vm.runInThisContext(code);

let passed = 0;
let failed = 0;

function check(name, ok) {
  if (ok) {
    console.log('OK', name);
    passed++;
  } else {
    console.log('FAIL', name);
    failed++;
  }
}

const web = {
  activeId: 'c_web',
  updatedAt: 100,
  conversations: [{
    id: 'c_web',
    title: 'How do beads work',
    updatedAt: 100,
    createdAt: 50,
    messages: [
      { role: 'user', text: 'how do beads work', at: 60 },
      { role: 'assistant', text: 'Beads are craft tokens.', at: 70 }
    ],
    adamState: { teachMode: false, lastTopic: 'betting', lastBettingSubtopic: 'overview' }
  }]
};

const mobile = {
  activeId: 'c_mob',
  updatedAt: 200,
  conversations: [{
    id: 'c_mob',
    title: 'Teach me',
    updatedAt: 200,
    createdAt: 150,
    messages: [
      { role: 'user', text: 'teach me', at: 160 },
      { role: 'assistant', text: 'Brief summary here.', at: 170 }
    ],
    adamState: { teachMode: true, lastTopic: 'general', lastBettingSubtopic: 'overview' }
  }]
};

const merged = adamConversations._mergeRemote(web, mobile);
check('merge keeps both conversations', merged.conversations.length === 2);
check('merge keeps web messages', merged.conversations.some(c => c.id === 'c_web' && c.messages.length === 2));
check('merge keeps mobile messages', merged.conversations.some(c => c.id === 'c_mob' && c.messages.length === 2));
check('merge keeps local activeId when pinned', merged.activeId === 'c_web');
const mergedRemotePick = adamConversations._mergeRemote(web, mobile);
check('merge without pin prefers local active', mergedRemotePick.activeId === 'c_web');
const mergedPin = adamConversations._mergeRemote(web, mobile, { keepActiveId: 'c_mob' });
check('merge with pin keeps chosen chat', mergedPin.activeId === 'c_mob');

const sameIdA = {
  id: 'c1',
  title: 'Old title',
  updatedAt: 100,
  messages: [{ role: 'user', text: 'hi', at: 10 }],
  adamState: { teachMode: false, lastTopic: 'general', lastBettingSubtopic: 'overview' }
};
const sameIdB = {
  id: 'c1',
  title: 'New title',
  updatedAt: 300,
  messages: [{ role: 'assistant', text: 'hello', at: 20 }],
  adamState: { teachMode: true, lastTopic: 'vent', lastBettingSubtopic: 'overview' }
};
const pair = adamConversations._mergeConversationPair(sameIdA, sameIdB);
check('same id merges messages', pair.messages.length === 2);
check('same id keeps newer title', pair.title === 'New title');

const withDelete = {
  activeId: 'c_keep',
  updatedAt: 500,
  deletedConversationIds: { c_gone: 500 },
  conversations: [{
    id: 'c_keep',
    title: 'Keep me',
    updatedAt: 500,
    createdAt: 400,
    messages: [],
    adamState: { teachMode: false, lastTopic: 'general', lastBettingSubtopic: 'overview' }
  }]
};
const cloudStillHasDeleted = {
  activeId: 'c_gone',
  updatedAt: 100,
  conversations: [
    {
      id: 'c_gone',
      title: 'Failed chat',
      updatedAt: 100,
      createdAt: 50,
      messages: [{ role: 'user', text: 'oops', at: 60 }],
      adamState: { teachMode: false, lastTopic: 'general', lastBettingSubtopic: 'overview' }
    },
    {
      id: 'c_keep',
      title: 'Keep me',
      updatedAt: 400,
      createdAt: 300,
      messages: [],
      adamState: { teachMode: false, lastTopic: 'general', lastBettingSubtopic: 'overview' }
    }
  ]
};
const afterDeleteMerge = adamConversations._mergeRemote(withDelete, cloudStillHasDeleted);
check('delete tombstone removes chat', !afterDeleteMerge.conversations.some(c => c.id === 'c_gone'));
check('delete tombstone keeps other chats', afterDeleteMerge.conversations.some(c => c.id === 'c_keep'));
check('delete tombstone preserved', afterDeleteMerge.deletedConversationIds?.c_gone === 500);

console.log(`\nPassed ${passed} / ${passed + failed}`);
process.exit(failed ? 1 : 0);