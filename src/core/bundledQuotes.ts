/**
 * The quotes that ship with the app, one pack per language.
 *
 * The Ukrainian pack is the *only* source of Ukrainian quotes: there is no free
 * Ukrainian quote service to call, so these are it rather than a fallback. To
 * keep that simple to live with, everything here is out of copyright — writers
 * long in the public domain, and proverbs that never were in it.
 *
 * The English pack is a fallback: it shows when the quote service can't be
 * reached, which is not a hypothetical, since the `api.quotable.io` that
 * today's source mirrors has already gone off the air for good.
 *
 * English seeded on 2026-09-15 from that source's own `Motivational`,
 * `Inspirational` and `Success` tags, then hand-picked — both packs lean
 * towards getting started rather than towards greatness, because getting
 * started is the procrastination this app is for.
 */

import { inLanguage, type QuotePack } from './quote'

export const ENGLISH_QUOTES: QuotePack = inLanguage('en', [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: "Don't wait. The time will never be just right.", author: 'Napoleon Hill' },
  { text: 'The most effective way to do it, is to do it.', author: 'Amelia Earhart' },
  { text: "It always seems impossible until it's done.", author: 'Nelson Mandela' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
  { text: 'Nothing will work unless you do.', author: 'Maya Angelou' },
  { text: 'Knowing is not enough; we must apply. Willing is not enough; we must do.', author: 'Johann Wolfgang von Goethe' },
  { text: 'A good plan violently executed now is better than a perfect plan executed next week.', author: 'George S. Patton' },
  { text: 'Quality is not an act; it is a habit.', author: 'Aristotle' },
  { text: 'If you fell down yesterday, stand up today.', author: 'H. G. Wells' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: 'What you do today can improve all your tomorrows.', author: 'Ralph Marston' },
  { text: "If you're going through hell, keep going.", author: 'Winston Churchill' },
  { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
  { text: 'By failing to prepare, you are preparing to fail.', author: 'Benjamin Franklin' },
  { text: "You can't cross the sea merely by standing and staring at the water.", author: 'Rabindranath Tagore' },
  { text: 'Effort only fully releases its reward after a person refuses to quit.', author: 'Napoleon Hill' },
  { text: 'There is nothing impossible to him who will try.', author: 'Alexander the Great' },
  { text: 'Do more than dream: work.', author: 'William Arthur Ward' },
  { text: "You just can't beat the person who never gives up.", author: 'Babe Ruth' },
])

export const UKRAINIAN_QUOTES: QuotePack = inLanguage('uk', [
  { text: 'Лиш боротись — значить жить!', author: 'Іван Франко' },
  { text: 'Без надії таки сподіваюсь!', author: 'Леся Українка' },
  { text: 'Хто визволиться сам, той буде вільний.', author: 'Леся Українка' },
  { text: 'Борітеся — поборете!', author: 'Тарас Шевченко' },
  { text: 'Учітесь, читайте, і чужому научайтесь, й свого не цурайтесь.', author: 'Тарас Шевченко' },
  { text: 'Бери вершину і матимеш середину.', author: 'Григорій Сковорода' },
  { text: 'Хто любить науку, той ніколи не перестає вчитися.', author: 'Григорій Сковорода' },
  { text: 'Чисте небо не боїться ні блискавки, ні грому.', author: 'Григорій Сковорода' },
  { text: 'Не відкладай на завтра те, що можна зробити сьогодні.', author: 'Народна мудрість' },
  { text: 'Очі бояться, а руки роблять.', author: 'Народна мудрість' },
  { text: 'Під лежачий камінь вода не тече.', author: 'Народна мудрість' },
  { text: 'Без труда нема плода.', author: 'Народна мудрість' },
  { text: 'Терпіння і труд усе перетруть.', author: 'Народна мудрість' },
  { text: 'Крапля камінь точить.', author: 'Народна мудрість' },
  { text: 'Зробив діло — гуляй сміло.', author: 'Народна мудрість' },
  { text: 'Маленька праця краща за велике безділля.', author: 'Народна мудрість' },
  { text: 'Аби руки й охота, буде зроблена робота.', author: 'Народна мудрість' },
  { text: 'Хто дбає, той має.', author: 'Народна мудрість' },
  { text: 'Роботи боятися — щастя не бачити.', author: 'Народна мудрість' },
  { text: 'Хто рано встає, тому Бог дає.', author: 'Народна мудрість' },
])
