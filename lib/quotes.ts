export const QUOTES: { text: string; author: string }[] = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'You are never too old to set another goal or to dream a new dream.', author: 'C.S. Lewis' },
  { text: 'Small steps every day lead to big results over time.', author: 'Unknown' },
  { text: 'Write it. Shoot it. Publish it. Crochet it. Sauté it. Whatever. Make.', author: 'Joss Whedon' },
  { text: 'A journal is your completely unaltered voice.', author: 'Lucy Dacus' },
  { text: 'Fill your paper with the breathings of your heart.', author: 'William Wordsworth' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'In the journal I do not just express myself more openly than I could to any person; I create myself.', author: 'Susan Sontag' },
  { text: 'Progress, not perfection.', author: 'Unknown' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { text: 'The unexamined life is not worth living.', author: 'Socrates' },
  { text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'One day or day one. You decide.', author: 'Unknown' },
  { text: 'Journal writing is a voyage to the interior.', author: 'Christina Baldwin' },
  { text: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
  { text: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'Your present circumstances don\'t determine where you can go; they merely determine where you start.', author: 'Nido Qubein' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Every morning we are born again. What we do today matters most.', author: 'Buddha' },
  { text: 'Writing in a journal reminds you of your goals and of your learning in life.', author: 'Robin Sharma' },
]

export function getRandomQuote(exclude?: number): number {
  let idx: number
  do {
    idx = Math.floor(Math.random() * QUOTES.length)
  } while (idx === exclude && QUOTES.length > 1)
  return idx
}
